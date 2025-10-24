import type { SQSEvent, SQSRecord } from 'aws-lambda';
import { v4 as uuidv4 } from 'uuid';
import type { TelegramEventMessage, EventRecord, UserRecord } from '../../lib/types';
import { createEvent, createUser, getUser, updateUser } from '../../lib/dynamodb';
import { handleStartCommand } from './startHandler';

/**
 * Lambda handler for SQS job worker
 * Processes messages from SQS queue and writes to DynamoDB
 */
export async function handler(event: SQSEvent): Promise<void> {
  console.log(`Processing ${event.Records.length} messages from SQS`);

  // Process messages in parallel
  await Promise.all(event.Records.map(processRecord));

  console.log('All messages processed successfully');
}

async function processRecord(record: SQSRecord): Promise<void> {
  try {
    console.log('Processing SQS record', {
      messageId: record.messageId,
      attributes: record.messageAttributes,
    });

    const message: TelegramEventMessage = JSON.parse(record.body);

    // Process based on event type
    switch (message.eventType) {
      case 'message':
        await handleMessage(message);
        break;
      case 'edited_message':
        await handleEditedMessage(message);
        break;
      case 'callback_query':
        await handleCallbackQuery(message);
        break;
      default:
        console.log(`Unknown event type: ${message.eventType}`);
    }

    // Record the event in DynamoDB
    await recordEvent(message);

    console.log('Record processed successfully', {
      messageId: record.messageId,
      eventType: message.eventType,
    });
  } catch (error) {
    console.error('Error processing record:', error);
    // Throw error to move message to DLQ
    throw error;
  }
}

async function handleMessage(message: TelegramEventMessage): Promise<void> {
  const telegramMessage = message.update.message;
  if (!telegramMessage) return;

  console.log('Handling message', {
    messageId: telegramMessage.message_id,
    chatId: telegramMessage.chat.id,
    text: telegramMessage.text,
  });

  // Check if this is a /start command
  const text = telegramMessage.text || '';
  if (text.startsWith('/start')) {
    console.log('Detected /start command');
    await handleStartCommand(telegramMessage);
    return;
  }

  // Upsert user if message has sender
  if (telegramMessage.from) {
    await upsertUser(telegramMessage.from);
  }

  // Here you would add your business logic
  // For now, we just log the message
  console.log('Message processed:', {
    from: telegramMessage.from?.username,
    text: telegramMessage.text,
  });
}

async function handleEditedMessage(message: TelegramEventMessage): Promise<void> {
  const editedMessage = message.update.edited_message;
  if (!editedMessage) return;

  console.log('Handling edited message', {
    messageId: editedMessage.message_id,
    chatId: editedMessage.chat.id,
  });

  // Add your logic for edited messages
}

async function handleCallbackQuery(message: TelegramEventMessage): Promise<void> {
  const callbackQuery = message.update.callback_query;
  if (!callbackQuery) return;

  console.log('Handling callback query', {
    queryId: callbackQuery.id,
    data: callbackQuery.data,
    from: callbackQuery.from.username,
  });

  // Upsert user
  await upsertUser(callbackQuery.from);

  // Add your logic for callback queries
}

async function upsertUser(telegramUser: {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}): Promise<void> {
  const userId = `telegram_${telegramUser.id}`;

  // Check if user exists
  const existingUser = await getUser(userId);

  if (existingUser) {
    // Update user
    await updateUser(userId, {
      username: telegramUser.username,
      firstName: telegramUser.first_name,
      lastName: telegramUser.last_name,
      languageCode: telegramUser.language_code,
      updatedAt: new Date().toISOString(),
    });
  } else {
    // Create new user
    const newUser: UserRecord = {
      userId,
      telegramId: telegramUser.id,
      username: telegramUser.username,
      firstName: telegramUser.first_name,
      lastName: telegramUser.last_name,
      languageCode: telegramUser.language_code,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await createUser(newUser);
  }
}

async function recordEvent(message: TelegramEventMessage): Promise<void> {
  const eventRecord: EventRecord = {
    eventId: uuidv4(),
    userId: message.update.message?.from
      ? `telegram_${message.update.message.from.id}`
      : message.update.callback_query?.from
        ? `telegram_${message.update.callback_query.from.id}`
        : 'unknown',
    eventType: message.eventType,
    payload: message.update,
    timestamp: message.receivedAt,
    processed: true,
  };

  await createEvent(eventRecord);
}
