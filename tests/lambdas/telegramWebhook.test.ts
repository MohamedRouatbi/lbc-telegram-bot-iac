import { handler } from '../../src/lambdas/telegramWebhook/index';
import type { APIGatewayProxyEvent } from 'aws-lambda';

// Mock AWS SDK
jest.mock('@aws-sdk/client-sqs');

describe('telegramWebhook Lambda', () => {
  const mockEvent = (overrides: Partial<APIGatewayProxyEvent> = {}): APIGatewayProxyEvent => ({
    httpMethod: 'POST',
    path: '/telegram/webhook',
    headers: {},
    queryStringParameters: null,
    pathParameters: null,
    stageVariables: null,
    requestContext: {} as any,
    resource: '',
    isBase64Encoded: false,
    multiValueHeaders: {},
    multiValueQueryStringParameters: null,
    body: JSON.stringify({
      update_id: 123456789,
      message: {
        message_id: 1,
        from: {
          id: 987654321,
          is_bot: false,
          first_name: 'Test',
          username: 'testuser',
        },
        chat: {
          id: 987654321,
          type: 'private',
        },
        date: 1634567890,
        text: 'Hello!',
      },
    }),
    ...overrides,
  });

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.SQS_QUEUE_URL = 'https://sqs.us-east-1.amazonaws.com/123456789012/test-queue';
  });

  it('should return 200 for valid POST request', async () => {
    const event = mockEvent();
    const result = await handler(event);

    expect(result.statusCode).toBe(200);
    expect(JSON.parse(result.body)).toEqual({ ok: true });
  });

  it('should return 405 for non-POST requests', async () => {
    const event = mockEvent({ httpMethod: 'GET' });
    const result = await handler(event);

    expect(result.statusCode).toBe(405);
    expect(JSON.parse(result.body)).toHaveProperty('error', 'Method Not Allowed');
  });

  it('should return 400 for missing body', async () => {
    const event = mockEvent({ body: null });
    const result = await handler(event);

    expect(result.statusCode).toBe(400);
    expect(JSON.parse(result.body)).toHaveProperty('error');
  });

  it('should return 400 for invalid Telegram update', async () => {
    const event = mockEvent({ body: JSON.stringify({ invalid: 'data' }) });
    const result = await handler(event);

    expect(result.statusCode).toBe(400);
    expect(JSON.parse(result.body)).toHaveProperty('error');
  });

  // TODO: Add more tests for:
  // - SQS message sending
  // - Different event types (callback_query, edited_message)
  // - Error handling
});
