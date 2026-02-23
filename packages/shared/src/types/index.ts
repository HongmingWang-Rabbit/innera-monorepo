// ---- Enums (as const objects with value types) ----

export const Visibility = {
  PRIVATE: 'PRIVATE',
  PARTNER: 'PARTNER',
  CIRCLE: 'CIRCLE',
  FUTURE_CIRCLE_ONLY: 'FUTURE_CIRCLE_ONLY',
} as const;
export type Visibility = (typeof Visibility)[keyof typeof Visibility];
export type VisibilityValue = Visibility;

export const PartnerLinkStatus = {
  PENDING: 'PENDING',
  ACTIVE: 'ACTIVE',
  DECLINED: 'DECLINED',
  REVOKED: 'REVOKED',
} as const;
export type PartnerLinkStatus = (typeof PartnerLinkStatus)[keyof typeof PartnerLinkStatus];
export type PartnerLinkStatusValue = PartnerLinkStatus;

export const CircleRole = {
  OWNER: 'OWNER',
  ADMIN: 'ADMIN',
  MEMBER: 'MEMBER',
} as const;
export type CircleRole = (typeof CircleRole)[keyof typeof CircleRole];
export type CircleRoleValue = CircleRole;

export const MembershipStatus = {
  ACTIVE: 'ACTIVE',
  LEFT: 'LEFT',
  REMOVED: 'REMOVED',
} as const;
export type MembershipStatus = (typeof MembershipStatus)[keyof typeof MembershipStatus];
export type MembershipStatusValue = MembershipStatus;

export const JoinRequestStatus = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  EXPIRED: 'EXPIRED',
  CANCELLED: 'CANCELLED',
} as const;
export type JoinRequestStatus = (typeof JoinRequestStatus)[keyof typeof JoinRequestStatus];
export type JoinRequestStatusValue = JoinRequestStatus;

export const HistoryPolicy = {
  ALL: 'ALL',
  FUTURE_ONLY: 'FUTURE_ONLY',
} as const;
export type HistoryPolicy = (typeof HistoryPolicy)[keyof typeof HistoryPolicy];
export type HistoryPolicyValue = HistoryPolicy;

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
export type NotificationTypeValue = NotificationType;

export const Platform = {
  IOS: 'ios',
  ANDROID: 'android',
  WEB: 'web',
} as const;
export type Platform = (typeof Platform)[keyof typeof Platform];
export type PlatformValue = Platform;

// ---- Pagination ----

export interface PaginationParams {
  cursor?: string;
  limit?: number;
}

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
  | WsNotificationMessage
  | WsUnreadCountMessage
  | WsCommentAddedMessage
  | WsReactionAddedMessage
  | WsPartnerStatusMessage
  | WsCircleApprovalUpdateMessage
  | WsPongMessage;
