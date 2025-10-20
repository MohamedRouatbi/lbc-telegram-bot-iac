import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigatewayv2 from 'aws-cdk-lib/aws-apigatewayv2';
import * as apigatewayv2_integrations from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as lambdaEventSources from 'aws-cdk-lib/aws-lambda-event-sources';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatch_actions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as sns_subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import { Construct } from 'constructs';
import * as path from 'path';

export class LbcTelegramBotStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const environment = process.env.ENVIRONMENT || 'dev';
    const suffix = id.includes('v2') ? '-v2' : ''; // Add suffix for v2

    // ============================================
    // KMS Key for SSM Parameters
    // ============================================
    const kmsKey = new kms.Key(this, 'SSMKey', {
      description: 'KMS key for encrypting SSM parameters',
      enableKeyRotation: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    kmsKey.addAlias(`alias/lbc-telegram-bot-${environment}${suffix}`);

    // ============================================
    // DynamoDB Tables
    // ============================================

    // Users Table
    const usersTable = new dynamodb.Table(this, 'UsersTable', {
      tableName: `lbc-users-${environment}${suffix}`,
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      pointInTimeRecovery: true,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
    });

    // Sessions Table with GSI
    const sessionsTable = new dynamodb.Table(this, 'SessionsTable', {
      tableName: `lbc-sessions-${environment}${suffix}`,
      partitionKey: { name: 'sessionId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      pointInTimeRecovery: true,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      timeToLiveAttribute: 'expiresAt',
    });

    sessionsTable.addGlobalSecondaryIndex({
      indexName: 'UserIdIndex',
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // Events Table with GSI
    const eventsTable = new dynamodb.Table(this, 'EventsTable', {
      tableName: `lbc-events-${environment}${suffix}`,
      partitionKey: { name: 'eventId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      pointInTimeRecovery: true,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
    });

    eventsTable.addGlobalSecondaryIndex({
      indexName: 'UserIdIndex',
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'timestamp', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // ============================================
    // SQS Queues
    // ============================================

    // Dead Letter Queue
    const dlq = new sqs.Queue(this, 'TelegramEventsDLQ', {
      queueName: `lbc-telegram-events-dlq-${environment}${suffix}`,
      retentionPeriod: cdk.Duration.days(14),
      encryption: sqs.QueueEncryption.KMS_MANAGED,
    });

    // Main Queue
    const telegramEventsQueue = new sqs.Queue(this, 'TelegramEventsQueue', {
      queueName: `lbc-telegram-events-${environment}${suffix}`,
      visibilityTimeout: cdk.Duration.seconds(300),
      retentionPeriod: cdk.Duration.days(4),
      encryption: sqs.QueueEncryption.KMS_MANAGED,
      deadLetterQueue: {
        queue: dlq,
        maxReceiveCount: 3,
      },
    });

    // ============================================
    // SSM Parameters (Placeholders)
    // ============================================

    // Note: These will need to be populated manually after deployment
    new ssm.StringParameter(this, 'TelegramBotTokenParam', {
      parameterName: `/lbc-telegram-bot/${environment}${suffix}/telegram-bot-token`,
      stringValue: 'PLACEHOLDER - Set this after deployment',
      description: 'Telegram Bot Token',
      tier: ssm.ParameterTier.STANDARD,
    });

    new ssm.StringParameter(this, 'TelegramWebhookSecretParam', {
      parameterName: `/lbc-telegram-bot/${environment}${suffix}/telegram-webhook-secret`,
      stringValue: 'PLACEHOLDER - Set this after deployment',
      description: 'Telegram Webhook Secret',
      tier: ssm.ParameterTier.STANDARD,
    });

    // ============================================
    // Lambda Functions
    // ============================================

    // Create log groups explicitly to avoid LogRetention custom resource issues
    // The underscore prefix indicates these are intentionally unused (just created for side effects)
    new logs.LogGroup(this, 'WebhookLogGroup', {
      logGroupName: `/aws/lambda/telegramWebhook-${environment}${suffix}`,
      retention: logs.RetentionDays.TWO_WEEKS,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    new logs.LogGroup(this, 'JobWorkerLogGroup', {
      logGroupName: `/aws/lambda/jobWorker-${environment}${suffix}`,
      retention: logs.RetentionDays.TWO_WEEKS,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Webhook Lambda
    const telegramWebhookLambda = new lambda.Function(this, 'TelegramWebhookLambda', {
      functionName: `telegramWebhook-${environment}${suffix}`,
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'dist/src/lambdas/telegramWebhook/index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../..'), {
        exclude: ['node_modules', 'cdk.out', 'tests', '.git', '*.md', 'docs', 'postman', '.env', 'src'],
      }),
      environment: {
        SQS_QUEUE_URL: telegramEventsQueue.queueUrl,
        ENVIRONMENT: environment,
      },
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
    });

    // Grant permissions
    telegramEventsQueue.grantSendMessages(telegramWebhookLambda);

    // Job Worker Lambda
    const jobWorkerLambda = new lambda.Function(this, 'JobWorkerLambda', {
      functionName: `jobWorker-${environment}${suffix}`,
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'dist/src/lambdas/jobWorker/index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../..'), {
        exclude: ['node_modules', 'cdk.out', 'tests', '.git', '*.md', 'docs', 'postman', '.env', 'src'],
      }),
      environment: {
        USERS_TABLE_NAME: usersTable.tableName,
        SESSIONS_TABLE_NAME: sessionsTable.tableName,
        EVENTS_TABLE_NAME: eventsTable.tableName,
        ENVIRONMENT: environment,
      },
      timeout: cdk.Duration.seconds(60),
      memorySize: 512,
    });

    // Grant DynamoDB permissions
    usersTable.grantReadWriteData(jobWorkerLambda);
    sessionsTable.grantReadWriteData(jobWorkerLambda);
    eventsTable.grantReadWriteData(jobWorkerLambda);

    // Grant SSM permissions
    jobWorkerLambda.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['ssm:GetParameter', 'ssm:GetParameters'],
        resources: [
          `arn:aws:ssm:${this.region}:${this.account}:parameter/lbc-telegram-bot/${environment}${suffix}/*`,
        ],
      })
    );

    kmsKey.grantDecrypt(jobWorkerLambda);

    // Add SQS trigger to Job Worker
    jobWorkerLambda.addEventSource(
      new lambdaEventSources.SqsEventSource(telegramEventsQueue, {
        batchSize: 10,
        maxBatchingWindow: cdk.Duration.seconds(5),
        reportBatchItemFailures: true,
      })
    );

    // ============================================
    // API Gateway HTTP API
    // ============================================

    const httpApi = new apigatewayv2.HttpApi(this, 'TelegramWebhookApi', {
      apiName: `lbc-telegram-webhook-${environment}${suffix}`,
      description: 'HTTP API for Telegram webhook',
      corsPreflight: {
        allowOrigins: ['*'],
        allowMethods: [apigatewayv2.CorsHttpMethod.POST],
      },
    });

    // Add route
    httpApi.addRoutes({
      path: '/telegram/webhook',
      methods: [apigatewayv2.HttpMethod.POST],
      integration: new apigatewayv2_integrations.HttpLambdaIntegration(
        'WebhookIntegration',
        telegramWebhookLambda
      ),
    });

    // ============================================
    // CloudWatch Alarms
    // ============================================

    // SNS Topic for Alarms
    const alarmTopic = new sns.Topic(this, 'AlarmTopic', {
      displayName: 'LBC Telegram Bot Alarms',
      topicName: `lbc-telegram-bot-alarms-${environment}${suffix}`,
    });

    // Add email subscription (update with actual email)
    const emailAddress = process.env.BUDGET_EMAIL || 'admin@example.com';
    alarmTopic.addSubscription(new sns_subscriptions.EmailSubscription(emailAddress));

    // Alarm: Webhook Lambda Errors
    const webhookErrorAlarm = new cloudwatch.Alarm(this, 'WebhookErrorAlarm', {
      metric: telegramWebhookLambda.metricErrors({
        period: cdk.Duration.minutes(5),
      }),
      threshold: 5,
      evaluationPeriods: 1,
      alarmName: `lbc-webhook-errors-${environment}`,
      alarmDescription: 'Telegram webhook Lambda function errors',
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    webhookErrorAlarm.addAlarmAction(new cloudwatch_actions.SnsAction(alarmTopic));

    // Alarm: Job Worker Lambda Errors
    const jobWorkerErrorAlarm = new cloudwatch.Alarm(this, 'JobWorkerErrorAlarm', {
      metric: jobWorkerLambda.metricErrors({
        period: cdk.Duration.minutes(5),
      }),
      threshold: 5,
      evaluationPeriods: 1,
      alarmName: `lbc-job-worker-errors-${environment}`,
      alarmDescription: 'Job worker Lambda function errors',
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    jobWorkerErrorAlarm.addAlarmAction(new cloudwatch_actions.SnsAction(alarmTopic));

    // Alarm: DLQ Depth
    const dlqAlarm = new cloudwatch.Alarm(this, 'DLQAlarm', {
      metric: dlq.metricApproximateNumberOfMessagesVisible({
        period: cdk.Duration.minutes(5),
      }),
      threshold: 1,
      evaluationPeriods: 1,
      alarmName: `lbc-dlq-messages-${environment}`,
      alarmDescription: 'Messages in Dead Letter Queue',
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    dlqAlarm.addAlarmAction(new cloudwatch_actions.SnsAction(alarmTopic));

    // ============================================
    // Outputs
    // ============================================

    new cdk.CfnOutput(this, 'WebhookURL', {
      value: `${httpApi.url}telegram/webhook`,
      description: 'Telegram Webhook URL',
      exportName: `${id}-webhook-url`,
    });

    new cdk.CfnOutput(this, 'UsersTableName', {
      value: usersTable.tableName,
      description: 'Users DynamoDB Table Name',
    });

    new cdk.CfnOutput(this, 'SessionsTableName', {
      value: sessionsTable.tableName,
      description: 'Sessions DynamoDB Table Name',
    });

    new cdk.CfnOutput(this, 'EventsTableName', {
      value: eventsTable.tableName,
      description: 'Events DynamoDB Table Name',
    });

    new cdk.CfnOutput(this, 'SQSQueueURL', {
      value: telegramEventsQueue.queueUrl,
      description: 'SQS Queue URL',
    });

    new cdk.CfnOutput(this, 'DLQueueURL', {
      value: dlq.queueUrl,
      description: 'Dead Letter Queue URL',
    });
  }
}
