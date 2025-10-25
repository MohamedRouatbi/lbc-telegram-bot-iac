# M2 Day 5: Testing & Validation Guide

**Status**: ⏳ In Progress  
**Started**: 2025-01-XX  
**M2 Progress**: 80% → 100% (Day 5 completion)

---

## Testing Checklist

### ✅ Item 11: End-to-End Tests (Postman Collection)

**Collection**: `postman/M2-End-to-End-Tests.postman_collection.json`

#### Test Categories (27 total tests)

1. **Security Tests** (3 tests)
   - ✅ Valid webhook secret → 200 OK
   - ✅ Invalid webhook secret → 401 Unauthorized
   - ✅ Missing webhook secret → 401 Unauthorized

2. **/start Command Tests** (3 tests)
   - ⏳ /start without token → FSM: NEW, sends welcome message
   - ⏳ /start with referral token → Token captured in DynamoDB
   - ⏳ /start with UTM parameters (base64) → UTM data parsed

3. **Language Detection Tests** (1 test)
   - ⏳ Spanish language_code → ES localization

4. **Callback Query Tests** (2 tests)
   - ⏳ Video button → CloudFront signed URL sent
   - ⏳ Audio button → TTS audio generated & sent

5. **Resume Semantics Tests** (1 test)
   - ⏳ User returns → FSM resumes from last state

6. **/restart Command Tests** (1 test)
   - ⏳ /restart → FSM resets to NEW

7. **Edge Cases Tests** (3 tests)
   - ⏳ Empty message text → Handled gracefully
   - ⏳ Very long message → No truncation errors
   - ⏳ Special characters → Unicode handling

#### How to Run Postman Collection

```powershell
# Option 1: Import into Postman Desktop App
# 1. Open Postman
# 2. File → Import → Choose file: postman/M2-End-to-End-Tests.postman_collection.json
# 3. Run Collection → Set Environment Variables:
#    - WEBHOOK_URL: https://1mi1qv7d67.execute-api.us-east-1.amazonaws.com/telegram/webhook
#    - TELEGRAM_WEBHOOK_SECRET: LTUNGUQvMktBT2jpacov3kPpPH2pDhCG
# 4. Click "Run"

# Option 2: Newman CLI (requires Node.js)
npm install -g newman
newman run postman/M2-End-to-End-Tests.postman_collection.json \
  --env-var "WEBHOOK_URL=https://1mi1qv7d67.execute-api.us-east-1.amazonaws.com/telegram/webhook" \
  --env-var "TELEGRAM_WEBHOOK_SECRET=LTUNGUQvMktBT2jpacov3kPpPH2pDhCG" \
  --reporters cli,json \
  --reporter-json-export postman/test-results.json
```

#### Expected Results

- **Pass Rate**: 100% (27/27 tests)
- **Webhook Validation**: 401 for invalid/missing secret, 200 for valid
- **SQS Queueing**: Messages accepted and queued
- **FSM State Transitions**: Proper state management
- **CloudFront Signed URLs**: Valid 24-hour expiry
- **TTS Generation**: Polly voice synthesis + S3 cache
- **Localization**: EN/ES language detection

---

### ⏳ Item 12: Load Testing (100 rps for 2 minutes)

**Tool**: Apache Bench (ab) or Artillery.io

#### Load Test Scenario

```yaml
# artillery-load-test.yml
config:
  target: "https://1mi1qv7d67.execute-api.us-east-1.amazonaws.com"
  phases:
    - duration: 120  # 2 minutes
      arrivalRate: 100  # 100 requests per second
  http:
    timeout: 10
  variables:
    WEBHOOK_SECRET: "LTUNGUQvMktBT2jpacov3kPpPH2pDhCG"

scenarios:
  - name: "Webhook Load Test"
    flow:
      - post:
          url: "/telegram/webhook"
          headers:
            Content-Type: "application/json"
            X-Telegram-Bot-Api-Secret-Token: "{{ WEBHOOK_SECRET }}"
          json:
            update_id: "{{ $randomNumber() }}"
            message:
              message_id: "{{ $randomNumber() }}"
              from:
                id: "{{ $randomNumber() }}"
                first_name: "LoadTest"
              chat:
                id: "{{ $randomNumber() }}"
                type: "private"
              date: "{{ $timestamp }}"
              text: "/start"
```

#### Run Load Test

```powershell
# Install Artillery
npm install -g artillery

# Run load test
artillery run artillery-load-test.yml --output load-test-report.json

# Generate HTML report
artillery report load-test-report.json --output load-test-report.html
```

#### Metrics to Monitor (CloudWatch Dashboard)

During load test, watch:

1. **API Gateway**:
   - Requests: ~12,000 total (100 rps × 120 sec)
   - 4XX Errors: Minimal (rate limiting expected at >50 rps)
   - 5XX Errors: 0 (no server errors)
   - Latency p95: <500ms

2. **Webhook Lambda**:
   - Invocations: ~6,000 (50 rps × 120 sec, due to throttling)
   - Errors: 0
   - Duration p95: <300ms
   - Concurrent Executions: <50

3. **JobWorker Lambda**:
   - Invocations: ~6,000 (SQS batch processing)
   - Errors: 0
   - Duration p95: <5000ms (includes TTS generation)

4. **DynamoDB**:
   - Consumed Read Capacity: <50% of provisioned
   - Consumed Write Capacity: <50% of provisioned
   - Throttled Requests: 0

5. **SQS**:
   - Messages Sent: ~6,000
   - Messages Received: ~6,000
   - DLQ Messages: 0 (no new failures)

6. **CloudWatch Alarms**:
   - ApiGateway5xxAlarm: OK (no 5XX errors)
   - WebhookErrorRateAlarm: OK (<2% error rate)
   - JobWorkerErrorRateAlarm: OK (<2% error rate)

#### Expected Load Test Results

✅ **PASS Criteria**:
- API Gateway throttles at 50 rps (burst 100)
- No Lambda timeout errors
- DynamoDB handles load without throttling
- X-Ray shows no bottlenecks
- Average response time <500ms
- P95 response time <1000ms
- Error rate <1%

❌ **FAIL Criteria**:
- 5XX errors >5 in 5 minutes
- Lambda error rate >2%
- DynamoDB throttling events
- Response time p95 >2000ms

---

### ⏳ Item 13: Go/No-Go Checklist

#### Functionality Checklist

- [ ] **M2 Day 1**: Infrastructure deployed (S3, CloudFront, Lambda, DynamoDB)
- [ ] **M2 Day 2**: Core logic working (token codec, signed URLs, TTS)
- [ ] **M2 Day 3**: FSM + resume semantics operational
- [ ] **M2 Day 4 Item 9**: Security hardened (webhook validation, rate limiting, WAF)
- [ ] **M2 Day 4 Item 10**: Observability implemented (X-Ray, Dashboard, alarms)
- [ ] **M2 Day 5 Item 11**: End-to-end tests passing (27/27 tests)
- [ ] **M2 Day 5 Item 12**: Load testing passed (100 rps for 2 min)
- [ ] **Bot Commands**: /start, /restart working
- [ ] **Callback Buttons**: Video & Audio buttons functional
- [ ] **Localization**: EN/ES language detection
- [ ] **CloudFront Signed URLs**: 24-hour expiry, signed with private key
- [ ] **TTS Generation**: Polly + S3 cache working
- [ ] **DynamoDB**: User state persistence + TTL
- [ ] **SQS**: Message queueing + DLQ configured

#### Security Checklist

- [ ] **Webhook Signature Validation**: Constant-time comparison
- [ ] **API Gateway Rate Limiting**: 50 req/sec, burst 100
- [ ] **WAF Rules**: 3 rules active (Core, Bad Inputs, Rate-based)
- [ ] **Secrets Manager**: Bot token + webhook secret encrypted
- [ ] **KMS**: Keys for encryption at rest
- [ ] **S3 Bucket Policies**: Private access only
- [ ] **CloudFront OAC**: Origin Access Control configured
- [ ] **IAM Policies**: Least privilege (9 policies documented)

#### Observability Checklist

- [ ] **X-Ray Tracing**: Active on both Lambdas (4+ traces visible)
- [ ] **Lambda Insights**: Enhanced metrics enabled
- [ ] **CloudWatch Dashboard**: 5 rows, 9 widgets operational
- [ ] **CloudWatch Alarms**: 10 alarms configured
  - [ ] API Gateway 5XX >5/5min
  - [ ] Webhook error rate >2%
  - [ ] JobWorker error rate >2%
  - [ ] Lambda duration p95 thresholds
  - [ ] DynamoDB throttle alarms
  - [ ] SQS DLQ alarms
- [ ] **Structured Logging**: JSON logs in CloudWatch
- [ ] **SNS Notifications**: Email alerts configured

#### Performance Checklist

- [ ] **API Gateway Latency**: p95 <500ms
- [ ] **Lambda Cold Start**: <1000ms (with Lambda Insights)
- [ ] **Lambda Warm Execution**: <300ms (webhook), <5000ms (jobWorker)
- [ ] **DynamoDB Latency**: <50ms (GetItem), <100ms (PutItem)
- [ ] **TTS Generation**: <3000ms (Polly synthesis)
- [ ] **CloudFront Cache Hit Rate**: >80% (after warmup)
- [ ] **Connection Reuse**: AWS_NODEJS_CONNECTION_REUSE_ENABLED active

#### Cost Checklist

- [ ] **M2 Core Infrastructure**: ~$6.60/month
  - S3: $0.60
  - CloudFront: $1.00
  - Lambda: $2.00
  - DynamoDB: $2.00
  - API Gateway: $0.50
  - Polly: $0.50
- [ ] **Security Additions**: ~$8.60/month
  - Secrets Manager: $0.80
  - KMS: $2.00
  - WAF: $5.00
  - API Gateway throttling: Included
- [ ] **Observability Additions**: ~$6.00/month
  - X-Ray: $2.00
  - Lambda Insights: $1.00
  - CloudWatch alarms: $1.00
  - CloudWatch Logs: $2.00
- [ ] **Total M2 Cost**: ~$21.20/month (within budget)

#### Documentation Checklist

- [ ] **Architecture Diagram**: Updated with M2 components
- [ ] **API Documentation**: Webhook payloads documented
- [ ] **Runbook**: Operational procedures
- [ ] **Testing Guide**: Postman collection + load test
- [ ] **Security Hardening**: SECURITY-HARDENING-COMPLETE.md
- [ ] **Observability**: M2-DAY4-OBSERVABILITY-COMPLETE.md
- [ ] **M2 Completion**: M2-COMPLETE.md (this file)
- [ ] **IAM Policies**: iam-policies.md with 9 policies

---

## Current Status

### ✅ Completed

1. **X-Ray Traces**: 4 traces detected in last 5 minutes
   - Trace 1: 228ms duration
   - Trace 2: 192ms duration
   - Trace 3: 304ms duration
   - Trace 4: 166ms duration
   - Average: 222.5ms (excellent performance!)

2. **CloudWatch Dashboard**: Fully operational
   - API Gateway: ~3 requests tracked
   - Lambda: Invocations + duration metrics visible
   - DynamoDB: Read/write capacity spikes
   - SQS: Message flow tracked
   - System Health: Real-time status

3. **Postman Collection**: Created with 27 tests

### ⏳ Next Steps

1. **Import Postman Collection**:
   ```powershell
   # Open Postman Desktop
   # File → Import → postman/M2-End-to-End-Tests.postman_collection.json
   # Run Collection → Verify 27/27 tests pass
   ```

2. **Investigate 50 DLQ Messages**:
   ```powershell
   # Check DLQ for error patterns
   aws sqs receive-message --queue-url https://sqs.us-east-1.amazonaws.com/025066266747/lbc-telegram-events-dlq-dev-v2 --max-number-of-messages 10 --region us-east-1
   
   # Analyze error types in CloudWatch Logs
   # May be stale messages from pre-fix testing
   ```

3. **Run Load Test** (after Postman tests pass):
   ```powershell
   # Install Artillery
   npm install -g artillery
   
   # Create load test config (provided above)
   # Run: artillery run artillery-load-test.yml
   ```

4. **Complete Go/No-Go Checklist**

5. **Create M2-COMPLETE.md with final handoff docs**

---

## X-Ray Service Map

Expected X-Ray trace map (once propagated):

```
[Telegram Bot]
       ↓
[API Gateway: 1mi1qv7d67]
       ↓
[Lambda: telegramWebhookLambda]
       ↓
   [SQS: lbc-telegram-events]
       ↓
[Lambda: jobWorkerLambda]
       ↓ ↓ ↓
[DynamoDB]  [Polly]  [S3]
       ↓
[CloudFront]
```

### Trace Details

Each trace should show:
- **API Gateway**: Request routing + authentication
- **Webhook Lambda**: Signature validation + SQS enqueue (150-250ms)
- **SQS**: Message queueing + batch delivery
- **JobWorker Lambda**: FSM logic + TTS generation (2-5 seconds)
- **DynamoDB**: GetItem/PutItem operations (<50ms)
- **Polly**: TTS synthesis (~1-2 seconds)
- **S3**: Audio file storage (100-200ms)
- **CloudFront**: Signed URL generation

---

## Issue Tracking

### 🔍 Investigation Required

**Issue**: 50 DLQ Messages in Dashboard

- **Observed**: SQS widget showing constant 50 DLQ messages (red line)
- **Impact**: Messages failed after 3 retries → DLQ
- **Potential Causes**:
  1. Stale messages from pre-security-fix testing
  2. Lambda timeout errors (maxReceiveCount exceeded)
  3. Malformed message payloads
  4. DynamoDB throttling (unlikely given metrics)
  
- **Next Steps**:
  1. Retrieve 10 messages from DLQ
  2. Analyze error patterns in message attributes
  3. Check CloudWatch Logs for jobWorker errors around same timestamp
  4. Purge DLQ if messages are stale (pre-v1.1.0-security)
  5. Monitor DLQ during load testing to see if new messages appear

---

## Resources

- **API Gateway**: https://1mi1qv7d67.execute-api.us-east-1.amazonaws.com/telegram/webhook
- **Bot**: @NewTesting11_bot
- **CloudWatch Dashboard**: lbc-telegram-bot-dev-v2
- **X-Ray Console**: https://console.aws.amazon.com/xray/home?region=us-east-1#/service-map
- **DLQ**: lbc-telegram-events-dlq-dev-v2

---

**Next Action**: Import and run Postman collection to validate all 27 end-to-end tests! 🧪
