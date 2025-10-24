/**
 * Telegram Bot API client
 */

import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

const secretsManager = new SecretsManagerClient({});

// Cache the bot token
let botTokenCache: string | undefined;

/**
 * Fetch bot token from Secrets Manager (cached)
 */
async function getBotToken(): Promise<string> {
  if (botTokenCache) {
    return botTokenCache;
  }

  const secretArn = process.env.TELEGRAM_BOT_TOKEN_SECRET_ARN;
  if (!secretArn) {
    throw new Error('TELEGRAM_BOT_TOKEN_SECRET_ARN environment variable not set');
  }

  try {
    const response = await secretsManager.send(
      new GetSecretValueCommand({ SecretId: secretArn })
    );

    if (!response.SecretString) {
      throw new Error('Bot token secret is empty');
    }

    botTokenCache = response.SecretString;
    return botTokenCache;
  } catch (err) {
    console.error('Failed to fetch bot token from Secrets Manager:', err);
    throw err;
  }
}

export interface TelegramInlineButton {
  text: string;
  url?: string;
  callback_data?: string;
}

export interface SendMessageOptions {
  chatId: number | string;
  text: string;
  buttons?: TelegramInlineButton[][];
  parse_mode?: 'Markdown' | 'HTML';
}

/**
 * Send a message via Telegram Bot API
 */
export async function sendMessage(options: SendMessageOptions): Promise<any> {
  const { chatId, text, buttons, parse_mode } = options;
  const botToken = await getBotToken();

  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;

  const body: any = {
    chat_id: chatId,
    text,
    parse_mode: parse_mode || 'Markdown',
  };

  // Add inline keyboard if buttons provided
  if (buttons && buttons.length > 0) {
    body.reply_markup = {
      inline_keyboard: buttons,
    };
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Telegram API error:', response.status, errorText);
      throw new Error(`Telegram API error: ${response.status}`);
    }

    const result: any = await response.json();
    console.log('Message sent successfully:', { chatId, messageId: result.result?.message_id });
    return result;
  } catch (err) {
    console.error('Failed to send Telegram message:', err);
    throw err;
  }
}

/**
 * Send a video message via Telegram Bot API
 */
export async function sendVideo(options: {
  chatId: number | string;
  videoUrl: string;
  caption?: string;
  buttons?: TelegramInlineButton[][];
}): Promise<any> {
  const { chatId, videoUrl, caption, buttons } = options;
  const botToken = await getBotToken();

  const url = `https://api.telegram.org/bot${botToken}/sendVideo`;

  const body: any = {
    chat_id: chatId,
    video: videoUrl,
    caption: caption || '',
  };

  if (buttons && buttons.length > 0) {
    body.reply_markup = {
      inline_keyboard: buttons,
    };
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Telegram API error:', response.status, errorText);
      throw new Error(`Telegram API error: ${response.status}`);
    }

    const result: any = await response.json();
    console.log('Video sent successfully:', { chatId, messageId: result.result?.message_id });
    return result;
  } catch (err) {
    console.error('Failed to send Telegram video:', err);
    throw err;
  }
}

/**
 * Send an audio message via Telegram Bot API
 */
export async function sendAudio(options: {
  chatId: number | string;
  audioUrl: string;
  caption?: string;
  buttons?: TelegramInlineButton[][];
}): Promise<any> {
  const { chatId, audioUrl, caption, buttons } = options;
  const botToken = await getBotToken();

  const url = `https://api.telegram.org/bot${botToken}/sendAudio`;

  const body: any = {
    chat_id: chatId,
    audio: audioUrl,
    caption: caption || '',
  };

  if (buttons && buttons.length > 0) {
    body.reply_markup = {
      inline_keyboard: buttons,
    };
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Telegram API error:', response.status, errorText);
      throw new Error(`Telegram API error: ${response.status}`);
    }

    const result: any = await response.json();
    console.log('Audio sent successfully:', { chatId, messageId: result.result?.message_id });
    return result;
  } catch (err) {
    console.error('Failed to send Telegram audio:', err);
    throw err;
  }
}
