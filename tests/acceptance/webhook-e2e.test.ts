/**
 * End-to-End Acceptance Tests for Telegram Webhook
 *
 * These tests verify the entire flow from webhook to DynamoDB
 * Run against a deployed stack in AWS
 */

import axios from 'axios';
import { DynamoDBClient, GetItemCommand, ScanCommand } from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';

// Configuration from environment
const WEBHOOK_URL =
  process.env.WEBHOOK_URL ||
  'https://1mi1qv7d67.execute-api.us-east-1.amazonaws.com/telegram/webhook';
const AWS_REGION = process.env.AWS_REGION || 'us-east-1';
const EVENTS_TABLE = process.env.EVENTS_TABLE_NAME || 'lbc-events-dev-v2';
const USERS_TABLE = process.env.USERS_TABLE_NAME || 'lbc-users-dev-v2';

const dynamoClient = new DynamoDBClient({ region: AWS_REGION });

describe('E2E: Telegram Webhook Flow', () => {
  const testUserId = 999999999; // Test user ID
  const updateId = Date.now(); // Unique update ID

  beforeAll(() => {
    // Ensure environment is configured
    if (!WEBHOOK_URL.includes('execute-api')) {
      throw new Error('WEBHOOK_URL not properly configured');
    }
  });

  afterAll(async () => {
    // Cleanup test data if needed
    // Note: In real scenarios, use a separate test environment
  });

  describe('Webhook Endpoint', () => {
    it('should accept valid Telegram message webhook', async () => {
      const payload = {
        update_id: updateId,
        message: {
          message_id: 1,
          from: {
            id: testUserId,
            is_bot: false,
            first_name: 'E2E',
            last_name: 'Test',
            username: 'e2etest',
            language_code: 'en',
          },
          chat: {
            id: testUserId,
            first_name: 'E2E',
            last_name: 'Test',
            username: 'e2etest',
            type: 'private',
          },
          date: Math.floor(Date.now() / 1000),
          text: 'E2E Test Message',
        },
      };

      const response = await axios.post(WEBHOOK_URL, payload, {
        headers: { 'Content-Type': 'application/json' },
      });

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('ok', true);
    }, 10000); // 10s timeout

    it('should reject GET requests with 405', async () => {
      try {
        await axios.get(WEBHOOK_URL);
        fail('Should have thrown 405 error');
      } catch (error: any) {
        expect(error.response.status).toBe(405);
      }
    });

    it('should reject invalid payload with 400', async () => {
      try {
        await axios.post(
          WEBHOOK_URL,
          { invalid: 'data' },
          {
            headers: { 'Content-Type': 'application/json' },
          }
        );
        fail('Should have thrown 400 error');
      } catch (error: any) {
        expect(error.response.status).toBe(400);
      }
    });
  });

  describe('DynamoDB Data Persistence', () => {
    it('should create user record in DynamoDB', async () => {
      // Wait for async processing
      await new Promise((resolve) => setTimeout(resolve, 3000));

      const command = new GetItemCommand({
        TableName: USERS_TABLE,
        Key: {
          userId: { S: `telegram_${testUserId}` },
        },
      });

      const result = await dynamoClient.send(command);

      if (!result.Item) {
        throw new Error('User not found in DynamoDB');
      }

      const user = unmarshall(result.Item);
      expect(user.userId).toBe(`telegram_${testUserId}`);
      expect(user.firstName).toBe('E2E');
      expect(user.telegramId).toBe(testUserId);
    }, 15000); // 15s timeout for processing

    it('should create event record in DynamoDB', async () => {
      // Scan for recent events (in production, use query with proper indexes)
      const command = new ScanCommand({
        TableName: EVENTS_TABLE,
        FilterExpression: 'userId = :userId',
        ExpressionAttributeValues: {
          ':userId': { S: `telegram_${testUserId}` },
        },
        Limit: 10,
      });

      const result = await dynamoClient.send(command);
      expect(result.Items).toBeDefined();
      expect(result.Items!.length).toBeGreaterThan(0);

      const event = unmarshall(result.Items![0]);
      expect(event.eventType).toBe('message');
      expect(event.userId).toBe(`telegram_${testUserId}`);
      expect(event.payload).toBeDefined();
      expect(event.payload.text).toBe('E2E Test Message');
    }, 15000);
  });

  describe('Error Handling', () => {
    it('should handle malformed JSON gracefully', async () => {
      try {
        await axios.post(WEBHOOK_URL, 'not valid json', {
          headers: { 'Content-Type': 'application/json' },
        });
        fail('Should have thrown error');
      } catch (error: any) {
        expect([400, 500]).toContain(error.response.status);
      }
    });

    it('should return 200 for unsupported update types', async () => {
      const payload = {
        update_id: updateId + 1,
        channel_post: {
          message_id: 2,
          chat: { id: 123, type: 'channel' },
          date: Math.floor(Date.now() / 1000),
          text: 'Channel post',
        },
      };

      const response = await axios.post(WEBHOOK_URL, payload, {
        headers: { 'Content-Type': 'application/json' },
      });

      // Should accept but ignore unsupported types
      expect(response.status).toBe(200);
    });
  });

  describe('Performance', () => {
    it('should process webhook within 5 seconds', async () => {
      const start = Date.now();

      const payload = {
        update_id: updateId + 2,
        message: {
          message_id: 3,
          from: {
            id: testUserId,
            is_bot: false,
            first_name: 'Perf',
            last_name: 'Test',
          },
          chat: {
            id: testUserId,
            type: 'private',
          },
          date: Math.floor(Date.now() / 1000),
          text: 'Performance test',
        },
      };

      await axios.post(WEBHOOK_URL, payload, {
        headers: { 'Content-Type': 'application/json' },
      });

      const duration = Date.now() - start;
      expect(duration).toBeLessThan(5000); // Should respond within 5s
    });
  });
});
