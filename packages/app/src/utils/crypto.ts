/**
 * Base64 encoding/decoding utilities — Unicode-safe.
 *
 * MVP: These are pass-through base64 codec functions, NOT real encryption.
 * TODO: Replace with AES-256-GCM client-side encryption using the key hierarchy
 * described in docs/architecture/03-encryption.md before production release.
 */

/**
 * Decode a base64-encoded string back to UTF-8 text.
 * Uses TextDecoder for correct Unicode handling (emoji, CJK, etc.).
 * Throws on invalid base64 input — callers must handle errors.
 */
export function decodeBase64(b64: string): string {
  if (typeof atob === 'function') {
    // Browser / RN: atob returns Latin-1 bytes, decode as UTF-8
    const binaryStr = atob(b64);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }
    return new TextDecoder().decode(bytes);
  }
  // Node.js fallback
  return Buffer.from(b64, 'base64').toString('utf-8');
}

/**
 * Safely decode a base64-encoded string, returning a fallback on failure.
 * Use this in UI rendering where decoding errors should be shown gracefully.
 */
export function safeDecodeBase64(b64: string | null | undefined, fallback = '[Unable to decode]'): string {
  if (!b64) return fallback;
  try {
    return decodeBase64(b64);
  } catch {
    return fallback;
  }
}

/**
 * Encode a UTF-8 string to base64.
 * Uses TextEncoder for correct Unicode handling (emoji, CJK, etc.).
 * Throws on encoding failure — callers must handle errors.
 */
export function encodeBase64(text: string): string {
  if (typeof btoa === 'function') {
    // Browser / RN: encode UTF-8 bytes to Latin-1 string for btoa
    const bytes = new TextEncoder().encode(text);
    let binaryStr = '';
    for (let i = 0; i < bytes.length; i++) {
      binaryStr += String.fromCharCode(bytes[i]!);
    }
    return btoa(binaryStr);
  }
  // Node.js fallback
  return Buffer.from(text, 'utf-8').toString('base64');
}
