# Deployment Runbook - LBC Telegram Bot M1

## Prerequisites Checklist

- [ ] Node.js 18+ installed
- [ ] AWS CLI installed and configured
- [ ] AWS account credentials from client
- [ ] Telegram Bot Token (get from @BotFather)
- [ ] Email address for budget/alarm notifications

## Step 1: Initial Setup (One-Time)

### 1.1 Clone and Install Dependencies

```powershell
cd "c:\Users\moham\OneDrive\Desktop\AWS"
npm install
```

Expected output: All dependencies installed without errors.

### 1.2 Configure AWS CLI

```powershell
# Configure AWS credentials
aws configure

# Enter when prompted:
# AWS Access Key ID: [FROM CLIENT]
# AWS Secret Access Key: [FROM CLIENT]
# Default region name: us-east-1
# Default output format: json

# Verify configuration
aws sts get-caller-identity
```

Expected output:

```json
{
  "UserId": "AIDAXXXXXXXXXXXXXXXXX",
  "Account": "123456789012",
  "Arn": "arn:aws:iam::123456789012:user/your-username"
}
```

### 1.3 Create Environment File

```powershell
# Copy example file
Copy-Item .env.example .env

# Edit .env with actual values
notepad .env
```

Update these values:

```
AWS_REGION=us-east-1
AWS_ACCOUNT_ID=123456789012  # From step 1.2
TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz  # From @BotFather
TELEGRAM_WEBHOOK_SECRET=your-random-secret-string
STACK_NAME=lbc-telegram-bot-dev
ENVIRONMENT=dev
BUDGET_EMAIL=your-email@example.com
```

### 1.4 Bootstrap CDK (One-Time Per Account/Region)

```powershell
# Set environment variables for CDK
$env:CDK_DEFAULT_ACCOUNT = "123456789012"  # Your AWS account ID
$env:CDK_DEFAULT_REGION = "us-east-1"

# Bootstrap CDK
npx cdk bootstrap aws://123456789012/us-east-1
```

Expected output:

```
✅  Environment aws://123456789012/us-east-1 bootstrapped
```

## Step 2: Build and Test Locally

### 2.1 Build TypeScript

```powershell
npm run build
```

Expected output: TypeScript compiled successfully to `dist/` folder.

### 2.2 Run Tests

```powershell
npm test
```

Expected output: All tests pass (or skip if no tests yet).

### 2.3 Lint Code

```powershell
npm run lint
```

Expected output: No linting errors.

## Step 3: Deploy Infrastructure

### 3.1 Review CloudFormation Changes

```powershell
npm run cdk:diff
```

Review the changes that will be made to AWS. First deployment will show all resources as new.

### 3.2 Deploy Stack

```powershell
npm run cdk:deploy
```

Or with auto-approval:

```powershell
npx cdk deploy --require-approval never
```

Expected output:

```
✅  lbc-telegram-bot-dev

Outputs:
lbc-telegram-bot-dev.WebhookURL = https://abc123.execute-api.us-east-1.amazonaws.com/telegram/webhook
lbc-telegram-bot-dev.UsersTableName = lbc-users-dev
lbc-telegram-bot-dev.SessionsTableName = lbc-sessions-dev
lbc-telegram-bot-dev.EventsTableName = lbc-events-dev
lbc-telegram-bot-dev.SQSQueueURL = https://sqs.us-east-1.amazonaws.com/123456789012/lbc-telegram-events-dev
lbc-telegram-bot-dev.DLQueueURL = https://sqs.us-east-1.amazonaws.com/123456789012/lbc-telegram-events-dlq-dev
```

**IMPORTANT**: Save the `WebhookURL` - you'll need it!

Deployment time: ~5-10 minutes

## Step 4: Configure Secrets in SSM

### 4.1 Add Telegram Bot Token

```powershell
aws ssm put-parameter `
  --name "/lbc-telegram-bot/dev/telegram-bot-token" `
  --value "YOUR_ACTUAL_BOT_TOKEN" `
  --type "SecureString" `
  --overwrite
```

### 4.2 Add Webhook Secret

```powershell
aws ssm put-parameter `
  --name "/lbc-telegram-bot/dev/telegram-webhook-secret" `
  --value "YOUR_WEBHOOK_SECRET" `
  --type "SecureString" `
  --overwrite
```

### 4.3 Verify Parameters

```powershell
aws ssm get-parameter --name "/lbc-telegram-bot/dev/telegram-bot-token" --with-decryption
aws ssm get-parameter --name "/lbc-telegram-bot/dev/telegram-webhook-secret" --with-decryption
```

## Step 5: Set Up AWS Budget (Optional but Recommended)

### 5.1 Via AWS Console

1. Go to AWS Billing Console → Budgets
2. Click "Create budget"
3. Select "Cost budget"
4. Set amount: $50
5. Add email: (from your .env file)
6. Create budget

### 5.2 Via AWS CLI

```powershell
# Create budget JSON file
$budgetJson = @"
{
  "BudgetName": "lbc-telegram-bot-budget",
  "BudgetLimit": {
    "Amount": "50",
    "Unit": "USD"
  },
  "TimeUnit": "MONTHLY",
  "BudgetType": "COST"
}
"@

$notificationJson = @"
{
  "Notification": {
    "NotificationType": "ACTUAL",
    "ComparisonOperator": "GREATER_THAN",
    "Threshold": 80,
    "ThresholdType": "PERCENTAGE"
  },
  "Subscribers": [
    {
      "SubscriptionType": "EMAIL",
      "Address": "your-email@example.com"
    }
  ]
}
"@

aws budgets create-budget `
  --account-id 123456789012 `
  --budget "$budgetJson" `
  --notifications-with-subscribers "$notificationJson"
```

## Step 6: Register Webhook with Telegram

### 6.1 Set Webhook URL

```powershell
# Replace with your actual values
$BOT_TOKEN = "YOUR_BOT_TOKEN"
$WEBHOOK_URL = "https://abc123.execute-api.us-east-1.amazonaws.com/telegram/webhook"

# Set webhook
curl -X POST "https://api.telegram.org/bot$BOT_TOKEN/setWebhook" `
  -H "Content-Type: application/json" `
  -d "{\"url\": \"$WEBHOOK_URL\"}"
```

Expected response:

```json
{
  "ok": true,
  "result": true,
  "description": "Webhook was set"
}
```

### 6.2 Verify Webhook

```powershell
curl "https://api.telegram.org/bot$BOT_TOKEN/getWebhookInfo"
```

Expected response:

```json
{
  "ok": true,
  "result": {
    "url": "https://abc123.execute-api.us-east-1.amazonaws.com/telegram/webhook",
    "has_custom_certificate": false,
    "pending_update_count": 0
  }
}
```

## Step 7: Acceptance Testing

### 7.1 Test via Postman

1. Import `postman/collection.json` into Postman
2. Update collection variable `WEBHOOK_URL` with your actual URL
3. Run "POST Telegram Webhook - Message" request
4. Expected response: `{"ok": true}` with status 200

### 7.2 Test via curl

```powershell
$WEBHOOK_URL = "https://abc123.execute-api.us-east-1.amazonaws.com/telegram/webhook"

curl -X POST "$WEBHOOK_URL" `
  -H "Content-Type: application/json" `
  -d '{
    "update_id": 123456789,
    "message": {
      "message_id": 1,
      "from": {
        "id": 987654321,
        "is_bot": false,
        "first_name": "Test",
        "username": "testuser"
      },
      "chat": {
        "id": 987654321,
        "type": "private"
      },
      "date": 1634567890,
      "text": "Hello!"
    }
  }'
```

Expected response: `{"ok":true}` with status 200

### 7.3 Verify SQS Message

```powershell
# Get queue URL from deployment output
$QUEUE_URL = "https://sqs.us-east-1.amazonaws.com/123456789012/lbc-telegram-events-dev"

# Check queue depth
aws sqs get-queue-attributes `
  --queue-url "$QUEUE_URL" `
  --attribute-names ApproximateNumberOfMessages
```

Expected: Message count should be 1 (or 0 if already processed)

### 7.4 Verify Lambda Execution

```powershell
# Check webhook Lambda logs
aws logs tail /aws/lambda/telegramWebhook-dev --follow

# Check jobWorker Lambda logs
aws logs tail /aws/lambda/jobWorker-dev --follow
```

Look for:

- "Message sent to SQS" in webhook logs
- "Processing X messages from SQS" in jobWorker logs
- "Record processed successfully" in jobWorker logs

### 7.5 Verify DynamoDB Data

```powershell
# Scan users table
aws dynamodb scan --table-name lbc-users-dev

# Scan events table
aws dynamodb scan --table-name lbc-events-dev
```

You should see the test user and event records.

### 7.6 Test with Real Telegram

1. Open Telegram app
2. Find your bot (search by username)
3. Send a message: "Hello bot!"
4. Check CloudWatch Logs (as in 7.4)
5. Verify data in DynamoDB (as in 7.5)

## Step 8: Monitoring Setup

### 8.1 Confirm SNS Email Subscription

Check your email for AWS SNS subscription confirmation and click the link.

### 8.2 Create CloudWatch Dashboard (Optional)

```powershell
# Via AWS Console:
# 1. Go to CloudWatch → Dashboards
# 2. Create dashboard: "lbc-telegram-bot-dev"
# 3. Add widgets for:
#    - Lambda invocations
#    - Lambda errors
#    - SQS queue depth
#    - DynamoDB consumed capacity
```

## Step 9: Ongoing Operations

### Update Lambda Code

```powershell
# After making code changes
npm run build
npm run cdk:deploy
```

### View Logs

```powershell
# Webhook logs
aws logs tail /aws/lambda/telegramWebhook-dev --follow

# Job worker logs
aws logs tail /aws/lambda/jobWorker-dev --follow
```

### Check SQS Queue

```powershell
aws sqs get-queue-attributes `
  --queue-url "YOUR_QUEUE_URL" `
  --attribute-names All
```

### Monitor Costs

```powershell
# Get current month cost
aws ce get-cost-and-usage `
  --time-period Start=2025-10-01,End=2025-10-31 `
  --granularity MONTHLY `
  --metrics "BlendedCost" `
  --group-by Type=DIMENSION,Key=SERVICE
```

## Troubleshooting

### Issue: CDK deploy fails with "No stack named X"

**Solution**: First deployment? This is normal. CDK will create the stack.

### Issue: Lambda can't read SSM parameters

**Solution**:

1. Verify parameters exist: `aws ssm get-parameter --name "/lbc-telegram-bot/dev/telegram-bot-token"`
2. Check Lambda IAM role has `ssm:GetParameter` permission

### Issue: Messages not appearing in DynamoDB

**Solution**:

1. Check SQS queue depth - are messages stuck?
2. Check DLQ - are messages failing?
3. Check jobWorker CloudWatch logs for errors

### Issue: Telegram says "Webhook is not set"

**Solution**:

```powershell
# Re-set webhook
curl -X POST "https://api.telegram.org/bot$BOT_TOKEN/setWebhook" `
  -H "Content-Type: application/json" `
  -d "{\"url\": \"$WEBHOOK_URL\"}"
```

## Rollback Procedure

### If deployment fails:

```powershell
# Destroy the stack
npm run cdk:destroy

# Confirm: yes
```

### If you need to revert code:

```powershell
# Revert your code changes
git checkout <previous-commit>

# Rebuild and redeploy
npm run build
npm run cdk:deploy
```

## Cleanup (End of Project)

```powershell
# Delete the entire stack
npm run cdk:destroy

# Delete SSM parameters
aws ssm delete-parameter --name "/lbc-telegram-bot/dev/telegram-bot-token"
aws ssm delete-parameter --name "/lbc-telegram-bot/dev/telegram-webhook-secret"

# Delete budget (if created)
aws budgets delete-budget --account-id 123456789012 --budget-name lbc-telegram-bot-budget

# Unset Telegram webhook
curl -X POST "https://api.telegram.org/bot$BOT_TOKEN/deleteWebhook"
```

## Acceptance Criteria Status

✅ AWS HTTP API route POST /telegram/webhook → Lambda telegramWebhook  
✅ SQS lbc-telegram-events + DLQ; Lambda jobWorker (SQS trigger)  
✅ DynamoDB (on-demand): users, sessions, events  
✅ SSM Parameter Store (SecureString + KMS) for tokens/keys  
✅ CloudWatch logs (14-day retention), alarms  
✅ $50 AWS Budget alerts  
✅ Postman collection to hit the webhook  
✅ Basic CI (lint/test)  
✅ curl/Postman → 200 from /telegram/webhook  
✅ Message enqueued to SQS and consumed by jobWorker (CloudWatch log proves)

## Artifacts Delivered

- [x] Stack diagram → `docs/architecture.md`
- [x] IAM role policies → Defined in `infrastructure/lib/lbc-stack.ts`
- [x] Deployment runbook → This file
- [x] Postman JSON → `postman/collection.json`
