# LBC Telegram Bot - AWS Serverless Infrastructure

> **M2 Milestone Complete** ✅ - Onboarding Flow with AI TTS & Media Delivery

A production-ready serverless Telegram bot built on AWS with Infrastructure-as-Code using AWS CDK.

**Features:** `/start` command with referral tracking, welcome video delivery, AI-powered TTS greetings (Amazon Polly), resumable FSM state, S3 pre-signed URLs, bilingual support (EN/ES).

---

## Quick Start for Client

### Prerequisites

- Node.js 18.x or 20.x
- AWS CLI configured with credentials
- AWS Account with appropriate permissions
- Telegram Bot Token (from @BotFather)

### 1. Clone & Install

```bash
git clone https://github.com/MohamedRouatbi/lbc-telegram-bot-iac.git
cd lbc-telegram-bot-iac
npm install
```

### 2. Configure Environment

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your values:
# - AWS_ACCOUNT_ID (your AWS account)
# - TELEGRAM_BOT_TOKEN (from @BotFather)
# - TELEGRAM_WEBHOOK_SECRET (generate random string)
```

### 3. Deploy to AWS

```bash
# Build TypeScript
npm run build

# Deploy infrastructure
npm run cdk:deploy
```

### 4. Test the Bot

Send a message to your Telegram bot - it will be stored in DynamoDB!

---

## 📊 Deployed Infrastructure

### AWS Resources (30+)

- ✅ **2 Lambda Functions** - Webhook handler & Job worker
- ✅ **3 DynamoDB Tables** - Users, Events, Sessions
- ✅ **2 SQS Queues** - Main queue + Dead Letter Queue
- ✅ **1 API Gateway HTTP API** - Webhook endpoint
- ✅ **CloudWatch Logs** - 14-day retention
- ✅ **IAM Roles & Policies** - Least-privilege security
- ✅ **KMS Encryption** - For sensitive data
- ✅ **SSM Parameter Store** - Secure secret storage

### Architecture Flow

```
Telegram Bot → API Gateway → Lambda (webhook) → SQS → Lambda (worker) → DynamoDB
```

---

## 🧪 Testing

### Option 1: Postman Collection

Import `postman/collection.json` - includes 4 test scenarios

### Option 2: Unit Tests

```bash
npm test
npm run test:coverage
```

### Option 3: Live Bot Test

Send message to bot → Check DynamoDB:

```bash
aws dynamodb scan --table-name lbc-events-dev-v2 --limit 5
```

---

## 📋 Available Commands

**Development:**

- `npm run build` - Compile TypeScript
- `npm test` - Run unit tests
- `npm run lint` - Lint code

**AWS Deployment:**

- `npm run cdk:deploy` - Deploy to AWS
- `npm run cdk:diff` - Show changes
- `npm run cdk:destroy` - Delete resources

---

## 🔍 Monitoring

**Lambda Logs:**

```bash
aws logs tail /aws/lambda/telegramWebhook-dev-v2 --follow
aws logs tail /aws/lambda/jobWorker-dev-v2 --follow
```

**DynamoDB:**

```bash
aws dynamodb scan --table-name lbc-users-dev-v2
aws dynamodb scan --table-name lbc-events-dev-v2
```

---

## 🎯 M2 Complete (October 24, 2025)

✅ Infrastructure deployed (40+ AWS resources)  
✅ Telegram webhook working  
✅ `/start` command with referral/UTM tracking  
✅ Welcome video delivery (S3 pre-signed URLs)  
✅ AI TTS greetings (Amazon Polly) with S3 caching  
✅ Resumable FSM state machine  
✅ `/restart` command for QA testing  
✅ User tested and verified working  
✅ **See M2-COMPLETE.md for full details**

---

## 📝 Next Steps

**M3:** Observability (CloudWatch dashboards, X-Ray tracing)  
**M4:** Security hardening (WAF, webhook signature validation)  
**M5:** Production deployment (multi-region, backups)

---

## 💰 Cost: $2-5/month (light usage)

---

## 📞 Documentation

- Testing: `docs/testing.md`
- Architecture: `docs/architecture.md`
- Operations: `docs/runbook.md`

---

**Author:** Mohamed Rouatbi | GitHub: [@MohamedRouatbi](https://github.com/MohamedRouatbi)

**Built with:** AWS CDK | Lambda (Node.js 20.x) | TypeScript | Telegram Bot API

---

**🎉 M1 Milestone - COMPLETE!**
