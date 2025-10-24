/**
 * /restart command handler - resets user onboarding state
 */

import type { TelegramMessage } from '../../lib/types';
import { getUser, updateUser } from '../../lib/dynamodb';
import { sendMessage } from '../../lib/telegram';

/**
 * Handle /restart command
 * Resets user state back to NEW so they can go through onboarding again
 */
export async function handleRestartCommand(message: TelegramMessage): Promise<void> {
  if (!message.from) {
    console.log('Invalid restart command: missing from');
    return;
  }

  const chatId = message.chat.id;
  const userId = `telegram_${message.from.id}`;
  const lang = message.from.language_code || 'en';

  console.log(`Processing /restart command`, {
    userId,
    chatId,
    username: message.from.username,
  });

  // Get user
  const user = await getUser(userId);

  if (!user) {
    // User doesn't exist, send message
    const notFoundText = lang.startsWith('es')
      ? '❌ No se encontró tu perfil. Envía /start para comenzar.'
      : '❌ Profile not found. Send /start to begin.';

    await sendMessage({
      chatId,
      text: notFoundText,
    });

    console.log('User not found for restart:', userId);
    return;
  }

  // Reset user state to NEW
  const now = new Date().toISOString();
  await updateUser(userId, {
    state: 'NEW',
    state_progress: [], // Clear progress history
    updatedAt: now,
  });

  console.log('User state reset to NEW:', userId);

  // Send confirmation message
  const confirmText = lang.startsWith('es')
    ? '🔄 *Estado Reiniciado*\n\nTu progreso ha sido reiniciado. Envía /start para comenzar de nuevo.'
    : '🔄 *State Reset*\n\nYour progress has been reset. Send /start to begin again.';

  await sendMessage({
    chatId,
    text: confirmText,
  });

  console.log('Restart confirmation sent');
}
