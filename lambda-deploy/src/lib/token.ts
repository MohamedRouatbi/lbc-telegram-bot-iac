/**
 * Token decoder for /start <token> deep links
 * Format: base64url(ref_code|utm_source|utm_medium|utm_campaign|nonce|ts)
 */

export interface StartAttrs {
  ref_code?: string;
  utm?: {
    source?: string;
    medium?: string;
    campaign?: string;
    content?: string;
  };
  nonce?: string;
  ts?: number;
}

/**
 * Decode a base64url-encoded start token
 * @param token - The token from /start command (e.g., /start <token>)
 * @returns Parsed attributes (referral, UTM, timestamp, nonce)
 */
export function decodeStartToken(token?: string): StartAttrs {
  if (!token || token.trim() === '') {
    return {};
  }

  try {
    // base64url decode: replace URL-safe chars and decode
    const padded = token.replace(/-/g, '+').replace(/_/g, '/');
    const json = Buffer.from(padded, 'base64').toString('utf8');
    
    // Expected format: ref_code|utm_source|utm_medium|utm_campaign|nonce|ts
    const parts = json.split('|');
    const [ref_code, utm_source, utm_medium, utm_campaign, nonce, tsStr] = parts;

    const result: StartAttrs = {};

    if (ref_code) result.ref_code = ref_code;
    
    if (utm_source || utm_medium || utm_campaign) {
      result.utm = {
        source: utm_source || undefined,
        medium: utm_medium || undefined,
        campaign: utm_campaign || undefined,
      };
    }

    if (nonce) result.nonce = nonce;
    if (tsStr && !isNaN(Number(tsStr))) result.ts = Number(tsStr);

    return result;
  } catch (err) {
    console.warn('Failed to decode start token:', err);
    return {};
  }
}

/**
 * Validate token age (optional - reject tokens older than 7 days)
 * @param attrs - Parsed token attributes
 * @param maxAgeSeconds - Maximum age in seconds (default: 7 days)
 * @returns true if valid, false if expired
 */
export function isTokenValid(attrs: StartAttrs, maxAgeSeconds: number = 7 * 24 * 60 * 60): boolean {
  if (!attrs.ts) return true; // If no timestamp, accept it
  const now = Math.floor(Date.now() / 1000);
  return (now - attrs.ts) <= maxAgeSeconds;
}
