export interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
  edited_message?: TelegramMessage;
  channel_post?: TelegramMessage;
  edited_channel_post?: TelegramMessage;
  callback_query?: TelegramCallbackQuery;
}

export interface TelegramMessage {
  message_id: number;
  from?: TelegramUser;
  chat: TelegramChat;
  date: number;
  text?: string;
  entities?: TelegramMessageEntity[];
}

export interface TelegramUser {
  id: number;
  is_bot: boolean;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}

export interface TelegramChat {
  id: number;
  type: 'private' | 'group' | 'supergroup' | 'channel';
  title?: string;
  username?: string;
  first_name?: string;
  last_name?: string;
}

export interface TelegramMessageEntity {
  type: string;
  offset: number;
  length: number;
  url?: string;
  user?: TelegramUser;
}

export interface TelegramCallbackQuery {
  id: string;
  from: TelegramUser;
  message?: TelegramMessage;
  data?: string;
}

// DynamoDB Types
export interface UserRecord {
  userId: string; // PK
  telegramId: number;
  username?: string;
  firstName: string;
  lastName?: string;
  languageCode?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SessionRecord {
  sessionId: string; // PK
  userId: string; // GSI
  chatId: number;
  state: string;
  data?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  expiresAt: number; // TTL
}

export interface EventRecord {
  eventId: string; // PK
  userId: string; // GSI
  eventType: string;
  payload: Record<string, any>;
  timestamp: string;
  processed: boolean;
}

// SQS Message Types
export interface TelegramEventMessage {
  eventType: 'message' | 'callback_query' | 'edited_message';
  update: TelegramUpdate;
  receivedAt: string;
}

// SSM Parameter Names
export enum SSMParameter {
  TELEGRAM_BOT_TOKEN = '/lbc-telegram-bot/dev/telegram-bot-token',
  TELEGRAM_WEBHOOK_SECRET = '/lbc-telegram-bot/dev/telegram-webhook-secret',
}

// Environment Variables
export interface EnvironmentVariables {
  USERS_TABLE_NAME: string;
  SESSIONS_TABLE_NAME: string;
  EVENTS_TABLE_NAME: string;
  SQS_QUEUE_URL: string;
  AWS_REGION: string;
}
