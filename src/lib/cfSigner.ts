/**
 * CloudFront signed URL generator for secure media delivery
 */

import { createSign } from 'crypto';
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

const secretsManager = new SecretsManagerClient({});

// Cache the private key in memory to avoid repeated Secrets Manager calls
let privateKeyCache: string | undefined;

/**
 * Fetch CloudFront private key from Secrets Manager (cached)
 */
async function getPrivateKey(): Promise<string> {
  if (privateKeyCache) {
    return privateKeyCache;
  }

  const secretArn = process.env.CF_PRIVATE_KEY_SECRET_ARN;
  if (!secretArn) {
    throw new Error('CF_PRIVATE_KEY_SECRET_ARN environment variable not set');
  }

  try {
    const response = await secretsManager.send(new GetSecretValueCommand({ SecretId: secretArn }));

    if (!response.SecretString) {
      throw new Error('Secret value is empty');
    }

    // Ensure the private key has proper line endings
    // If it's stored with escaped newlines, convert them
    let key = response.SecretString;
    if (key.includes('\\n')) {
      key = key.replace(/\\n/g, '\n');
    }

    privateKeyCache = key;
    console.log('CloudFront private key loaded successfully');
    return privateKeyCache;
  } catch (err) {
    console.error('Failed to fetch CloudFront private key from Secrets Manager:', err);
    throw err;
  }
}

export interface SignedUrlOptions {
  domain: string; // e.g., 'd1234abcd.cloudfront.net'
  resourcePath: string; // e.g., '/media/welcome/v1/welcome_en.mp4'
  keyPairId: string; // CloudFront Key Pair ID
  ttlSeconds: number; // e.g., 600 (10 minutes)
}

/**
 * Generate a CloudFront signed URL with short TTL
 * Uses native crypto module for compatibility with Node.js 20
 * @param options - Configuration for the signed URL
 * @returns Signed URL string
 */
export async function signCloudFrontUrl(options: SignedUrlOptions): Promise<string> {
  const { domain, resourcePath, keyPairId, ttlSeconds } = options;

  // Validate inputs
  if (!domain || !resourcePath || !keyPairId || !ttlSeconds) {
    throw new Error('Missing required parameters for CloudFront signed URL');
  }

  const privateKey = await getPrivateKey();
  const url = `https://${domain}${resourcePath}`;
  const expiresAt = Math.floor(Date.now() / 1000) + ttlSeconds;

  try {
    // Create the policy statement
    const policy = JSON.stringify({
      Statement: [
        {
          Resource: url,
          Condition: {
            DateLessThan: {
              'AWS:EpochTime': expiresAt,
            },
          },
        },
      ],
    });

    // Sign the policy with SHA1 (required by CloudFront)
    // Use the 'sha1WithRSAEncryption' algorithm which is still supported
    const sign = createSign('sha1WithRSAEncryption');
    sign.update(policy);

    // Sign with the private key - specify format explicitly
    const signature = sign.sign(privateKey, 'base64');

    // Convert to CloudFront-safe base64
    const cfSafeSignature = signature.replace(/\+/g, '-').replace(/=/g, '_').replace(/\//g, '~');

    const cfSafePolicy = Buffer.from(policy)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/=/g, '_')
      .replace(/\//g, '~');

    // Build the signed URL
    const signedUrl = `${url}?Policy=${cfSafePolicy}&Signature=${cfSafeSignature}&Key-Pair-Id=${keyPairId}`;

    console.log(`Signed CloudFront URL: ${resourcePath} (expires in ${ttlSeconds}s)`);
    return signedUrl;
  } catch (err) {
    console.error('Failed to sign CloudFront URL:', err);
    throw err;
  }
}

/**
 * Get welcome video path for a given language
 * @param lang - Language code (e.g., 'en', 'es')
 * @returns CloudFront resource path
 */
export function getWelcomeVideoPath(lang: string): string {
  const locale = lang.toLowerCase().startsWith('es') ? 'es' : 'en';
  return `/media/welcome/v1/welcome_${locale}.mp4`;
}

/**
 * Get TTS audio path for a user
 * @param s3Key - S3 key from TTS generation
 * @returns CloudFront resource path (with leading slash)
 */
export function getTTSAudioPath(s3Key: string): string {
  return `/${s3Key}`;
}
