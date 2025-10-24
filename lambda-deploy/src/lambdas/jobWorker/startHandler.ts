/**
 * /start command handler for onboarding flow
 */

import type { TelegramMessage, UserRecord } from '../../lib/types';
import { getUser, updateUser, createUser } from '../../lib/dynamodb';
import { decodeStartToken } from '../../lib/token';
import { nextState, createProgressEntry } from '../../lib/fsm';
import { signCloudFrontUrl, getWelcomeVideoPath, getTTSAudioPath } from '../../lib/cfSigner';
import { getOrCreateGreeting } from '../../lib/tts';
import { sendMessage } from '../../lib/telegram';

const CF_DOMAIN = process.env.CF_DOMAIN || '';
const CF_KEY_PAIR_ID = process.env.CF_KEY_PAIR_ID || '';
const TTS_BUCKET = process.env.TTS_BUCKET || '';
const KMS_KEY_ARN = process.env.KMS_KEY_ARN;

/**
 * Handle /start command
 */
export async function handleStartCommand(message: TelegramMessage): Promise<void> {
  if (!message.from || !message.text) {
    console.log('Invalid start command: missing from or text');
    return;
  }

  const chatId = message.chat.id;
  const userId = `telegram_${message.from.id}`;
  const lang = message.from.language_code || 'en';

  console.log(`Processing /start command`, {
    userId,
    chatId,
    username: message.from.username,
    lang,
  });

  // Parse /start token if present
  // Format: /start <token>
  const parts = message.text.split(' ');
  const token = parts.length > 1 ? parts.slice(1).join(' ') : undefined;
  const tokenAttrs = decodeStartToken(token);

  console.log('Decoded start token:', tokenAttrs);

  // Get or create user
  let user = await getUser(userId);
  const now = new Date().toISOString();

  if (!user) {
    // Create new user
    const newUser: UserRecord = {
      userId,
      telegramId: message.from.id,
      firstName: message.from.first_name,
      lastName: message.from.last_name,
      username: message.from.username,
      languageCode: lang,
      createdAt: now,
      updatedAt: now,
      state: 'NEW',
      state_progress: [],
      first_start_ts: now,
      last_start_ts: now,
      ref_code: tokenAttrs.ref_code,
      utm: tokenAttrs.utm,
    };

    await createUser(newUser);
    user = newUser;
    console.log('New user created:', userId);
  } else {
    // Update existing user
    const updates: Partial<UserRecord> = {
      updatedAt: now,
      last_start_ts: now,
      firstName: message.from.first_name,
      lastName: message.from.last_name,
      username: message.from.username,
      languageCode: lang,
    };

    // Update first_start_ts if not set
    if (!user.first_start_ts) {
      updates.first_start_ts = now;
    }

    // Update referral data if present and not already set
    if (tokenAttrs.ref_code && !user.ref_code) {
      updates.ref_code = tokenAttrs.ref_code;
    }
    if (tokenAttrs.utm && !user.utm) {
      updates.utm = tokenAttrs.utm;
    }

    await updateUser(userId, updates);
    console.log('Existing user updated:', userId);

    // Refresh user data
    user = await getUser(userId);
    if (!user) {
      throw new Error(`User not found after update: ${userId}`);
    }
  }

  // Determine next step based on FSM
  const currentState = user.state || 'NEW';
  const next = nextState(currentState);

  console.log('FSM transition:', { current: currentState, next });

  // Execute the next step
  await executeStateAction(user, next, chatId, lang);
}

/**
 * Execute action for a given state
 */
async function executeStateAction(
  user: UserRecord,
  state: 'NEW' | 'WELCOME_VIDEO_SENT' | 'TTS_SENT' | 'DONE',
  chatId: number,
  lang: string
): Promise<void> {
  const userId = user.userId;
  const now = new Date().toISOString();

  switch (state) {
    case 'WELCOME_VIDEO_SENT':
      // Send welcome video
      console.log('Sending welcome video...');
      
      const videoPath = getWelcomeVideoPath(lang);
      const videoUrl = await signCloudFrontUrl({
        domain: CF_DOMAIN,
        resourcePath: videoPath,
        keyPairId: CF_KEY_PAIR_ID,
        ttlSeconds: 600, // 10 minutes
      });

      const welcomeText = lang.startsWith('es')
        ? '🎬 *Bienvenido a Latina Beauty Collection*\n\nSoy tu concierge personal. Toca el botón para ver tu video de bienvenida.'
        : '🎬 *Welcome to Latina Beauty Collection*\n\nI\'m your personal concierge. Tap the button to watch your welcome video.';

      await sendMessage({
        chatId,
        text: welcomeText,
        buttons: [
          [
            { text: '▶️ Watch Welcome Video', url: videoUrl },
          ],
        ],
      });

      // Update user state
      const progress1 = user.state_progress || [];
      progress1.push(createProgressEntry('WELCOME_VIDEO_SENT'));

      await updateUser(userId, {
        state: 'WELCOME_VIDEO_SENT',
        state_progress: progress1,
        updatedAt: now,
      });

      console.log('Welcome video sent successfully');
      break;

    case 'TTS_SENT':
      // Generate or get cached TTS greeting
      console.log('Generating/fetching TTS greeting...');

      const { s3Key, cached } = await getOrCreateGreeting({
        userId,
        lang,
        bucket: TTS_BUCKET,
        kmsKeyId: KMS_KEY_ARN,
      });

      console.log(`TTS greeting: ${s3Key} (cached: ${cached})`);

      // Sign the TTS URL
      const audioPath = getTTSAudioPath(s3Key);
      const audioUrl = await signCloudFrontUrl({
        domain: CF_DOMAIN,
        resourcePath: audioPath,
        keyPairId: CF_KEY_PAIR_ID,
        ttlSeconds: 600, // 10 minutes
      });

      const ttsText = lang.startsWith('es')
        ? '🔊 *Tu Saludo Personal*\n\nEscucha tu mensaje personalizado de bienvenida.'
        : '🔊 *Your Personal Greeting*\n\nListen to your personalized welcome message.';

      await sendMessage({
        chatId,
        text: ttsText,
        buttons: [
          [
            { text: '🔊 Play Greeting', url: audioUrl },
          ],
        ],
      });

      // Update user state and TTS metadata
      const progress2 = user.state_progress || [];
      progress2.push(createProgressEntry('TTS_SENT'));

      await updateUser(userId, {
        state: 'TTS_SENT',
        state_progress: progress2,
        tts_key: s3Key,
        tts_lang: lang,
        updatedAt: now,
      });

      console.log('TTS greeting sent successfully');
      break;

    case 'DONE':
      // Onboarding complete
      console.log('Onboarding complete');

      const doneText = lang.startsWith('es')
        ? '✅ *¡Todo Listo!*\n\nTu configuración está completa. Escribe /menu en cualquier momento para ver las opciones.'
        : '✅ *You\'re All Set!*\n\nYour setup is complete. Type /menu anytime to see your options.';

      await sendMessage({
        chatId,
        text: doneText,
      });

      // Update to DONE state
      const progress3 = user.state_progress || [];
      progress3.push(createProgressEntry('DONE'));

      await updateUser(userId, {
        state: 'DONE',
        state_progress: progress3,
        updatedAt: now,
      });

      console.log('Onboarding flow completed');
      break;

    default:
      console.log('Unknown state:', state);
  }
}
