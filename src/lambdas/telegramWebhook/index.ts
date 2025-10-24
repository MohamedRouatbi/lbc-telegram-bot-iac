import type { APIGatewayProxyResult } from 'aws-lambda';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import type { TelegramUpdate, TelegramEventMessage } from '../../lib/types';
import { validateWebhookRequest } from '../../lib/webhookValidator';

// Support both API Gateway v1 and v2 event formats
interface APIGatewayEvent {
  httpMethod?: string;
  path?: string;
  rawPath?: string;
  body?: string;
  headers: Record<string, string>;
  requestContext?: {
    http?: {
      method: string;
      path: string;
    };
  };
}

const sqsClient = new SQSClient({ region: process.env.AWS_REGION });
const QUEUE_URL = process.env.SQS_QUEUE_URL || '';

/**
 * Lambda handler for Telegram webhook
 * Receives webhook POST requests, validates them, and enqueues to SQS
 */
export async function handler(event: APIGatewayEvent): Promise<APIGatewayProxyResult> {
  // Support both API Gateway v1 and v2 formats
  const httpMethod = event.httpMethod || event.requestContext?.http?.method;
  const path = event.path || event.requestContext?.http?.path || event.rawPath;

  console.log('Received webhook request', {
    method: httpMethod,
    path: path,
    hasSecretToken: !!event.headers['x-telegram-bot-api-secret-token'],
  });

  try {
    // Only accept POST requests
    if (httpMethod !== 'POST') {
      return {
        statusCode: 405,
        body: JSON.stringify({ error: 'Method Not Allowed' }),
      };
    }

    // Validate webhook signature (case-insensitive header lookup)
    const secretToken =
      event.headers['x-telegram-bot-api-secret-token'] ||
      event.headers['X-Telegram-Bot-Api-Secret-Token'];

    const isValid = await validateWebhookRequest(secretToken);
    if (!isValid) {
      console.warn('Webhook validation failed - rejecting request');
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Unauthorized' }),
      };
    }

    console.log('Webhook validation successful');

    // Parse the Telegram update
    if (!event.body) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing request body' }),
      };
    }

    const update: TelegramUpdate = JSON.parse(event.body);

    // Basic validation
    if (!update.update_id) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid Telegram update' }),
      };
    }

    console.log('Parsed Telegram update', {
      updateId: update.update_id,
      hasMessage: !!update.message,
      hasCallbackQuery: !!update.callback_query,
    });

    // Determine event type
    let eventType: TelegramEventMessage['eventType'];
    if (update.message) {
      eventType = 'message';
    } else if (update.edited_message) {
      eventType = 'edited_message';
    } else if (update.callback_query) {
      eventType = 'callback_query';
    } else {
      console.log('Unsupported update type, ignoring');
      return {
        statusCode: 200,
        body: JSON.stringify({ ok: true }),
      };
    }

    // Create SQS message
    const message: TelegramEventMessage = {
      eventType,
      update,
      receivedAt: new Date().toISOString(),
    };

    // Send to SQS
    const command = new SendMessageCommand({
      QueueUrl: QUEUE_URL,
      MessageBody: JSON.stringify(message),
      MessageAttributes: {
        eventType: {
          DataType: 'String',
          StringValue: eventType,
        },
        updateId: {
          DataType: 'Number',
          StringValue: update.update_id.toString(),
        },
      },
    });

    const result = await sqsClient.send(command);
    console.log('Message sent to SQS', {
      messageId: result.MessageId,
      eventType,
      updateId: update.update_id,
    });

    // Return 200 OK to Telegram
    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true }),
    };
  } catch (error) {
    console.error('Error processing webhook:', error);

    // Still return 200 to Telegram to avoid retries
    // Log the error for monitoring
    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true }),
    };
  }
}
