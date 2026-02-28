// ---------------------------------------------------------------------------
// Shared types for platform-specific auth storage implementations.
// Bundlers resolve platform variants: .web.ts (webpack) / .native.ts (Metro).
// TypeScript uses this file directly for type-checking.
// ---------------------------------------------------------------------------

export interface AuthTokens {
  accessToken: string | null;
  refreshToken: string;
}

export interface AuthStorage {
  getTokens(): Promise<AuthTokens | null>;
  setTokens(tokens: AuthTokens): Promise<void>;
  clearTokens(): Promise<void>;
}

// Re-export the web implementation as the default so TypeScript can resolve
// `import { authStorage } from './auth-storage'`. At runtime, bundlers
// substitute auth-storage.web.ts or auth-storage.native.ts instead.
export { authStorage } from './auth-storage.web';
