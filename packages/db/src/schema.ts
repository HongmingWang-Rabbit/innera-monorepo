import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  integer,
  smallint,
  bigint,
  timestamp,
  jsonb,
  inet,
  customType,
  uniqueIndex,
  index,
  primaryKey,
  pgEnum,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// ---- Custom types ----

const bytea = customType<{ data: Buffer }>({
  dataType() {
    return 'bytea';
  },
});

// ---- Enums ----

export const visibilityEnum = pgEnum('visibility', [
  'PRIVATE',
  'PARTNER',
  'CIRCLE',
  'FUTURE_CIRCLE_ONLY',
]);

export const partnerLinkStatusEnum = pgEnum('partner_link_status', [
  'PENDING',
  'ACTIVE',
  'DECLINED',
  'REVOKED',
]);

export const circleStatusEnum = pgEnum('circle_status', ['ACTIVE', 'ARCHIVED']);

export const circleRoleEnum = pgEnum('circle_role', ['ADMIN', 'MEMBER']);

export const membershipStatusEnum = pgEnum('membership_status', [
  'ACTIVE',
  'LEFT',
  'REMOVED',
]);

export const joinRequestStatusEnum = pgEnum('join_request_status', [
  'PENDING',
  'APPROVED',
  'REJECTED',
  'EXPIRED',
  'CANCELLED',
]);

export const historyPolicyEnum = pgEnum('history_policy', ['ALL', 'FUTURE_ONLY']);

export const approvalDecisionEnum = pgEnum('approval_decision', ['APPROVE', 'REJECT']);

export const notificationTypeEnum = pgEnum('notification_type', [
  'PARTNER_REQUEST',
  'PARTNER_ACCEPTED',
  'PARTNER_REVOKED',
  'CIRCLE_INVITED',
  'CIRCLE_JOIN_REQUEST',
  'CIRCLE_APPROVED',
  'CIRCLE_REJECTED',
  'CIRCLE_REMOVED',
  'COMMENT_ADDED',
  'REACTION_ADDED',
  'ACCOUNT_DELETE_SCHEDULED',
  'ACCOUNT_DELETE_CANCELLED',
]);

export const platformEnum = pgEnum('platform', ['ios', 'android', 'web']);

export const deletionStatusEnum = pgEnum('deletion_status', [
  'PENDING',
  'CANCELLED',
  'COMPLETED',
]);

export const importStatusEnum = pgEnum('import_status', [
  'QUEUED',
  'PROCESSING',
  'COMPLETED',
  'FAILED',
]);

export const rotationStatusEnum = pgEnum('rotation_status', [
  'RUNNING',
  'PAUSED',
  'COMPLETED',
  'FAILED',
]);

export const authProviderEnum = pgEnum('auth_provider', ['google', 'apple']);

// ---- Tables ----

export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    displayName: varchar('display_name', { length: 100 }),
    email: varchar('email', { length: 255 }).notNull(),
    avatarUrl: text('avatar_url'),
    encryptionSalt: bytea('encryption_salt').notNull(),
    encryptionVersion: smallint('encryption_version').default(1).notNull(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date()),
  },
  (t) => [uniqueIndex('users_email_unique').on(t.email).where(sql`deleted_at IS NULL`)],
);

export const authIdentities = pgTable(
  'auth_identities',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    provider: authProviderEnum('provider').notNull(),
    providerUserId: text('provider_user_id').notNull(),
    email: varchar('email', { length: 255 }),
    rawProfile: jsonb('raw_profile'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [uniqueIndex('auth_identities_provider_unique').on(t.provider, t.providerUserId)],
);

export const userSettings = pgTable('user_settings', {
  userId: uuid('user_id')
    .primaryKey()
    .references(() => users.id, { onDelete: 'cascade' }),
  theme: varchar('theme', { length: 10 }).default('system').notNull(),
  notifyPartner: boolean('notify_partner').default(true).notNull(),
  notifyCircle: boolean('notify_circle').default(true).notNull(),
  notifyComments: boolean('notify_comments').default(true).notNull(),
  notifyReactions: boolean('notify_reactions').default(false).notNull(),
  defaultVisibility: visibilityEnum('default_visibility').default('PRIVATE').notNull(),
  locale: varchar('locale', { length: 10 }).default('en').notNull(),
  timezone: varchar('timezone', { length: 50 }),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date()),
});

export const circles = pgTable('circles', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
  status: circleStatusEnum('status').default('ACTIVE').notNull(),
  maxMembers: integer('max_members').default(20).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const entries = pgTable(
  'entries',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    authorId: uuid('author_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    title: varchar('title', { length: 200 }),
    titleEncrypted: bytea('title_encrypted'),
    contentEncrypted: bytea('content_encrypted').notNull(),
    encryptionVersion: smallint('encryption_version').default(1).notNull(),
    visibility: visibilityEnum('visibility').default('PRIVATE').notNull(),
    circleId: uuid('circle_id').references(() => circles.id, { onDelete: 'restrict' }),
    mood: varchar('mood', { length: 20 }),
    version: integer('version').default(1).notNull(),
    conflictOf: uuid('conflict_of'),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date()),
  },
  (t) => [
    index('entries_author_deleted_created').on(t.authorId, t.deletedAt, t.createdAt),
    index('entries_circle_id').on(t.circleId),
    index('entries_author_updated').on(t.authorId, t.updatedAt),
  ],
);

export const tags = pgTable(
  'tags',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 50 }).notNull(),
    userId: uuid('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
  },
  (t) => [uniqueIndex('tags_user_name_lower').on(t.userId, sql`lower(${t.name})`)],
);

export const entryTags = pgTable(
  'entry_tags',
  {
    entryId: uuid('entry_id')
      .references(() => entries.id, { onDelete: 'cascade' })
      .notNull(),
    tagId: uuid('tag_id')
      .references(() => tags.id, { onDelete: 'cascade' })
      .notNull(),
  },
  (t) => [primaryKey({ columns: [t.entryId, t.tagId] })],
);

export const entryKeyGrants = pgTable(
  'entry_key_grants',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    entryId: uuid('entry_id')
      .references(() => entries.id, { onDelete: 'cascade' })
      .notNull(),
    userId: uuid('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    encryptedKey: bytea('encrypted_key').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex('entry_key_grants_entry_user').on(t.entryId, t.userId),
  ],
);

export const partnerLinks = pgTable(
  'partner_links',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    initiatorId: uuid('initiator_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    partnerId: uuid('partner_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    status: partnerLinkStatusEnum('status').notNull(),
    initiatedAt: timestamp('initiated_at', { withTimezone: true }).defaultNow().notNull(),
    respondedAt: timestamp('responded_at', { withTimezone: true }),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
    revokedBy: uuid('revoked_by').references(() => users.id, { onDelete: 'set null' }),
  },
  (t) => [
    index('partner_links_initiator_status').on(t.initiatorId, t.status),
    index('partner_links_partner_status').on(t.partnerId, t.status),
    uniqueIndex('partner_links_active_initiator').on(t.initiatorId).where(sql`status = 'ACTIVE'`),
    uniqueIndex('partner_links_active_partner').on(t.partnerId).where(sql`status = 'ACTIVE'`),
    uniqueIndex('partner_links_pending_active_pair')
      .on(t.initiatorId, t.partnerId)
      .where(sql`status IN ('PENDING', 'ACTIVE')`),
  ],
);

export const circleMemberships = pgTable(
  'circle_memberships',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    circleId: uuid('circle_id')
      .references(() => circles.id, { onDelete: 'cascade' })
      .notNull(),
    userId: uuid('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    role: circleRoleEnum('role').default('MEMBER').notNull(),
    status: membershipStatusEnum('status').notNull(),
    joinedAt: timestamp('joined_at', { withTimezone: true }).defaultNow().notNull(),
    leftAt: timestamp('left_at', { withTimezone: true }),
    historyPolicy: historyPolicyEnum('history_policy').notNull(),
  },
  (t) => [
    uniqueIndex('circle_memberships_active_unique')
      .on(t.circleId, t.userId)
      .where(sql`status = 'ACTIVE'`),
    index('circle_memberships_circle_user').on(t.circleId, t.userId),
  ],
);

export const circleInvites = pgTable(
  'circle_invites',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    circleId: uuid('circle_id')
      .references(() => circles.id, { onDelete: 'cascade' })
      .notNull(),
    invitedBy: uuid('invited_by').references(() => users.id, { onDelete: 'set null' }),
    inviteCode: varchar('invite_code', { length: 32 }).unique().notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    maxUses: integer('max_uses').default(1).notNull(),
    usedCount: integer('used_count').default(0).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index('circle_invites_circle_id').on(t.circleId)],
);

export const circleJoinRequests = pgTable(
  'circle_join_requests',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    circleId: uuid('circle_id')
      .references(() => circles.id, { onDelete: 'cascade' })
      .notNull(),
    requesterId: uuid('requester_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    inviteId: uuid('invite_id').references(() => circleInvites.id, { onDelete: 'set null' }),
    status: joinRequestStatusEnum('status').notNull(),
    historyPolicy: historyPolicyEnum('history_policy').notNull(),
    requiredCount: integer('required_count').notNull(),
    currentCount: integer('current_count').default(0).notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    resolvedAt: timestamp('resolved_at', { withTimezone: true }),
  },
  (t) => [
    index('circle_join_requests_circle_status').on(t.circleId, t.status),
    index('circle_join_requests_requester').on(t.requesterId),
  ],
);

export const circleJoinApprovals = pgTable(
  'circle_join_approvals',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    requestId: uuid('request_id')
      .references(() => circleJoinRequests.id, { onDelete: 'cascade' })
      .notNull(),
    approverId: uuid('approver_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    decision: approvalDecisionEnum('decision').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [uniqueIndex('circle_join_approvals_request_approver').on(t.requestId, t.approverId)],
);

export const comments = pgTable(
  'comments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    entryId: uuid('entry_id')
      .references(() => entries.id, { onDelete: 'cascade' })
      .notNull(),
    authorId: uuid('author_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    contentEncrypted: bytea('content_encrypted').notNull(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index('comments_entry_id').on(t.entryId)],
);

export const reactions = pgTable(
  'reactions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    entryId: uuid('entry_id')
      .references(() => entries.id, { onDelete: 'cascade' })
      .notNull(),
    userId: uuid('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    emoji: varchar('emoji', { length: 10 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex('reactions_entry_user_emoji').on(t.entryId, t.userId, t.emoji),
    index('reactions_entry_id').on(t.entryId),
  ],
);

export const notifications = pgTable(
  'notifications',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    type: notificationTypeEnum('type').notNull(),
    title: varchar('title', { length: 200 }),
    body: text('body'),
    data: jsonb('data'),
    read: boolean('read').default(false).notNull(),
    readAt: timestamp('read_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index('notifications_user_read_created').on(t.userId, t.read, t.createdAt)],
);

export const pushTokens = pgTable(
  'push_tokens',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    token: text('token').notNull(),
    platform: platformEnum('platform').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date()),
  },
  (t) => [uniqueIndex('push_tokens_user_token').on(t.userId, t.token)],
);

export const auditEvents = pgTable(
  'audit_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .references(() => users.id, { onDelete: 'set null' }), // nullable — set null on account delete, audit logs preserved
    action: varchar('action', { length: 100 }).notNull(),
    targetType: varchar('target_type', { length: 50 }),
    targetId: uuid('target_id'), // intentionally no FK — append-only log
    metadata: jsonb('metadata'),
    ipAddress: inet('ip_address'),
    requestId: uuid('request_id'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index('audit_events_user_created').on(t.userId, t.createdAt),
    index('audit_events_target').on(t.targetType, t.targetId),
  ],
);

export const attachments = pgTable(
  'attachments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    entryId: uuid('entry_id')
      .references(() => entries.id, { onDelete: 'cascade' })
      .notNull(),
    userId: uuid('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    storageKey: text('storage_key').notNull(),
    fileName: varchar('file_name', { length: 255 }),
    mimeType: varchar('mime_type', { length: 100 }),
    sizeBytes: bigint('size_bytes', { mode: 'number' }),
    encryptionVersion: smallint('encryption_version').default(1).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index('attachments_entry_id').on(t.entryId)],
);

export const accountDeletionRequests = pgTable(
  'account_deletion_requests',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    status: deletionStatusEnum('status').notNull(),
    lastCompletedStep: integer('last_completed_step').default(0).notNull(),
    requestedAt: timestamp('requested_at', { withTimezone: true }).defaultNow().notNull(),
    scheduledFor: timestamp('scheduled_for', { withTimezone: true }).notNull(),
    cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
    completedAt: timestamp('completed_at', { withTimezone: true }),
  },
  (t) => [
    index('account_deletion_requests_status_scheduled').on(t.status, t.scheduledFor),
    index('account_deletion_requests_user').on(t.userId),
  ],
);

export const importJobs = pgTable(
  'import_jobs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    format: varchar('format', { length: 20 }).notNull(),
    status: importStatusEnum('status').notNull(),
    totalEntries: integer('total_entries'),
    processedEntries: integer('processed_entries').default(0).notNull(),
    failedEntries: integer('failed_entries').default(0).notNull(),
    errorMessage: text('error_message'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    completedAt: timestamp('completed_at', { withTimezone: true }),
  },
  (t) => [index('import_jobs_user_id').on(t.userId)],
);

export const keyRotationJobs = pgTable(
  'key_rotation_jobs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    fromVersion: smallint('from_version').notNull(),
    toVersion: smallint('to_version').notNull(),
    status: rotationStatusEnum('status').notNull(),
    totalEntries: integer('total_entries').notNull(),
    processedEntries: integer('processed_entries').default(0).notNull(),
    failedEntries: integer('failed_entries').default(0).notNull(),
    startedAt: timestamp('started_at', { withTimezone: true }).defaultNow().notNull(),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    lastError: text('last_error'),
  },
  (t) => [index('key_rotation_jobs_user_id').on(t.userId)],
);
