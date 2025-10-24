/**
 * Amazon Polly TTS with S3 caching (cache-first pattern)
 */

import { PollyClient, SynthesizeSpeechCommand, Engine, VoiceId } from '@aws-sdk/client-polly';
import { S3Client, HeadObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { Readable } from 'stream';

const polly = new PollyClient({});
const s3 = new S3Client({});

// Voice mapping by language
const VOICE_MAP: Record<string, VoiceId> = {
  en: 'Matthew',      // US English, neural
  es: 'Lucia',        // Spanish (Mexico/Latin America), neural
  'es-MX': 'Lucia',
  'es-ES': 'Lucia',
  'es-DO': 'Lucia',   // Dominican Republic
};

// Greeting text by language
const GREETING_TEXT: Record<string, string> = {
  en: "Welcome to Latina Beauty Collection. I'm your concierge. Tap Start to begin.",
  es: "Bienvenido a Latina Beauty Collection. Soy tu concierge. Toca Empezar para comenzar.",
};

export interface TTSParams {
  userId: string;
  lang: string;         // 'en', 'es', etc.
  bucket: string;       // TTS S3 bucket
  kmsKeyId?: string;    // KMS CMK ARN for SSE-KMS
}

export interface TTSResult {
  s3Key: string;        // e.g., 'tts/telegram_123/en/greeting_v1.mp3'
  cached: boolean;      // true if reused from cache, false if newly generated
}

/**
 * Get or create TTS greeting audio (cache-first)
 * 1. Check if S3 object exists
 * 2. If missing, generate via Polly and upload to S3
 * 3. Return S3 key
 */
export async function getOrCreateGreeting(params: TTSParams): Promise<TTSResult> {
  const { userId, lang, bucket, kmsKeyId } = params;

  // Normalize language code
  const normalizedLang = lang.toLowerCase().startsWith('es') ? 'es' : 'en';
  const s3Key = `tts/${userId}/${normalizedLang}/greeting_v1.mp3`;

  // Step 1: Check if cached in S3
  try {
    await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: s3Key }));
    console.log(`TTS cache hit: ${s3Key}`);
    return { s3Key, cached: true };
  } catch (err: any) {
    if (err.name !== 'NotFound') {
      console.error('Error checking S3 for TTS:', err);
      throw err;
    }
    // Not found, proceed to generation
  }

  // Step 2: Generate with Polly
  console.log(`TTS cache miss, generating with Polly: ${s3Key}`);
  
  const voice = VOICE_MAP[normalizedLang] || 'Matthew';
  const text = GREETING_TEXT[normalizedLang] || GREETING_TEXT.en;

  const synthesizeCommand = new SynthesizeSpeechCommand({
    Engine: 'neural' as Engine,
    OutputFormat: 'mp3',
    VoiceId: voice,
    Text: text,
  });

  const pollyResponse = await polly.send(synthesizeCommand);

  if (!pollyResponse.AudioStream) {
    throw new Error('Polly returned no audio stream');
  }

  // Convert stream to buffer
  const audioBuffer = await streamToBuffer(pollyResponse.AudioStream as Readable);

  // Step 3: Upload to S3 with SSE-KMS
  const putCommand = new PutObjectCommand({
    Bucket: bucket,
    Key: s3Key,
    Body: audioBuffer,
    ContentType: 'audio/mpeg',
    ServerSideEncryption: kmsKeyId ? 'aws:kms' : undefined,
    SSEKMSKeyId: kmsKeyId,
    CacheControl: 'private, max-age=31536000', // 1 year (immutable greeting)
  });

  await s3.send(putCommand);
  console.log(`TTS generated and cached: ${s3Key} (${audioBuffer.length} bytes)`);

  return { s3Key, cached: false };
}

/**
 * Convert ReadableStream to Buffer
 */
async function streamToBuffer(stream: Readable): Promise<Buffer> {
  return new Promise<Buffer>((resolve, reject) => {
    const chunks: Uint8Array[] = [];
    stream.on('data', (chunk) => chunks.push(chunk));
    stream.on('error', reject);
    stream.on('end', () => resolve(Buffer.concat(chunks)));
  });
}

/**
 * Get Polly voice for a language code
 */
export function getVoiceForLanguage(lang: string): VoiceId {
  const normalized = lang.toLowerCase().startsWith('es') ? 'es' : 'en';
  return VOICE_MAP[normalized] || 'Matthew';
}
