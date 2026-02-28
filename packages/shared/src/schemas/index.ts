import { z } from 'zod';
import {
  Visibility,
  HistoryPolicy,
  Platform,
  PartnerLinkStatus,
  NotificationType,
  ThemePreference,
} from '../types/index';

// ---- Helpers ----

function enumValues<T extends Record<string, string>>(obj: T): [T[keyof T], ...T[keyof T][]] {
  return Object.values(obj) as [T[keyof T], ...T[keyof T][]];
}

// ---- Enum value arrays derived from type const objects ----

const visibilityValues = enumValues(Visibility);
const historyPolicyValues = enumValues(HistoryPolicy);
const platformValues = enumValues(Platform);
const partnerLinkStatusValues = Object.values(PartnerLinkStatus) as [PartnerLinkStatus, ...PartnerLinkStatus[]];
const notificationTypeValues = Object.values(NotificationType) as [NotificationType, ...NotificationType[]];

// ---- Constants ----

export const MAX_ATTACHMENT_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

export const ALLOWED_ATTACHMENT_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'video/mp4',
] as const;

const themeValues = Object.values(ThemePreference) as [ThemePreference, ...ThemePreference[]];

// ---- Shared Validation Constants ----

const BASE64_REGEX = /^(?:[A-Za-z0-9+\/]{4})*(?:[A-Za-z0-9+\/]{2}==|[A-Za-z0-9+\/]{3}=|[A-Za-z0-9+\/]{4})$/;
const BASE64_ERROR = 'Invalid base64 encoding';

/** Reusable UUID params schema for route validation. */
export const uuidParamsSchema = {
  type: 'object' as const,
  required: ['id'] as const,
  properties: {
    id: { type: 'string' as const, format: 'uuid' as const },
  },
};

// ---- Validation helpers ----

function requireAtLeastOneField(data: Record<string, unknown>): boolean {
  return Object.values(data).some((v) => v !== undefined);
}

const atLeastOneFieldMessage = 'At least one field must be provided';

// ---- Auth ----

export const googleAuthSchema = z.object({
  code: z.string().min(1),
  codeVerifier: z.string().optional(),
  redirectUri: z.url(),
});

export const appleAuthSchema = z.object({
  code: z.string().min(1),
  identityToken: z.string().min(1),
  redirectUri: z.url(),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1),
});

// ---- Auth Response Schemas ----

export const authResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  expiresIn: z.number().int().positive(),
  user: z.object({
    id: z.guid(),
    email: z.email(),
    displayName: z.string().nullable(),
    avatarUrl: z.url().nullable(),
  }),
});

// ---- Entries ----

export const createEntrySchema = z.object({
  contentEncrypted: z.string().min(1).regex(BASE64_REGEX, BASE64_ERROR), // base64-encoded — do NOT trim (may corrupt encoding)
  titleEncrypted: z.string().min(1).regex(BASE64_REGEX, BASE64_ERROR).optional(), // base64-encoded
  visibility: z.enum(visibilityValues).default('PRIVATE'),
  circleId: z.guid().optional(),
  mood: z.string().trim().min(1).max(20).optional(),
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
  contentEncrypted: z.string().min(1).regex(BASE64_REGEX, BASE64_ERROR).optional(), // base64-encoded — do NOT trim
  titleEncrypted: z.string().min(1).regex(BASE64_REGEX, BASE64_ERROR).optional(), // base64-encoded
  visibility: z.enum(visibilityValues).optional(),
  circleId: z.guid().optional().nullable(),
  mood: z.string().trim().min(1).max(20).optional().nullable(),
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
    // When visibility is not provided, reject circleId without visibility context
    if (data.circleId !== undefined && data.circleId !== null) {
      return false;
    }
    return true;
  },
  { message: 'circleId required for CIRCLE/FUTURE_CIRCLE_ONLY, must be null for PRIVATE/PARTNER. Provide visibility when setting circleId.' },
);

export const entryResponseSchema = z.object({
  id: z.guid(),
  authorId: z.guid(),
  contentEncrypted: z.string(),
  titleEncrypted: z.string().nullable(),
  visibility: z.enum(visibilityValues),
  circleId: z.guid().nullable(),
  mood: z.string().nullable(),
  version: z.number().int(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

// ---- Partner ----

export const partnerRespondSchema = z.object({
  accept: z.boolean(),
});

// ---- Circles ----

export const createCircleSchema = z.object({
  name: z.string().trim().min(1).max(100),
  description: z.string().trim().min(1).max(500).optional(),
});

export const updateCircleSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  description: z.string().trim().min(1).max(500).optional().nullable(),
}).refine(requireAtLeastOneField, { message: atLeastOneFieldMessage });

export const joinCircleSchema = z.object({
  inviteCode: z.string().trim().min(1),
  historyPolicy: z.enum(historyPolicyValues),
});

export const transferAdminSchema = z.object({
  newAdminUserId: z.guid(),
});

export const circleResponseSchema = z.object({
  id: z.guid(),
  name: z.string(),
  description: z.string().nullable(),
  inviteCode: z.string().nullable(), // Only returned for OWNER role
  memberCount: z.number().int().optional(),
  status: z.enum(['ACTIVE', 'ARCHIVED']).optional(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

// ---- Comments ----

export const createCommentSchema = z.object({
  contentEncrypted: z.string().min(1).regex(BASE64_REGEX, BASE64_ERROR), // base64-encoded — do NOT trim
});

export const commentResponseSchema = z.object({
  id: z.guid(),
  entryId: z.guid(),
  authorId: z.guid(),
  contentEncrypted: z.string(),
  createdAt: z.iso.datetime(),
});

// ---- Reactions ----

export const createReactionSchema = z.object({
  emoji: z.string().trim().min(1).max(10).regex(
    /^[\p{Emoji_Presentation}\p{Extended_Pictographic}\u{FE0F}\u{200D}\u{20E3}\u{E0020}-\u{E007F}]+$/u,
    'Must contain only emoji characters',
  ),
});

export const reactionResponseSchema = z.object({
  id: z.guid(),
  entryId: z.guid(),
  userId: z.guid(),
  emoji: z.string().min(1).max(10),
  createdAt: z.iso.datetime(),
});

// ---- Notifications ----

export const notificationResponseSchema = z.object({
  id: z.guid(),
  userId: z.guid(),
  type: z.enum(notificationTypeValues),
  title: z.string().nullable(),
  body: z.string().nullable(),
  data: z.record(z.string(), z.unknown()).nullable(),
  read: z.boolean(),
  readAt: z.iso.datetime().nullable(),
  createdAt: z.iso.datetime(),
});

// ---- Partner Link ----

export const partnerLinkResponseSchema = z.object({
  id: z.guid(),
  initiatorId: z.guid(),
  partnerId: z.guid(), // DB column is NOT NULL
  status: z.enum(partnerLinkStatusValues),
  initiatedAt: z.iso.datetime(),
  respondedAt: z.iso.datetime().nullable(),
});

// ---- Settings Response ----

export const settingsResponseSchema = z.object({
  theme: z.enum(themeValues),
  notifyPartner: z.boolean(),
  notifyCircle: z.boolean(),
  notifyComments: z.boolean(),
  notifyReactions: z.boolean(),
  defaultVisibility: z.enum(visibilityValues),
  locale: z.string().max(10),
  timezone: z.string().nullable(),
});

// ---- Push Tokens ----

export const registerPushTokenSchema = z.object({
  token: z.string().min(1),
  platform: z.enum(platformValues),
});

// ---- Attachments ----

// Re-export for backwards compatibility (use ALLOWED_ATTACHMENT_MIME_TYPES above)
export const ALLOWED_MIME_TYPES = ALLOWED_ATTACHMENT_MIME_TYPES;

export const presignAttachmentSchema = z.object({
  entryId: z.guid(),
  fileName: z.string().trim().min(1).max(255),
  mimeType: z.enum(ALLOWED_ATTACHMENT_MIME_TYPES),
});

export const confirmAttachmentSchema = z.object({
  storageKey: z.string().min(1),
  entryId: z.guid(),
  sizeBytes: z.number().int().positive().max(MAX_ATTACHMENT_SIZE_BYTES),
});

// ---- Settings Update ----

export const updateSettingsSchema = z.object({
  theme: z.enum(themeValues).optional(),
  notifyPartner: z.boolean().optional(),
  notifyCircle: z.boolean().optional(),
  notifyComments: z.boolean().optional(),
  notifyReactions: z.boolean().optional(),
  defaultVisibility: z.enum(visibilityValues).optional(),
  locale: z.string().trim().min(1).max(10).optional(),
  timezone: z.string().trim().max(50).optional().nullable(),
}).refine(requireAtLeastOneField, { message: atLeastOneFieldMessage });

// ---- Users ----

export const updateUserSchema = z.object({
  displayName: z.string().trim().min(1).max(100).optional(),
  avatarUrl: z.url().refine((u) => u.startsWith('https://'), 'Avatar URL must use HTTPS').optional().nullable(),
}).refine(requireAtLeastOneField, { message: atLeastOneFieldMessage });

export const userResponseSchema = z.object({
  id: z.guid(),
  email: z.email(),
  displayName: z.string().nullable(),
  avatarUrl: z.url().nullable(),
  createdAt: z.iso.datetime(),
});

// ---- Pagination ----

export const paginationSchema = z.object({
  cursor: z.string().max(500).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20)
    .refine(Number.isFinite, 'limit must be a finite number'),
});

export const searchSchema = paginationSchema.extend({
  q: z.string().trim().min(1).max(200),
  limit: z.coerce.number().int().min(1).max(50).default(20)
    .refine(Number.isFinite, 'limit must be a finite number'),
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

// ---- WebSocket Message Schemas ----

export const wsAuthMessageSchema = z.object({
  type: z.literal('auth'),
  token: z.string().min(1),
});

export const wsPingMessageSchema = z.object({
  type: z.literal('ping'),
});

export const wsClientMessageSchema = z.discriminatedUnion('type', [
  wsAuthMessageSchema,
  wsPingMessageSchema,
]);

// ---- Inferred Types ----

export type GoogleAuthInput = z.infer<typeof googleAuthSchema>;
export type AppleAuthInput = z.infer<typeof appleAuthSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
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
export type ReactionResponse = z.infer<typeof reactionResponseSchema>;
export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type UserResponse = z.infer<typeof userResponseSchema>;
export type NotificationResponse = z.infer<typeof notificationResponseSchema>;
export type PartnerLinkResponse = z.infer<typeof partnerLinkResponseSchema>;
export type SettingsResponse = z.infer<typeof settingsResponseSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
export type SearchInput = z.infer<typeof searchSchema>;
export type JoinCircleInput = z.infer<typeof joinCircleSchema>;
export type TransferAdminInput = z.infer<typeof transferAdminSchema>;
export type PartnerRespondInput = z.infer<typeof partnerRespondSchema>;
export type RegisterPushTokenInput = z.infer<typeof registerPushTokenSchema>;
export type PresignAttachmentInput = z.infer<typeof presignAttachmentSchema>;
export type ConfirmAttachmentInput = z.infer<typeof confirmAttachmentSchema>;
