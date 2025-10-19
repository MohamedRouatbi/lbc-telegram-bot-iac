import { handler } from '../../src/lambdas/jobWorker/index';
import type { SQSEvent } from 'aws-lambda';

// Mock dependencies
jest.mock('../../src/lib/dynamodb');

describe('jobWorker Lambda', () => {
  const mockSQSEvent = (messageBody: object): SQSEvent => ({
    Records: [
      {
        messageId: 'test-message-id',
        receiptHandle: 'test-receipt-handle',
        body: JSON.stringify(messageBody),
        attributes: {
          ApproximateReceiveCount: '1',
          SentTimestamp: '1634567890000',
          SenderId: 'test-sender',
          ApproximateFirstReceiveTimestamp: '1634567891000',
        },
        messageAttributes: {
          eventType: {
            stringValue: 'message',
            dataType: 'String',
          },
        },
        md5OfBody: 'test-md5',
        eventSource: 'aws:sqs',
        eventSourceARN: 'arn:aws:sqs:us-east-1:123456789012:test-queue',
        awsRegion: 'us-east-1',
      },
    ],
  });

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.USERS_TABLE_NAME = 'test-users';
    process.env.SESSIONS_TABLE_NAME = 'test-sessions';
    process.env.EVENTS_TABLE_NAME = 'test-events';
  });

  it('should process message event successfully', async () => {
    const messageBody = {
      eventType: 'message',
      update: {
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
      },
      receivedAt: new Date().toISOString(),
    };

    const event = mockSQSEvent(messageBody);

    await expect(handler(event)).resolves.not.toThrow();
  });

  // TODO: Add more tests for:
  // - callback_query events
  // - edited_message events
  // - User creation/update
  // - Event recording
  // - Error handling
});
