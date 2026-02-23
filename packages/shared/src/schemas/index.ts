import { z } from 'zod';
import {
  Visibility,
  HistoryPolicy,
  Platform,
} from '../types/index.js';

// ---- Enum value arrays derived from type const objects ----

const visibilityValues = Object.values(Visibility) as [Visibility, ...Visibility[]];
const historyPolicyValues = Object.values(HistoryPolicy) as [HistoryPolicy, ...HistoryPolicy[]];
const platformValues = Object.values(Platform) as [Platform, ...Platform[]];

// ---- Shared field schemas ----

const passwordSchema = z.string().min(8, 'Password must be at least 8 characters').max(128, 'Password must be at most 128 characters');

// ---- Auth ----

export const googleAuthSchema = z.object({
  code: z.string().min(1),
  codeVerifier: z.string().optional(),
  redirectUri: z.string().url(),
});

export const appleAuthSchema = z.object({
  code: z.string().min(1),
  identityToken: z.string().min(1),
  redirectUri: z.string().url(),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1),
});

export const emailAuthSchema = z.object({
  email: z.string().email().toLowerCase().trim(),
  password: passwordSchema,
});

export const registerSchema = z.object({
  email: z.string().email().toLowerCase().trim(),
  password: passwordSchema,
  displayName: z.string().trim().min(1).max(100),
});

// ---- Auth Response Schemas ----

export const authResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  expiresIn: z.number().int().positive(),
  user: z.object({
    id: z.string().uuid(),
    email: z.string().email(),
    displayName: z.string().nullable(),
    avatarUrl: z.string().url().nullable().optional(),
  }),
});

// ---- Entries ----

export const createEntrySchema = z.object({
  contentEncrypted: z.string().trim().min(1), // base64-encoded
  titleEncrypted: z.string().trim().optional(), // base64-encoded
  visibility: z.enum(visibilityValues).default('PRIVATE'),
  circleId: z.string().uuid().optional(),
  mood: z.string().trim().max(20).optional(),
}).refine(
  (data) => {
    if (data.visibility === 'CIRCLE' || data.visibility === 'FUTURE_CIRCLE_ONLY') {
      return !!data.circleId;
    }
    return !data.circleId;
  },
  { message: 'circleId required for CIRCLE/FUTURE_CIRCLE_ONLY, must be null for PRIVATE/PARTNER' },
);

export const updateEntrySchema = z.object({
  contentEncrypted: z.string().trim().min(1),
  titleEncrypted: z.string().trim().optional(),
  visibility: z.enum(visibilityValues).optional(),
  circleId: z.string().uuid().optional().nullable(),
  mood: z.string().trim().max(20).optional().nullable(),
  version: z.number().int().positive(), // required for conflict detection
}).refine(
  (data) => {
    // Only validate cross-field constraint when visibility is explicitly provided
    if (data.visibility === 'CIRCLE' || data.visibility === 'FUTURE_CIRCLE_ONLY') {
      return !!data.circleId;
    }
    if (data.visibility === 'PRIVATE' || data.visibility === 'PARTNER') {
      return !data.circleId;
    }
    return true;
  },
  { message: 'circleId required for CIRCLE/FUTURE_CIRCLE_ONLY, must be null for PRIVATE/PARTNER' },
);

export const entryResponseSchema = z.object({
  id: z.string().uuid(),
  authorId: z.string().uuid(),
  contentEncrypted: z.string(),
  titleEncrypted: z.string().nullable().optional(),
  visibility: z.enum(visibilityValues),
  circleId: z.string().uuid().nullable().optional(),
  mood: z.string().nullable().optional(),
  version: z.number().int(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

// ---- Partner ----

export const partnerRespondSchema = z.object({
  accept: z.boolean(),
});

// ---- Circles ----

export const createCircleSchema = z.object({
  name: z.string().trim().min(1).max(100),
  description: z.string().trim().max(500).optional(),
});

export const updateCircleSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  description: z.string().trim().max(500).optional(),
});

export const joinCircleSchema = z.object({
  inviteCode: z.string().trim().min(1),
  historyPolicy: z.enum(historyPolicyValues),
});

export const transferAdminSchema = z.object({
  newAdminUserId: z.string().uuid(),
});

export const circleResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable().optional(),
  inviteCode: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

// ---- Comments ----

export const createCommentSchema = z.object({
  contentEncrypted: z.string().trim().min(1),
});

export const commentResponseSchema = z.object({
  id: z.string().uuid(),
  entryId: z.string().uuid(),
  authorId: z.string().uuid(),
  contentEncrypted: z.string(),
  createdAt: z.string().datetime(),
});

// ---- Reactions ----

export const createReactionSchema = z.object({
  emoji: z.string().trim().min(1).max(10),
});

// ---- Push Tokens ----

export const registerPushTokenSchema = z.object({
  token: z.string().min(1),
  platform: z.enum(platformValues),
});

// ---- Attachments ----

export const presignAttachmentSchema = z.object({
  entryId: z.string().uuid(),
  fileName: z.string().trim().min(1).max(255),
  mimeType: z.enum(['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'video/mp4']),
});

export const confirmAttachmentSchema = z.object({
  storageKey: z.string().min(1),
  entryId: z.string().uuid(),
  sizeBytes: z.number().int().positive().max(10 * 1024 * 1024), // 10MB
});

// ---- Settings ----

export const updateSettingsSchema = z.object({
  theme: z.enum(['system', 'light', 'dark']).optional(),
  notifyPartner: z.boolean().optional(),
  notifyCircle: z.boolean().optional(),
  notifyComments: z.boolean().optional(),
  notifyReactions: z.boolean().optional(),
  defaultVisibility: z.enum(visibilityValues).optional(),
  locale: z.string().trim().max(10).optional(),
  timezone: z.string().trim().max(50).optional(),
});

// ---- Users ----

export const updateUserSchema = z.object({
  displayName: z.string().trim().min(1).max(100).optional(),
  avatarUrl: z.string().url().optional().nullable(),
});

export const userResponseSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  displayName: z.string().nullable(),
  avatarUrl: z.string().url().nullable().optional(),
  createdAt: z.string().datetime(),
});

// ---- Pagination ----

export const paginationSchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const searchSchema = z.object({
  q: z.string().trim().min(1).max(200),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export const paginatedResponseSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    data: z.array(itemSchema),
    pagination: z.object({
      nextCursor: z.string().nullable(),
      hasMore: z.boolean(),
      limit: z.number().int(),
    }),
  });

// ---- Inferred Types ----

export type GoogleAuthInput = z.infer<typeof googleAuthSchema>;
export type AppleAuthInput = z.infer<typeof appleAuthSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
export type EmailAuthInput = z.infer<typeof emailAuthSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type AuthResponse = z.infer<typeof authResponseSchema>;
export type CreateEntryInput = z.infer<typeof createEntrySchema>;
export type UpdateEntryInput = z.infer<typeof updateEntrySchema>;
export type EntryResponse = z.infer<typeof entryResponseSchema>;
export type CreateCircleInput = z.infer<typeof createCircleSchema>;
export type UpdateCircleInput = z.infer<typeof updateCircleSchema>;
export type CircleResponse = z.infer<typeof circleResponseSchema>;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type CommentResponse = z.infer<typeof commentResponseSchema>;
export type CreateReactionInput = z.infer<typeof createReactionSchema>;
export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type UserResponse = z.infer<typeof userResponseSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
export type SearchInput = z.infer<typeof searchSchema>;
