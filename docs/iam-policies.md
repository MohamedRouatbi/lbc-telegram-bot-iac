# IAM Policies - LBC Telegram Bot

## Overview

This document details all IAM roles and policies created by the CDK stack for Milestone 1.

## Roles Created

1. **TelegramWebhookLambdaRole** - For the webhook Lambda function
2. **JobWorkerLambdaRole** - For the SQS job processor Lambda function

---

## 1. TelegramWebhookLambdaRole

### Purpose

Allows the webhook Lambda to:

- Send messages to SQS queue
- Write logs to CloudWatch

### Trust Policy

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
```

### Managed Policies Attached

- `arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole`

### Inline Policies

#### SQS Send Messages Policy

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["sqs:SendMessage", "sqs:GetQueueAttributes", "sqs:GetQueueUrl"],
      "Resource": "arn:aws:sqs:REGION:ACCOUNT_ID:lbc-telegram-events-dev"
    }
  ]
}
```

#### CloudWatch Logs Policy (from AWSLambdaBasicExecutionRole)

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["logs:CreateLogGroup", "logs:CreateLogStream", "logs:PutLogEvents"],
      "Resource": "arn:aws:logs:REGION:ACCOUNT_ID:log-group:/aws/lambda/telegramWebhook-dev:*"
    }
  ]
}
```

---

## 2. JobWorkerLambdaRole

### Purpose

Allows the job worker Lambda to:

- Receive and delete messages from SQS queue
- Read/write data to DynamoDB tables
- Read encrypted parameters from SSM Parameter Store
- Decrypt parameters using KMS
- Write logs to CloudWatch

### Trust Policy

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
```

### Managed Policies Attached

- `arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole`

### Inline Policies

#### SQS Consumer Policy

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "sqs:ReceiveMessage",
        "sqs:DeleteMessage",
        "sqs:GetQueueAttributes",
        "sqs:ChangeMessageVisibility"
      ],
      "Resource": "arn:aws:sqs:REGION:ACCOUNT_ID:lbc-telegram-events-dev"
    }
  ]
}
```

#### DynamoDB Access Policy

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:BatchGetItem",
        "dynamodb:GetItem",
        "dynamodb:Query",
        "dynamodb:Scan",
        "dynamodb:BatchWriteItem",
        "dynamodb:PutItem",
        "dynamodb:UpdateItem",
        "dynamodb:DeleteItem"
      ],
      "Resource": [
        "arn:aws:dynamodb:REGION:ACCOUNT_ID:table/lbc-users-dev",
        "arn:aws:dynamodb:REGION:ACCOUNT_ID:table/lbc-users-dev/index/*",
        "arn:aws:dynamodb:REGION:ACCOUNT_ID:table/lbc-sessions-dev",
        "arn:aws:dynamodb:REGION:ACCOUNT_ID:table/lbc-sessions-dev/index/*",
        "arn:aws:dynamodb:REGION:ACCOUNT_ID:table/lbc-events-dev",
        "arn:aws:dynamodb:REGION:ACCOUNT_ID:table/lbc-events-dev/index/*"
      ]
    }
  ]
}
```

#### SSM Parameter Store Policy

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["ssm:GetParameter", "ssm:GetParameters"],
      "Resource": "arn:aws:ssm:REGION:ACCOUNT_ID:parameter/lbc-telegram-bot/dev/*"
    }
  ]
}
```

#### KMS Decrypt Policy

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": "kms:Decrypt",
      "Resource": "arn:aws:kms:REGION:ACCOUNT_ID:key/KMS_KEY_ID"
    }
  ]
}
```

---

## Security Best Practices Applied

### ✅ Least Privilege Principle

- Each Lambda only has permissions for resources it needs
- No wildcard (\*) permissions on resources
- Specific actions only (no broad permissions like `dynamodb:*`)

### ✅ Resource-Level Permissions

- Policies specify exact ARNs of resources
- No account-wide permissions

### ✅ Service-Scoped Roles

- Roles can only be assumed by AWS Lambda service
- Not assumable by users or other services

### ✅ Encryption at Rest

- KMS key used for SSM parameter encryption
- DynamoDB uses AWS-managed encryption
- SQS uses KMS-managed encryption

### ✅ Encryption in Transit

- All AWS SDK calls use HTTPS
- API Gateway enforces HTTPS

---

## How to View Actual Policies in AWS Console

### Via AWS Console:

1. Go to **IAM** → **Roles**
2. Search for `telegramWebhook-dev` or `jobWorker-dev`
3. Click on the role
4. View **Permissions** tab

### Via AWS CLI:

```powershell
# List Lambda roles
aws iam list-roles --query "Roles[?contains(RoleName, 'telegram')].RoleName"

# Get specific role
aws iam get-role --role-name <ROLE_NAME>

# List attached policies
aws iam list-attached-role-policies --role-name <ROLE_NAME>

# Get inline policies
aws iam list-role-policies --role-name <ROLE_NAME>
aws iam get-role-policy --role-name <ROLE_NAME> --policy-name <POLICY_NAME>
```

---

## Audit and Compliance

### CloudTrail Logging

All IAM actions are logged in CloudTrail:

- Role assumptions
- Permission grants
- Policy changes

### Regular Review

Recommended: Review IAM policies quarterly to ensure:

1. No unused permissions
2. No overly broad permissions
3. Compliance with security standards

### Access Analyzer

Enable AWS IAM Access Analyzer to:

- Detect overly permissive policies
- Identify external access
- Generate least-privilege policies

---

## Future Enhancements (Post-M1)

1. **Service Control Policies (SCPs)**: Organization-level permission boundaries
2. **Permission Boundaries**: Additional safeguard for Lambda roles
3. **Session Policies**: Time-limited temporary credentials
4. **Condition Keys**: Add conditions like IP address, time of day
5. **AWS Secrets Manager**: Migrate from SSM to Secrets Manager for automatic rotation
