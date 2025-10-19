# LBC Telegram Bot - Architecture

## System Overview

```
┌─────────────┐
│  Telegram   │
│   Server    │
└──────┬──────┘
       │ HTTPS POST
       │ /telegram/webhook
       ▼
┌─────────────────────────────────┐
│   API Gateway HTTP API          │
│   POST /telegram/webhook        │
└────────────┬────────────────────┘
             │ Invoke
             ▼
┌─────────────────────────────────┐
│  Lambda: telegramWebhook        │
│  • Validate webhook             │
│  • Parse Telegram update        │
│  • Send to SQS                  │
└────────────┬────────────────────┘
             │ SendMessage
             ▼
┌─────────────────────────────────┐
│  SQS: lbc-telegram-events       │
│  • Visibility: 5 min            │
│  • Retention: 4 days            │
│  • DLQ after 3 retries          │
└────────────┬────────────────────┘
             │ Poll (batch 10)
             ▼
┌─────────────────────────────────┐
│  Lambda: jobWorker              │
│  • Process SQS messages         │
│  • Upsert users                 │
│  • Record events                │
└────────────┬────────────────────┘
             │ Write
             ▼
┌─────────────────────────────────┐
│  DynamoDB Tables                │
│  • users (PK: userId)           │
│  • sessions (PK: sessionId)     │
│    - GSI: userId                │
│    - TTL: expiresAt             │
│  • events (PK: eventId)         │
│    - GSI: userId + timestamp    │
└─────────────────────────────────┘

        ┌────────────────┐
        │  SSM Parameter │
        │      Store     │
        │  • bot-token   │
        │  • webhook-key │
        └────────┬───────┘
                 │ GetParameter
                 │ (encrypted via KMS)
                 │
        ┌────────▼───────┐
        │   CloudWatch   │
        │  • Logs (14d)  │
        │  • Alarms      │
        │  • Metrics     │
        └────────────────┘
```

## Component Details

### API Gateway HTTP API
- **Type**: HTTP API (cheaper than REST API)
- **Endpoint**: `POST /telegram/webhook`
- **CORS**: Enabled for POST
- **Cost**: ~$1/million requests

### Lambda: telegramWebhook
- **Runtime**: Node.js 20.x
- **Memory**: 256 MB
- **Timeout**: 30 seconds
- **Concurrency**: Unlimited (pay per use)
- **Responsibilities**:
  1. Receive webhook POST from Telegram
  2. Parse and validate Telegram update
  3. Determine event type (message, callback_query, etc.)
  4. Enqueue to SQS
  5. Return 200 OK to Telegram

### SQS Queue: lbc-telegram-events
- **Type**: Standard queue
- **Visibility Timeout**: 5 minutes (matches Lambda timeout + buffer)
- **Message Retention**: 4 days
- **Encryption**: KMS managed
- **Dead Letter Queue**: After 3 failed processing attempts
- **Purpose**: Decouples webhook receipt from processing

### Lambda: jobWorker
- **Runtime**: Node.js 20.x
- **Memory**: 512 MB
- **Timeout**: 60 seconds
- **Concurrency**: 10 (reserved to control costs)
- **Batch Size**: 10 messages
- **Responsibilities**:
  1. Process batches of SQS messages
  2. Upsert user records in DynamoDB
  3. Record events for audit trail
  4. Handle different event types (message, callback, etc.)

### DynamoDB Tables

#### users
```
PK: userId (String) - format: telegram_{telegramId}
Attributes:
  - telegramId (Number)
  - username (String)
  - firstName (String)
  - lastName (String)
  - languageCode (String)
  - createdAt (ISO8601)
  - updatedAt (ISO8601)
```

#### sessions
```
PK: sessionId (String) - UUID
GSI: UserIdIndex (userId)
TTL: expiresAt (Number) - epoch seconds
Attributes:
  - userId (String)
  - chatId (Number)
  - state (String)
  - data (Map)
  - createdAt (ISO8601)
  - updatedAt (ISO8601)
```

#### events
```
PK: eventId (String) - UUID
GSI: UserIdIndex (userId + timestamp)
Attributes:
  - userId (String)
  - eventType (String)
  - payload (Map)
  - timestamp (ISO8601)
  - processed (Boolean)
```

### SSM Parameter Store
- **Parameters**:
  - `/lbc-telegram-bot/{env}/telegram-bot-token` (SecureString)
  - `/lbc-telegram-bot/{env}/telegram-webhook-secret` (SecureString)
- **Encryption**: KMS customer-managed key
- **Rotation**: Manual (for M1)

### CloudWatch
- **Log Groups**:
  - `/aws/lambda/telegramWebhook-{env}` (14-day retention)
  - `/aws/lambda/jobWorker-{env}` (14-day retention)
- **Alarms**:
  - Lambda errors > 5 in 5 minutes
  - DLQ depth > 0
- **Metrics**: Lambda duration, invocations, errors

## Security Architecture

### IAM Roles

#### telegramWebhook Lambda Role
```json
{
  "Permissions": [
    "sqs:SendMessage (lbc-telegram-events)",
    "logs:CreateLogGroup",
    "logs:CreateLogStream",
    "logs:PutLogEvents"
  ]
}
```

#### jobWorker Lambda Role
```json
{
  "Permissions": [
    "sqs:ReceiveMessage (lbc-telegram-events)",
    "sqs:DeleteMessage (lbc-telegram-events)",
    "sqs:GetQueueAttributes (lbc-telegram-events)",
    "dynamodb:PutItem (users, sessions, events)",
    "dynamodb:GetItem (users, sessions, events)",
    "dynamodb:UpdateItem (users, sessions, events)",
    "dynamodb:Query (sessions, events via GSI)",
    "ssm:GetParameter (/lbc-telegram-bot/{env}/*)",
    "kms:Decrypt (SSM KMS key)",
    "logs:CreateLogGroup",
    "logs:CreateLogStream",
    "logs:PutLogEvents"
  ]
}
```

### Encryption
- **In Transit**: HTTPS (API Gateway, AWS SDK)
- **At Rest**:
  - DynamoDB: AWS-managed encryption
  - SQS: KMS-managed encryption
  - SSM: KMS customer-managed key
  - CloudWatch Logs: AWS-managed encryption

## Cost Breakdown (Estimated)

| Service | Usage | Cost/Month |
|---------|-------|------------|
| API Gateway HTTP API | 100K requests | $0.10 |
| Lambda (webhook) | 100K invocations, 128 MB, 500ms avg | $0.02 |
| Lambda (jobWorker) | 100K invocations, 256 MB, 1s avg | $0.08 |
| DynamoDB | On-demand, 10K writes, 5K reads | $1.50 |
| SQS | 100K requests | $0.04 |
| CloudWatch Logs | 1 GB ingestion, 14-day retention | $0.50 |
| SSM Parameter Store | 2 parameters | $0.00 |
| KMS | 1 key, 1K requests | $1.00 |
| **Total** | | **~$3.24/month** |

## Scalability

- **Current**: ~1-10 messages/second
- **Max (without changes)**: ~1000 messages/second
- **Bottlenecks**:
  1. jobWorker concurrency (10) - easily increased
  2. DynamoDB on-demand (4000 RCU/WCU burst) - auto-scales
  3. SQS throughput (unlimited)

## Monitoring & Observability

### CloudWatch Dashboards
Create custom dashboard with:
- API Gateway request count & latency
- Lambda invocations, errors, duration
- SQS queue depth, age of oldest message
- DLQ depth
- DynamoDB consumed capacity

### Alarms
1. **Critical**: DLQ depth > 0 → SNS email
2. **Warning**: Lambda errors > 5 in 5 min → SNS email
3. **Info**: API Gateway 5XX > 10 in 5 min → SNS email

### X-Ray (Optional for M2)
- Distributed tracing across API Gateway → Lambda → SQS → Lambda → DynamoDB
- Identify bottlenecks and slow queries

## Future Enhancements (Post-M1)

1. **Authentication**: Validate Telegram webhook signature
2. **Rate Limiting**: API Gateway throttling per client
3. **Caching**: ElastiCache for frequently accessed data
4. **Multi-Region**: Route 53 + DynamoDB Global Tables
5. **CI/CD**: GitHub Actions with automated testing
6. **Monitoring**: DataDog or New Relic integration
