/**
 * S3 pre-signed URL generator for secure media delivery
 * Replaces CloudFront signed URLs to avoid OpenSSL SHA-1 deprecation issues
 */

import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3Client = new S3Client({});

export interface SignedUrlOptions {
  bucketName: string; // S3 bucket name
  objectKey: string; // S3 object key (without leading slash)
  ttlSeconds: number; // e.g., 600 (10 minutes)
}

/**
 * Generate an S3 pre-signed URL with short TTL
 * This approach avoids the CloudFront RSA-SHA1 signing issues
 * @param options - Configuration for the pre-signed URL
 * @returns Pre-signed URL string
 */
export async function signS3Url(options: SignedUrlOptions): Promise<string> {
  const { bucketName, objectKey, ttlSeconds } = options;

  // Validate inputs
  if (!bucketName || !objectKey || !ttlSeconds) {
    throw new Error('Missing required parameters for S3 pre-signed URL');
  }

  try {
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: objectKey,
    });

    const signedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: ttlSeconds,
    });

    console.log(`Signed S3 URL: s3://${bucketName}/${objectKey} (expires in ${ttlSeconds}s)`);
    return signedUrl;
  } catch (err) {
    console.error('Failed to sign S3 URL:', err);
    throw err;
  }
}

/**
 * Get welcome video S3 key for a given language
 * @param lang - Language code (e.g., 'en', 'es')
 * @returns S3 object key
 */
export function getWelcomeVideoKey(lang: string): string {
  const locale = lang.toLowerCase().startsWith('es') ? 'es' : 'en';
  return `media/welcome/v1/welcome_${locale}.mp4`;
}

/**
 * Get TTS audio S3 key for a user
 * @param s3Key - S3 key from TTS generation
 * @returns S3 object key (without leading slash)
 */
export function getTTSAudioKey(s3Key: string): string {
  // Remove leading slash if present
  return s3Key.startsWith('/') ? s3Key.slice(1) : s3Key;
}
