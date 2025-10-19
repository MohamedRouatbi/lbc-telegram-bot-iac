#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { LbcTelegramBotStack } from '../lib/lbc-stack';

const app = new cdk.App();

// Get environment variables or use defaults
const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.AWS_REGION || 'us-east-1',
};

const stackName = process.env.STACK_NAME || 'lbc-telegram-bot-dev';
const environment = process.env.ENVIRONMENT || 'dev';

new LbcTelegramBotStack(app, stackName, {
  env,
  description: `LBC Telegram Bot Stack - ${environment}`,
  tags: {
    Environment: environment,
    Project: 'lbc-telegram-bot',
    ManagedBy: 'CDK',
  },
  stackName,
});

app.synth();
