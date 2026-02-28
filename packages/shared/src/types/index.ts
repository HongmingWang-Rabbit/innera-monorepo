// ---- App Version ----

export const APP_VERSION = '0.0.1';

// ---- Enums (as const objects with value types) ----

export const Visibility = {
  PRIVATE: 'PRIVATE',
  PARTNER: 'PARTNER',
  CIRCLE: 'CIRCLE',
  FUTURE_CIRCLE_ONLY: 'FUTURE_CIRCLE_ONLY',
} as const;
export type Visibility = (typeof Visibility)[keyof typeof Visibility];

export const PartnerLinkStatus = {
  PENDING: 'PENDING',
  ACTIVE: 'ACTIVE',
  DECLINED: 'DECLINED',
  REVOKED: 'REVOKED',
} as const;
export type PartnerLinkStatus = (typeof PartnerLinkStatus)[keyof typeof PartnerLinkStatus];

export const CircleRole = {
  OWNER: 'OWNER',
  ADMIN: 'ADMIN',
  MEMBER: 'MEMBER',
} as const;
export type CircleRole = (typeof CircleRole)[keyof typeof CircleRole];

export const MembershipStatus = {
  ACTIVE: 'ACTIVE',
  LEFT: 'LEFT',
  REMOVED: 'REMOVED',
} as const;
export type MembershipStatus = (typeof MembershipStatus)[keyof typeof MembershipStatus];

export const JoinRequestStatus = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  EXPIRED: 'EXPIRED',
  CANCELLED: 'CANCELLED',
} as const;
export type JoinRequestStatus = (typeof JoinRequestStatus)[keyof typeof JoinRequestStatus];

export const HistoryPolicy = {
  ALL: 'ALL',
  FUTURE_ONLY: 'FUTURE_ONLY',
} as const;
export type HistoryPolicy = (typeof HistoryPolicy)[keyof typeof HistoryPolicy];

export const NotificationType = {
  PARTNER_REQUEST: 'PARTNER_REQUEST',
  PARTNER_ACCEPTED: 'PARTNER_ACCEPTED',
  PARTNER_REVOKED: 'PARTNER_REVOKED',
  CIRCLE_INVITED: 'CIRCLE_INVITED',
  CIRCLE_JOIN_REQUEST: 'CIRCLE_JOIN_REQUEST',
  CIRCLE_APPROVED: 'CIRCLE_APPROVED',
  CIRCLE_REJECTED: 'CIRCLE_REJECTED',
  CIRCLE_REMOVED: 'CIRCLE_REMOVED',
  COMMENT_ADDED: 'COMMENT_ADDED',
  REACTION_ADDED: 'REACTION_ADDED',
  ACCOUNT_DELETE_SCHEDULED: 'ACCOUNT_DELETE_SCHEDULED',
  ACCOUNT_DELETE_CANCELLED: 'ACCOUNT_DELETE_CANCELLED',
} as const;
export type NotificationType = (typeof NotificationType)[keyof typeof NotificationType];

export const Platform = {
  IOS: 'ios',
  ANDROID: 'android',
  WEB: 'web',
} as const;
export type Platform = (typeof Platform)[keyof typeof Platform];

export const ThemePreference = {
  SYSTEM: 'system',
  LIGHT: 'light',
  DARK: 'dark',
} as const;
export type ThemePreference = (typeof ThemePreference)[keyof typeof ThemePreference];

export const CircleStatus = {
  ACTIVE: 'ACTIVE',
  ARCHIVED: 'ARCHIVED',
} as const;
export type CircleStatus = (typeof CircleStatus)[keyof typeof CircleStatus];

export const DeletionStatus = {
  PENDING: 'PENDING',
  CANCELLED: 'CANCELLED',
  COMPLETED: 'COMPLETED',
} as const;
export type DeletionStatus = (typeof DeletionStatus)[keyof typeof DeletionStatus];

export const ImportStatus = {
  QUEUED: 'QUEUED',
  PROCESSING: 'PROCESSING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
} as const;
export type ImportStatus = (typeof ImportStatus)[keyof typeof ImportStatus];

export const RotationStatus = {
  RUNNING: 'RUNNING',
  PAUSED: 'PAUSED',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
} as const;
export type RotationStatus = (typeof RotationStatus)[keyof typeof RotationStatus];

export const AuthProvider = {
  GOOGLE: 'google',
  APPLE: 'apple',
} as const;
export type AuthProvider = (typeof AuthProvider)[keyof typeof AuthProvider];

export const ApprovalDecision = {
  APPROVE: 'APPROVE',
  REJECT: 'REJECT',
} as const;
export type ApprovalDecision = (typeof ApprovalDecision)[keyof typeof ApprovalDecision];

// ---- Pagination ----
// Use PaginationInput and PaginatedResponse inferred types from schemas/index.ts

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    nextCursor: string | null;
    hasMore: boolean;
    limit: number;
  };
}

// ---- WebSocket Events ----

export interface WsAuthMessage {
  type: 'auth';
  token: string;
}

export interface WsPingMessage {
  type: 'ping';
}

export type WsClientMessage =
  | WsAuthMessage
  | WsPingMessage;

export interface WsAuthOkMessage {
  type: 'auth_ok';
}

export interface WsErrorMessage {
  type: 'error';
  payload: { code: string; message: string };
}

export interface WsNotificationMessage {
  type: 'notification';
  payload: { id: string; type: NotificationType };
}

export interface WsUnreadCountMessage {
  type: 'unread_count';
  payload: { count: number };
}

export interface WsCommentAddedMessage {
  type: 'comment_added';
  payload: { entryId: string; commentId: string };
}

export interface WsReactionAddedMessage {
  type: 'reaction_added';
  payload: { entryId: string; reactionId: string };
}

export interface WsPartnerStatusMessage {
  type: 'partner_status';
  payload: { status: PartnerLinkStatus };
}

export interface WsCircleApprovalUpdateMessage {
  type: 'circle_approval_update';
  payload: { requestId: string; currentCount: number; requiredCount: number };
}

export interface WsPongMessage {
  type: 'pong';
}

export type WsServerMessage =
  | WsAuthOkMessage
  | WsErrorMessage
  | WsNotificationMessage
  | WsUnreadCountMessage
  | WsCommentAddedMessage
  | WsReactionAddedMessage
  | WsPartnerStatusMessage
  | WsCircleApprovalUpdateMessage
  | WsPongMessage;
