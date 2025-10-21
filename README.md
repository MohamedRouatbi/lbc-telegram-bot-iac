# LBC Telegram Bot - AWS Serverless Infrastructure# LBC Telegram Bot - AWS Serverless Infrastructure# LBC Telegram Bot - AWS Serverless Infrastructure# LBC Telegram Bot - Milestone 1



> **M1 Milestone Complete** ✅ - Minimal AWS Stack & Dev Scaffolding



A production-ready serverless Telegram bot built on AWS with Infrastructure-as-Code using AWS CDK.> **M1 Milestone Complete** ✅ - Minimal AWS Stack & Dev Scaffolding



---



## 🚀 Quick Start for ClientA production-ready serverless Telegram bot built on AWS with Infrastructure-as-Code using AWS CDK.> **M1 Milestone Complete** ✅ - Minimal AWS Stack & Dev ScaffoldingServerless AWS stack for handling Telegram webhooks with SQS queue processing and DynamoDB storage.



### Prerequisites

- Node.js 18.x or 20.x

- AWS CLI configured with credentials---

- AWS Account with appropriate permissions

- Telegram Bot Token (from @BotFather)



### 1. Clone & Install## 🚀 Quick Start for ClientA production-ready serverless Telegram bot built on AWS with Infrastructure-as-Code using AWS CDK.## 🏗️ Architecture

```bash

git clone https://github.com/MohamedRouatbi/lbc-telegram-bot-iac.git

cd lbc-telegram-bot-iac

npm install### Prerequisites

```

- Node.js 18.x or 20.x

### 2. Configure Environment

```bash- AWS CLI configured with credentials---- **API Gateway HTTP API**: `/telegram/webhook` endpoint

# Copy environment template

cp .env.example .env- AWS Account with appropriate permissions



# Edit .env with your values:- Telegram Bot Token (from @BotFather)- **Lambda Functions**:

# - AWS_ACCOUNT_ID (your AWS account)

# - TELEGRAM_BOT_TOKEN (from @BotFather)

# - TELEGRAM_WEBHOOK_SECRET (generate random string)

```### 1. Clone & Install## 🚀 **Quick Start for Client**  - `telegramWebhook`: Receives webhook, validates, enqueues to SQS



### 3. Deploy to AWS```bash

```bash

# Build TypeScriptgit clone https://github.com/MohamedRouatbi/lbc-telegram-bot-iac.git  - `jobWorker`: Processes SQS messages, writes to DynamoDB

npm run build

cd lbc-telegram-bot-iac

# Deploy infrastructure

npm run cdk:deploynpm install### **Prerequisites**- **SQS**: `lbc-telegram-events` queue with DLQ

```

```

### 4. Test the Bot

Send a message to your Telegram bot - it will be stored in DynamoDB!- Node.js 18.x or 20.x- **DynamoDB**: `users`, `sessions`, `events` tables (on-demand)



---### 2. Configure Environment



## 📊 Deployed Infrastructure```bash- AWS CLI configured with credentials- **SSM Parameter Store**: Encrypted secrets (KMS)



### AWS Resources (30+)# Copy environment template

- ✅ **2 Lambda Functions** - Webhook handler & Job worker

- ✅ **3 DynamoDB Tables** - Users, Events, Sessionscp .env.example .env- AWS Account with appropriate permissions- **CloudWatch**: Logs (14-day retention) and alarms

- ✅ **2 SQS Queues** - Main queue + Dead Letter Queue

- ✅ **1 API Gateway HTTP API** - Webhook endpoint

- ✅ **CloudWatch Logs** - 14-day retention

- ✅ **IAM Roles & Policies** - Least-privilege security# Edit .env with your values:- Telegram Bot Token (from @BotFather)- **AWS Budget**: $50 alert

- ✅ **KMS Encryption** - For sensitive data

- ✅ **SSM Parameter Store** - Secure secret storage# - AWS_ACCOUNT_ID (your AWS account)



### Architecture Flow# - TELEGRAM_BOT_TOKEN (from @BotFather)

```

Telegram Bot# - TELEGRAM_WEBHOOK_SECRET (generate random string)

    ↓

API Gateway HTTP API```### **1. Clone & Install**## 📋 Prerequisites

    ↓

Lambda (telegramWebhook)

    ↓

SQS Queue### 3. Deploy to AWS```bash

    ↓

Lambda (jobWorker)```bash

    ↓

DynamoDB (Users + Events + Sessions)# Build TypeScriptgit clone https://github.com/MohamedRouatbi/lbc-telegram-bot-iac.git- Node.js 18+ and npm

```

npm run build

---

cd lbc-telegram-bot-iac- AWS CLI configured with credentials

## 🧪 Testing

# Deploy infrastructure

### Option 1: Quick Test (Postman)

1. Import `postman/collection.json` into Postmannpm run cdk:deploynpm install- AWS CDK CLI installed globally: `npm install -g aws-cdk`

2. Collection includes 4 test scenarios

3. Run collection to verify webhook works```



### Option 2: Unit Tests```

```bash

# Run all unit tests### 4. Test the Bot

npm test

Send a message to your Telegram bot - it will be stored in DynamoDB!## 🚀 Quick Start

# Run with coverage

npm run test:coverage

```

---### **2. Configure Environment**

### Option 3: End-to-End Tests

```bash

# Set environment variables

export WEBHOOK_URL=https://YOUR-API-ID.execute-api.us-east-1.amazonaws.com/telegram/webhook## 📊 Deployed Infrastructure```bash### 1. Install Dependencies

export AWS_REGION=us-east-1

export EVENTS_TABLE_NAME=lbc-events-dev-v2

export USERS_TABLE_NAME=lbc-users-dev-v2

### AWS Resources (30+)# Copy environment template

# Run E2E tests

npm run test:e2e- ✅ **2 Lambda Functions** - Webhook handler & Job worker

```

- ✅ **3 DynamoDB Tables** - Users, Events, Sessionscp .env.example .env```bash

### Option 4: Live Bot Test

1. Open Telegram and find your bot- ✅ **2 SQS Queues** - Main queue + Dead Letter Queue

2. Send any message (e.g., "Hello!")

3. Check DynamoDB tables in AWS Console:- ✅ **1 API Gateway HTTP API** - Webhook endpointnpm install

```bash

# View stored messages- ✅ **CloudWatch Logs** - 14-day retention

aws dynamodb scan --table-name lbc-events-dev-v2 --limit 5

- ✅ **IAM Roles & Policies** - Least-privilege security# Edit .env with your values:```

# View user data

aws dynamodb scan --table-name lbc-users-dev-v2 --limit 5- ✅ **KMS Encryption** - For sensitive data

```

- ✅ **SSM Parameter Store** - Secure secret storage# - AWS_ACCOUNT_ID (your AWS account)

---



## 📂 Project Structure

### Architecture Flow# - TELEGRAM_BOT_TOKEN (from @BotFather)### 2. Configure Environment

```

├── src/```

│   ├── lambdas/

│   │   ├── telegramWebhook/    # Receives Telegram webhooksTelegram Bot# - TELEGRAM_WEBHOOK_SECRET (generate random string)

│   │   └── jobWorker/          # Processes messages from SQS

│   └── lib/    ↓

│       ├── dynamodb.ts         # DynamoDB helper functions

│       ├── ssm.ts              # SSM Parameter Store helpersAPI Gateway HTTP API``````bash

│       └── types.ts            # TypeScript type definitions

├── infrastructure/    ↓

│   ├── bin/app.ts              # CDK app entry point

│   └── lib/lbc-stack.ts        # Main CDK stack definitionLambda (telegramWebhook)cp .env.example .env

├── tests/

│   ├── lambdas/                # Unit tests    ↓

│   └── acceptance/             # E2E acceptance tests

├── postman/SQS Queue### **3. Deploy to AWS**# Edit .env with your AWS account details

│   └── collection.json         # Postman test collection

├── docs/    ↓

│   ├── architecture.md         # Architecture documentation

│   ├── testing.md              # Testing guideLambda (jobWorker)```bash```

│   ├── runbook.md              # Operations guide

│   └── iam-policies.md         # IAM policy documentation    ↓

├── .github/

│   └── workflows/ci.yml        # GitHub Actions CI/CDDynamoDB (Users + Events + Sessions)# Build TypeScript

├── .env.example                # Environment template

└── package.json                # Dependencies & scripts```

```

npm run build### 3. Bootstrap CDK (First Time Only)

---

---

## 🔒 Security Features



- ✅ All secrets stored in AWS SSM Parameter Store (encrypted)

- ✅ KMS encryption for DynamoDB tables## 🧪 Testing

- ✅ IAM least-privilege policies

- ✅ VPC-ready (optional - currently public)# Deploy infrastructure```bash

- ✅ CloudWatch monitoring & alarms

- ✅ Dead Letter Queue for failed messages### Option 1: Quick Test (Postman)



---1. Import `postman/collection.json` into Postmannpm run cdk:deploycdk bootstrap aws://ACCOUNT-ID/REGION



## 💰 Cost Estimate2. Collection includes 4 test scenarios



**Expected monthly cost: $2-5 for light usage**3. Run collection to verify webhook works``````



Breakdown:

- Lambda: ~$0.20/million requests

- DynamoDB: ~$1.25/million reads (on-demand)### Option 2: Unit Tests

- API Gateway: $1.00/million requests

- CloudWatch Logs: $0.50/GB```bash

- Data Transfer: Minimal

# Run all unit tests### **4. Test the Bot**### 4. Deploy Infrastructure

*First 12 months may be covered by AWS Free Tier*

npm test

---

Send a message to your Telegram bot - it will be stored in DynamoDB!

## 📋 Available Commands

# Run with coverage

### Development

```bashnpm run test:coverage```bash

npm run build         # Compile TypeScript

npm run watch         # Watch mode compilation```

npm test              # Run unit tests

npm run test:watch    # Tests in watch mode---npm run cdk:deploy

npm run test:coverage # Tests with coverage report

npm run test:e2e      # Run E2E acceptance tests### Option 3: End-to-End Tests

npm run lint          # Lint code

npm run lint:fix      # Fix linting issues```bash```

npm run format        # Format code with Prettier

```# Set environment variables



### AWS Deploymentexport WEBHOOK_URL=https://YOUR-API-ID.execute-api.us-east-1.amazonaws.com/telegram/webhook## 📊 **Deployed Infrastructure**

```bash

npm run cdk:deploy    # Deploy to AWSexport AWS_REGION=us-east-1

npm run cdk:synth     # Synthesize CloudFormation

npm run cdk:diff      # Show deployment changesexport EVENTS_TABLE_NAME=lbc-events-dev-v2### 5. Add Secrets to SSM Parameter Store

npm run cdk:destroy   # Delete all AWS resources

```export USERS_TABLE_NAME=lbc-users-dev-v2



---### **AWS Resources (30+)**



## 🔍 Monitoring & Debugging# Run E2E tests



### View Lambda Logsnpm run test:e2e- ✅ **2 Lambda Functions** - Webhook handler & Job worker```bash

```bash

# Webhook Lambda```

aws logs tail /aws/lambda/telegramWebhook-dev-v2 --follow

- ✅ **3 DynamoDB Tables** - Users, Events, Sessionsaws ssm put-parameter \

# Job Worker Lambda

aws logs tail /aws/lambda/jobWorker-dev-v2 --follow### Option 4: Live Bot Test

```

1. Open Telegram and find your bot- ✅ **2 SQS Queues** - Main queue + Dead Letter Queue  --name "/lbc-telegram-bot/dev/telegram-bot-token" \

### Check SQS Queue

```bash2. Send any message (e.g., "Hello!")

# Get queue attributes

aws sqs get-queue-attributes \3. Check DynamoDB tables in AWS Console:- ✅ **1 API Gateway HTTP API** - Webhook endpoint  --value "YOUR_BOT_TOKEN" \

  --queue-url https://sqs.us-east-1.amazonaws.com/ACCOUNT_ID/lbc-telegram-events-dev-v2 \

  --attribute-names All   ```bash



# Receive messages (for debugging)   # View stored messages- ✅ **CloudWatch Logs** - 14-day retention  --type "SecureString" \

aws sqs receive-message \

  --queue-url https://sqs.us-east-1.amazonaws.com/ACCOUNT_ID/lbc-telegram-events-dev-v2   aws dynamodb scan --table-name lbc-events-dev-v2 --limit 5

```

   - ✅ **IAM Roles & Policies** - Least-privilege security  --overwrite

### Query DynamoDB

```bash   # View user data

# Get all users

aws dynamodb scan --table-name lbc-users-dev-v2   aws dynamodb scan --table-name lbc-users-dev-v2 --limit 5- ✅ **KMS Encryption** - For sensitive data



# Get all events   ```

aws dynamodb scan --table-name lbc-events-dev-v2

- ✅ **SSM Parameter Store** - Secure secret storageaws ssm put-parameter \

# Get specific user

aws dynamodb get-item \---

  --table-name lbc-users-dev-v2 \

  --key '{"userId":{"S":"telegram_YOUR_TELEGRAM_ID"}}'  --name "/lbc-telegram-bot/dev/telegram-webhook-secret" \

```

## 📂 Project Structure

---

### **Architecture**  --value "YOUR_WEBHOOK_SECRET" \

## 🎯 What's Working (M1 Complete)

```

✅ **Infrastructure**

- All AWS resources deployed via CDK├── src/```  --type "SecureString" \

- Infrastructure-as-Code best practices

- Automated deployments│   ├── lambdas/



✅ **Functionality**│   │   ├── telegramWebhook/    # Receives Telegram webhooksTelegram Bot  --overwrite

- Telegram webhook receiving messages

- Messages queued in SQS│   │   └── jobWorker/          # Processes messages from SQS

- Worker processing messages

- Data stored in DynamoDB│   └── lib/    ↓```



✅ **Testing**│       ├── dynamodb.ts         # DynamoDB helper functions

- Unit tests (5/5 passing)

- E2E acceptance tests│       ├── ssm.ts              # SSM Parameter Store helpersAPI Gateway HTTP API

- Postman collection

- CI/CD pipeline│       └── types.ts            # TypeScript type definitions



✅ **Documentation**├── infrastructure/    ↓## 🧪 Testing

- Architecture diagrams

- Testing guides│   ├── bin/app.ts              # CDK app entry point

- Operations runbook

- IAM policy documentation│   └── lib/lbc-stack.ts        # Main CDK stack definitionLambda (telegramWebhook)



---├── tests/



## 📝 Next Steps (Future Milestones)│   ├── lambdas/                # Unit tests    ↓### Run Unit Tests



### M2: Bot Response Logic│   └── acceptance/             # E2E acceptance tests

- Implement bot commands (/start, /help, etc.)

- Add message response handlers├── postman/SQS Queue

- Session management

- User state tracking│   └── collection.json         # Postman test collection



### M3: Business Features├── docs/    ↓```bash

- Custom bot functionality

- Advanced message processing│   ├── architecture.md         # Architecture documentation

- Integration with external APIs

- Analytics & reporting│   ├── testing.md              # Testing guideLambda (jobWorker)npm test



### M4: Production Hardening│   ├── runbook.md              # Operations guide

- Enhanced monitoring & alerting

- Performance optimization│   └── iam-policies.md         # IAM policy documentation    ↓```

- Load testing

- Security audit├── .github/

- Backup & disaster recovery

│   └── workflows/ci.yml        # GitHub Actions CI/CDDynamoDB (Users + Events + Sessions)

---

├── .env.example                # Environment template

## 🐛 Troubleshooting

└── package.json                # Dependencies & scripts```### Test Webhook Endpoint

### Bot not receiving messages?

```bash```

# 1. Check webhook is registered

curl https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getWebhookInfo



# 2. Check Lambda logs---

aws logs tail /aws/lambda/telegramWebhook-dev-v2 --follow

---```bash

# 3. Test webhook manually

aws lambda invoke --function-name telegramWebhook-dev-v2 \## 🔒 Security Features

  --payload file://test-payload.json response.json

```curl -X POST https://YOUR-API-ID.execute-api.REGION.amazonaws.com/telegram/webhook \



### Messages not in DynamoDB?- ✅ All secrets stored in AWS SSM Parameter Store (encrypted)

```bash

# 1. Check SQS queue has messages- ✅ KMS encryption for DynamoDB tables## 🧪 **Testing**  -H "Content-Type: application/json" \

aws sqs get-queue-attributes --queue-url <QUEUE_URL> --attribute-names ApproximateNumberOfMessages

- ✅ IAM least-privilege policies

# 2. Check jobWorker logs

aws logs tail /aws/lambda/jobWorker-dev-v2 --follow- ✅ VPC-ready (optional - currently public)  -d '{"message": {"text": "test"}}'



# 3. Check Dead Letter Queue- ✅ CloudWatch monitoring & alarms

aws sqs receive-message --queue-url <DLQ_URL>

```- ✅ Dead Letter Queue for failed messages### **Option 1: Quick Test (Postman)**```



### Deployment fails?

```bash

# 1. Check AWS credentials---1. Import `postman/collection.json` into Postman

aws sts get-caller-identity



# 2. Verify CDK bootstrap

aws cloudformation describe-stacks --stack-name CDKToolkit## 💰 Cost Estimate2. Collection includes 4 test scenarios### Import Postman Collection



# 3. Check for existing resources

aws cloudformation list-stacks --stack-status-filter CREATE_COMPLETE UPDATE_COMPLETE

```**Expected monthly cost: $2-5 for light usage**3. Run collection to verify webhook works



---



## 📞 Support & DocumentationBreakdown:Import `postman/collection.json` into Postman for easy testing.



- **Testing Guide**: `docs/testing.md`- Lambda: ~$0.20/million requests

- **Architecture**: `docs/architecture.md`

- **Operations**: `docs/runbook.md`- DynamoDB: ~$1.25/million reads (on-demand)### **Option 2: Unit Tests**

- **IAM Policies**: `docs/iam-policies.md`

- API Gateway: $1.00/million requests

---

- CloudWatch Logs: $0.50/GB```bash## 📝 Development Scripts

## 📄 License

- Data Transfer: Minimal

MIT License - See LICENSE file for details

# Run all unit tests

---

*First 12 months may be covered by AWS Free Tier*

## 👨‍💻 Author

npm test- `npm run build` - Compile TypeScript

Mohamed Rouatbi

- GitHub: [@MohamedRouatbi](https://github.com/MohamedRouatbi)---



---- `npm run watch` - Watch mode compilation



## 🙏 Acknowledgments## 📋 Available Commands



Built with:# Run with coverage- `npm test` - Run tests

- AWS CDK

- AWS Lambda (Node.js 20.x)### Development

- TypeScript

- Telegram Bot API```bashnpm run test:coverage- `npm run lint` - Lint code



---npm run build         # Compile TypeScript



**🎉 M1 Milestone - COMPLETE! All infrastructure deployed and tested.**npm run watch         # Watch mode compilation```- `npm run lint:fix` - Fix linting issues


npm test              # Run unit tests

npm run test:watch    # Tests in watch mode- `npm run format` - Format code with Prettier

npm run test:coverage # Tests with coverage report

npm run test:e2e      # Run E2E acceptance tests### **Option 3: End-to-End Tests**- `npm run cdk:deploy` - Deploy stack

npm run lint          # Lint code

npm run lint:fix      # Fix linting issues```bash- `npm run cdk:synth` - Synthesize CloudFormation

npm run format        # Format code with Prettier

```# Set environment variables- `npm run cdk:diff` - Show deployment diff



### AWS Deploymentexport WEBHOOK_URL=https://YOUR-API-ID.execute-api.us-east-1.amazonaws.com/telegram/webhook- `npm run cdk:destroy` - Destroy stack

```bash

npm run cdk:deploy    # Deploy to AWSexport AWS_REGION=us-east-1

npm run cdk:synth     # Synthesize CloudFormation

npm run cdk:diff      # Show deployment changesexport EVENTS_TABLE_NAME=lbc-events-dev-v2## 📂 Project Structure

npm run cdk:destroy   # Delete all AWS resources

```export USERS_TABLE_NAME=lbc-users-dev-v2



---```



## 🔍 Monitoring & Debugging# Run E2E tests├── src/



### View Lambda Logsnpm run test:e2e│   ├── lambdas/          # Lambda function handlers

```bash

# Webhook Lambda```│   ├── lib/              # Shared libraries (DynamoDB, SSM)

aws logs tail /aws/lambda/telegramWebhook-dev-v2 --follow

│   └── utils/            # Utility functions

# Job Worker Lambda

aws logs tail /aws/lambda/jobWorker-dev-v2 --follow### **Option 4: Live Bot Test**├── infrastructure/       # CDK infrastructure code

```

1. Open Telegram and find your bot├── tests/               # Unit and integration tests

### Check SQS Queue

```bash2. Send any message (e.g., "Hello!")├── postman/             # Postman collection

# Get queue attributes

aws sqs get-queue-attributes \3. Check DynamoDB tables in AWS Console:└── docs/                # Documentation

  --queue-url https://sqs.us-east-1.amazonaws.com/ACCOUNT_ID/lbc-telegram-events-dev-v2 \

  --attribute-names All   ```bash```



# Receive messages (for debugging)   # View stored messages

aws sqs receive-message \

  --queue-url https://sqs.us-east-1.amazonaws.com/ACCOUNT_ID/lbc-telegram-events-dev-v2   aws dynamodb scan --table-name lbc-events-dev-v2 --limit 5## 📊 Monitoring

```

   

### Query DynamoDB

```bash   # View user data- **CloudWatch Logs**: `/aws/lambda/telegramWebhook` and `/aws/lambda/jobWorker`

# Get all users

aws dynamodb scan --table-name lbc-users-dev-v2   aws dynamodb scan --table-name lbc-users-dev-v2 --limit 5- **CloudWatch Alarms**: Lambda errors, SQS DLQ depth



# Get all events   ```- **AWS Budget**: Email alerts at $50

aws dynamodb scan --table-name lbc-events-dev-v2



# Get specific user

aws dynamodb get-item \---## 🔒 Security

  --table-name lbc-users-dev-v2 \

  --key '{"userId":{"S":"telegram_YOUR_TELEGRAM_ID"}}'

```

## 📂 **Project Structure**- Secrets stored in SSM Parameter Store with KMS encryption

---

- IAM roles follow least-privilege principle

## 🎯 What's Working (M1 Complete)

```- API Gateway validates webhook signatures

✅ **Infrastructure**

- All AWS resources deployed via CDK├── src/

- Infrastructure-as-Code best practices

- Automated deployments│   ├── lambdas/## 📚 Documentation



✅ **Functionality**│   │   ├── telegramWebhook/    # Receives Telegram webhooks

- Telegram webhook receiving messages

- Messages queued in SQS│   │   └── jobWorker/          # Processes messages from SQS- [Architecture Diagram](docs/architecture.md)

- Worker processing messages

- Data stored in DynamoDB│   └── lib/- [Deployment Runbook](docs/runbook.md)



✅ **Testing**│       ├── dynamodb.ts         # DynamoDB helper functions- [IAM Policies](docs/iam-policies.md)

- Unit tests (5/5 passing)

- E2E acceptance tests│       ├── ssm.ts              # SSM Parameter Store helpers

- Postman collection

- CI/CD pipeline│       └── types.ts            # TypeScript type definitions## 🎯 Milestone 1 Acceptance Criteria



✅ **Documentation**├── infrastructure/

- Architecture diagrams

- Testing guides│   ├── bin/app.ts              # CDK app entry point✅ `curl/Postman → 200` from `/telegram/webhook`  

- Operations runbook

- IAM policy documentation│   └── lib/lbc-stack.ts        # Main CDK stack definition✅ Message enqueued to SQS and consumed by `jobWorker`  



---├── tests/✅ CloudWatch logs prove message processing



## 📝 Next Steps (Future Milestones)│   ├── lambdas/                # Unit tests



### M2: Bot Response Logic│   └── acceptance/             # E2E acceptance tests## 📄 License

- Implement bot commands (/start, /help, etc.)

- Add message response handlers├── postman/

- Session management

- User state tracking│   └── collection.json         # Postman test collectionMIT



### M3: Business Features├── docs/#   l b c - t e l e g r a m - b o t - i a c 

- Custom bot functionality

- Advanced message processing│   ├── architecture.md         # Architecture documentation 

- Integration with external APIs

- Analytics & reporting│   ├── testing.md              # Testing guide 



### M4: Production Hardening│   ├── runbook.md              # Operations guide

- Enhanced monitoring & alerting│   └── iam-policies.md         # IAM policy documentation

- Performance optimization├── .github/

- Load testing│   └── workflows/ci.yml        # GitHub Actions CI/CD

- Security audit├── .env.example                # Environment template

- Backup & disaster recovery└── package.json                # Dependencies & scripts

```

---

---

## 🐛 Troubleshooting

## 🔒 **Security Features**

### Bot not receiving messages?

```bash- ✅ All secrets stored in AWS SSM Parameter Store (encrypted)

# 1. Check webhook is registered- ✅ KMS encryption for DynamoDB tables

curl https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getWebhookInfo- ✅ IAM least-privilege policies

- ✅ VPC-ready (optional - currently public)

# 2. Check Lambda logs- ✅ CloudWatch monitoring & alarms

aws logs tail /aws/lambda/telegramWebhook-dev-v2 --follow- ✅ Dead Letter Queue for failed messages



# 3. Test webhook manually---

aws lambda invoke --function-name telegramWebhook-dev-v2 \

  --payload file://test-payload.json response.json## 💰 **Cost Estimate**

```

**Expected monthly cost: $2-5 for light usage**

### Messages not in DynamoDB?

```bashBreakdown:

# 1. Check SQS queue has messages- Lambda: ~$0.20/million requests

aws sqs get-queue-attributes --queue-url <QUEUE_URL> --attribute-names ApproximateNumberOfMessages- DynamoDB: ~$1.25/million reads (on-demand)

- API Gateway: $1.00/million requests

# 2. Check jobWorker logs- CloudWatch Logs: $0.50/GB

aws logs tail /aws/lambda/jobWorker-dev-v2 --follow- Data Transfer: Minimal



# 3. Check Dead Letter Queue*First 12 months may be covered by AWS Free Tier*

aws sqs receive-message --queue-url <DLQ_URL>

```---



### Deployment fails?## 📋 **Available Commands**

```bash

# 1. Check AWS credentials### **Development**

aws sts get-caller-identity```bash

npm run build         # Compile TypeScript

# 2. Verify CDK bootstrapnpm run watch         # Watch mode compilation

aws cloudformation describe-stacks --stack-name CDKToolkitnpm test              # Run unit tests

npm run test:watch    # Tests in watch mode

# 3. Check for existing resourcesnpm run test:coverage # Tests with coverage report

aws cloudformation list-stacks --stack-status-filter CREATE_COMPLETE UPDATE_COMPLETEnpm run test:e2e      # Run E2E acceptance tests

```npm run lint          # Lint code

npm run lint:fix      # Fix linting issues

---npm run format        # Format code with Prettier

```

## 📞 Support & Documentation

### **AWS Deployment**

- **Testing Guide**: `docs/testing.md````bash

- **Architecture**: `docs/architecture.md`npm run cdk:deploy    # Deploy to AWS

- **Operations**: `docs/runbook.md`npm run cdk:synth     # Synthesize CloudFormation

- **IAM Policies**: `docs/iam-policies.md`npm run cdk:diff      # Show deployment changes

npm run cdk:destroy   # Delete all AWS resources

---```



## 📄 License---



MIT License - See LICENSE file for details## 🔍 **Monitoring & Debugging**



---### **View Lambda Logs**

```bash

## 👨‍💻 Author# Webhook Lambda

aws logs tail /aws/lambda/telegramWebhook-dev-v2 --follow

Mohamed Rouatbi

- GitHub: [@MohamedRouatbi](https://github.com/MohamedRouatbi)# Job Worker Lambda

aws logs tail /aws/lambda/jobWorker-dev-v2 --follow

---```



## 🙏 Acknowledgments### **Check SQS Queue**

```bash

Built with:# Get queue attributes

- AWS CDKaws sqs get-queue-attributes \

- AWS Lambda (Node.js 20.x)  --queue-url https://sqs.us-east-1.amazonaws.com/ACCOUNT_ID/lbc-telegram-events-dev-v2 \

- TypeScript  --attribute-names All

- Telegram Bot API

# Receive messages (for debugging)

---aws sqs receive-message \

  --queue-url https://sqs.us-east-1.amazonaws.com/ACCOUNT_ID/lbc-telegram-events-dev-v2

**🎉 M1 Milestone - COMPLETE! All infrastructure deployed and tested.**```


### **Query DynamoDB**
```bash
# Get all users
aws dynamodb scan --table-name lbc-users-dev-v2

# Get all events
aws dynamodb scan --table-name lbc-events-dev-v2

# Get specific user
aws dynamodb get-item \
  --table-name lbc-users-dev-v2 \
  --key '{"userId":{"S":"telegram_YOUR_TELEGRAM_ID"}}'
```

---

## 🎯 **What's Working (M1 Complete)**

✅ **Infrastructure**
- All AWS resources deployed via CDK
- Infrastructure-as-Code best practices
- Automated deployments

✅ **Functionality**
- Telegram webhook receiving messages
- Messages queued in SQS
- Worker processing messages
- Data stored in DynamoDB

✅ **Testing**
- Unit tests (5/5 passing)
- E2E acceptance tests
- Postman collection
- CI/CD pipeline

✅ **Documentation**
- Architecture diagrams
- Testing guides
- Operations runbook
- IAM policy documentation

---

## 📝 **Next Steps (Future Milestones)**

### **M2: Bot Response Logic**
- Implement bot commands (/start, /help, etc.)
- Add message response handlers
- Session management
- User state tracking

### **M3: Business Features**
- Custom bot functionality
- Advanced message processing
- Integration with external APIs
- Analytics & reporting

### **M4: Production Hardening**
- Enhanced monitoring & alerting
- Performance optimization
- Load testing
- Security audit
- Backup & disaster recovery

---

## 🐛 **Troubleshooting**

### **Bot not receiving messages?**
```bash
# 1. Check webhook is registered
curl https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getWebhookInfo

# 2. Check Lambda logs
aws logs tail /aws/lambda/telegramWebhook-dev-v2 --follow

# 3. Test webhook manually
aws lambda invoke --function-name telegramWebhook-dev-v2 \
  --payload file://test-payload.json response.json
```

### **Messages not in DynamoDB?**
```bash
# 1. Check SQS queue has messages
aws sqs get-queue-attributes --queue-url <QUEUE_URL> --attribute-names ApproximateNumberOfMessages

# 2. Check jobWorker logs
aws logs tail /aws/lambda/jobWorker-dev-v2 --follow

# 3. Check Dead Letter Queue
aws sqs receive-message --queue-url <DLQ_URL>
```

### **Deployment fails?**
```bash
# 1. Check AWS credentials
aws sts get-caller-identity

# 2. Verify CDK bootstrap
aws cloudformation describe-stacks --stack-name CDKToolkit

# 3. Check for existing resources
aws cloudformation list-stacks --stack-status-filter CREATE_COMPLETE UPDATE_COMPLETE
```

---

## 📞 **Support & Documentation**

- **Testing Guide**: `docs/testing.md`
- **Architecture**: `docs/architecture.md`
- **Operations**: `docs/runbook.md`
- **IAM Policies**: `docs/iam-policies.md`

---

## 📄 **License**

MIT License - See LICENSE file for details

---

## 👨‍💻 **Author**

Mohamed Rouatbi
- GitHub: [@MohamedRouatbi](https://github.com/MohamedRouatbi)

---

## 🙏 **Acknowledgments**

Built with:
- AWS CDK
- AWS Lambda (Node.js 20.x)
- TypeScript
- Telegram Bot API

---

**🎉 M1 Milestone - COMPLETE! All infrastructure deployed and tested.**
