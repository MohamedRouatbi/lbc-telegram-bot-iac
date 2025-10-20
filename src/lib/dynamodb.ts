import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  UpdateCommand,
  QueryCommand,
  DeleteCommand,
} from '@aws-sdk/lib-dynamodb';
import type { UserRecord, SessionRecord, EventRecord } from './types';

const client = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(client);

const USERS_TABLE = process.env.USERS_TABLE_NAME || 'lbc-users';
const SESSIONS_TABLE = process.env.SESSIONS_TABLE_NAME || 'lbc-sessions';
const EVENTS_TABLE = process.env.EVENTS_TABLE_NAME || 'lbc-events';

// ============================================
// User Operations
// ============================================

export async function createUser(user: UserRecord): Promise<void> {
  const command = new PutCommand({
    TableName: USERS_TABLE,
    Item: user,
  });

  await docClient.send(command);
  console.log(`User created: ${user.userId}`);
}

export async function getUser(userId: string): Promise<UserRecord | null> {
  const command = new GetCommand({
    TableName: USERS_TABLE,
    Key: { userId },
  });

  const response = await docClient.send(command);
  return (response.Item as UserRecord) || null;
}

export async function updateUser(
  userId: string,
  updates: Partial<Omit<UserRecord, 'userId'>>
): Promise<void> {
  const updateExpressions: string[] = [];
  const expressionAttributeNames: Record<string, string> = {};
  const expressionAttributeValues: Record<string, any> = {};

  Object.entries(updates).forEach(([key, value], index) => {
    updateExpressions.push(`#attr${index} = :val${index}`);
    expressionAttributeNames[`#attr${index}`] = key;
    expressionAttributeValues[`:val${index}`] = value;
  });

  const command = new UpdateCommand({
    TableName: USERS_TABLE,
    Key: { userId },
    UpdateExpression: `SET ${updateExpressions.join(', ')}`,
    ExpressionAttributeNames: expressionAttributeNames,
    ExpressionAttributeValues: expressionAttributeValues,
  });

  await docClient.send(command);
  console.log(`User updated: ${userId}`);
}

// ============================================
// Session Operations
// ============================================

export async function createSession(session: SessionRecord): Promise<void> {
  const command = new PutCommand({
    TableName: SESSIONS_TABLE,
    Item: session,
  });

  await docClient.send(command);
  console.log(`Session created: ${session.sessionId}`);
}

export async function getSession(sessionId: string): Promise<SessionRecord | null> {
  const command = new GetCommand({
    TableName: SESSIONS_TABLE,
    Key: { sessionId },
  });

  const response = await docClient.send(command);
  return (response.Item as SessionRecord) || null;
}

export async function getSessionsByUser(userId: string): Promise<SessionRecord[]> {
  const command = new QueryCommand({
    TableName: SESSIONS_TABLE,
    IndexName: 'UserIdIndex',
    KeyConditionExpression: 'userId = :userId',
    ExpressionAttributeValues: {
      ':userId': userId,
    },
  });

  const response = await docClient.send(command);
  return (response.Items as SessionRecord[]) || [];
}

export async function deleteSession(sessionId: string): Promise<void> {
  const command = new DeleteCommand({
    TableName: SESSIONS_TABLE,
    Key: { sessionId },
  });

  await docClient.send(command);
  console.log(`Session deleted: ${sessionId}`);
}

// ============================================
// Event Operations
// ============================================

export async function createEvent(event: EventRecord): Promise<void> {
  const command = new PutCommand({
    TableName: EVENTS_TABLE,
    Item: event,
  });

  await docClient.send(command);
  console.log(`Event created: ${event.eventId}`);
}

export async function getEvent(eventId: string): Promise<EventRecord | null> {
  const command = new GetCommand({
    TableName: EVENTS_TABLE,
    Key: { eventId },
  });

  const response = await docClient.send(command);
  return (response.Item as EventRecord) || null;
}

export async function getEventsByUser(userId: string, limit: number = 50): Promise<EventRecord[]> {
  const command = new QueryCommand({
    TableName: EVENTS_TABLE,
    IndexName: 'UserIdIndex',
    KeyConditionExpression: 'userId = :userId',
    ExpressionAttributeValues: {
      ':userId': userId,
    },
    Limit: limit,
    ScanIndexForward: false, // Most recent first
  });

  const response = await docClient.send(command);
  return (response.Items as EventRecord[]) || [];
}

export async function markEventProcessed(eventId: string): Promise<void> {
  const command = new UpdateCommand({
    TableName: EVENTS_TABLE,
    Key: { eventId },
    UpdateExpression: 'SET processed = :processed',
    ExpressionAttributeValues: {
      ':processed': true,
    },
  });

  await docClient.send(command);
  console.log(`Event marked as processed: ${eventId}`);
}
