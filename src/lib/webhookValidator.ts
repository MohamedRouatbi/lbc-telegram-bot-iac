/**
 * Telegram webhook security validation
 * Validates that incoming requests are actually from Telegram
 */

import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

const secretsManager = new SecretsManagerClient({});

// Cache the webhook secret
let webhookSecretCache: string | undefined;

/**
 * Fetch webhook secret from Secrets Manager (cached)
 */
async function getWebhookSecret(): Promise<string> {
  if (webhookSecretCache) {
    return webhookSecretCache;
  }

  const secretArn = process.env.TELEGRAM_WEBHOOK_SECRET_ARN;
  if (!secretArn) {
    throw new Error('TELEGRAM_WEBHOOK_SECRET_ARN environment variable not set');
  }

  try {
    const response = await secretsManager.send(new GetSecretValueCommand({ SecretId: secretArn }));

    if (!response.SecretString) {
      throw new Error('Webhook secret is empty');
    }

    webhookSecretCache = response.SecretString;
    return webhookSecretCache;
  } catch (err) {
    console.error('Failed to fetch webhook secret from Secrets Manager:', err);
    throw err;
  }
}

/**
 * Validate Telegram webhook request
 * Telegram sends a secret token in the X-Telegram-Bot-Api-Secret-Token header
 * @param secretTokenHeader - The value from X-Telegram-Bot-Api-Secret-Token header
 * @returns true if valid, false otherwise
 */
export async function validateWebhookRequest(secretTokenHeader?: string): Promise<boolean> {
  if (!secretTokenHeader) {
    console.warn('Missing X-Telegram-Bot-Api-Secret-Token header');
    return false;
  }

  try {
    const expectedSecret = await getWebhookSecret();

    // Constant-time comparison to prevent timing attacks
    if (secretTokenHeader.length !== expectedSecret.length) {
      console.warn('Webhook secret length mismatch');
      return false;
    }

    // Use timingSafeEqual for constant-time comparison
    const headerBuffer = Buffer.from(secretTokenHeader, 'utf8');
    const expectedBuffer = Buffer.from(expectedSecret, 'utf8');

    // Note: crypto.timingSafeEqual requires equal-length buffers (checked above)
    const crypto = await import('crypto');
    const isValid = crypto.timingSafeEqual(headerBuffer, expectedBuffer);

    if (!isValid) {
      console.warn('Webhook secret validation failed');
    }

    return isValid;
  } catch (err) {
    console.error('Error validating webhook request:', err);
    return false;
  }
}

/**
 * Generate a random webhook secret (for initial setup)
 * @returns A random 32-character alphanumeric string
 */
export function generateWebhookSecret(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let secret = '';
  for (let i = 0; i < 32; i++) {
    secret += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return secret;
}
