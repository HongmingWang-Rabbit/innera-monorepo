import { jwtVerify, createRemoteJWKSet } from 'jose';
import { AppError } from '@innera/shared';

const googleJWKS = createRemoteJWKSet(new URL('https://www.googleapis.com/oauth2/v3/certs'));
const appleJWKS = createRemoteJWKSet(new URL('https://appleid.apple.com/auth/keys'));

interface OAuthProfile {
  email: string;
  providerUserId: string;
  rawProfile: Record<string, unknown>;
}

export async function exchangeGoogleCode(
  code: string,
  codeVerifier: string | undefined,
  redirectUri: string,
): Promise<OAuthProfile> {
  const clientId = process.env['GOOGLE_CLIENT_ID'];
  const clientSecret = process.env['GOOGLE_CLIENT_SECRET'];
  if (!clientId || !clientSecret) {
    throw new Error('GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET not configured');
  }

  const body: Record<string, string> = {
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code',
  };
  if (codeVerifier) body['code_verifier'] = codeVerifier;

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(body),
    signal: AbortSignal.timeout(10_000),
  });

  if (!res.ok) {
    throw new AppError('OAUTH_ERROR', 502, 'Google authentication failed');
  }

  const data = (await res.json()) as { id_token?: string; access_token?: string };
  if (!data.id_token) throw new Error('Google token exchange: missing id_token');

  // Verify the id_token
  const { payload } = await jwtVerify(data.id_token, googleJWKS, {
    issuer: ['https://accounts.google.com', 'accounts.google.com'],
    audience: clientId,
  });

  const email = payload['email'];
  const sub = payload['sub'];
  if (typeof email !== 'string' || typeof sub !== 'string') {
    throw new Error('Google id_token missing email or sub claim');
  }

  return {
    email,
    providerUserId: sub,
    rawProfile: payload as Record<string, unknown>,
  };
}

export async function exchangeAppleCode(
  _code: string,
  identityToken: string,
  _redirectUri: string,
): Promise<OAuthProfile> {
  const clientId = process.env['APPLE_CLIENT_ID'];
  if (!clientId) throw new Error('APPLE_CLIENT_ID not configured');

  const { payload } = await jwtVerify(identityToken, appleJWKS, {
    issuer: 'https://appleid.apple.com',
    audience: clientId,
  });

  const email = payload['email'];
  const sub = payload['sub'];
  if (typeof sub !== 'string') {
    throw new Error('Apple identity token missing sub claim');
  }

  const resolvedEmail = typeof email === 'string' ? email : `${sub}@noemail.innera.app`;
  // Removed console.warn to avoid unstructured logging in a non-Fastify service.
  // TODO: inject a logger parameter so Apple auth synthetic-email events are captured by Pino.

  return {
    email: resolvedEmail,
    providerUserId: sub,
    rawProfile: payload as Record<string, unknown>,
  };
}
