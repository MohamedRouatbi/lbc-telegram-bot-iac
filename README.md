# LBC Telegram Bot - AWS Serverless Infrastructure

> **M1 Milestone Complete** - Minimal AWS Stack & Dev Scaffolding

A production-ready serverless Telegram bot built on AWS with Infrastructure-as-Code using AWS CDK.

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

## 🎯 M1 Complete

✅ Infrastructure deployed (30+ AWS resources)  
✅ Telegram webhook working  
✅ Messages stored in DynamoDB  
✅ Unit tests passing (5/5)  
✅ Postman collection ready  
✅ CI/CD pipeline configured  
✅ Documentation complete

---

## 📝 Next Steps

**M2:** Bot commands (/start, /help) + responses  
**M3:** Business features + external APIs  
**M4:** Production hardening + monitoring

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
