export const API = {
  auth: {
    googleCode: '/v1/auth/google/code',
    appleCode: '/v1/auth/apple/code',
    refresh: '/v1/auth/refresh',
    me: '/v1/auth/me',
    logout: '/v1/auth/logout',
    logoutAll: '/v1/auth/logout-all',
  },
  entries: {
    list: '/v1/entries',
    create: '/v1/entries',
    search: '/v1/entries/search',
    detail: (id: string) => `/v1/entries/${encodeURIComponent(id)}`,
    update: (id: string) => `/v1/entries/${encodeURIComponent(id)}`,
    delete: (id: string) => `/v1/entries/${encodeURIComponent(id)}`,
    restore: (id: string) => `/v1/entries/${encodeURIComponent(id)}/restore`,
  },
  comments: {
    list: (entryId: string) => `/v1/entries/${encodeURIComponent(entryId)}/comments`,
    create: (entryId: string) => `/v1/entries/${encodeURIComponent(entryId)}/comments`,
    delete: (entryId: string, commentId: string) => `/v1/entries/${encodeURIComponent(entryId)}/comments/${encodeURIComponent(commentId)}`,
  },
  reactions: {
    list: (entryId: string) => `/v1/entries/${encodeURIComponent(entryId)}/reactions`,
    create: (entryId: string) => `/v1/entries/${encodeURIComponent(entryId)}/reactions`,
    delete: (entryId: string, reactionId: string) => `/v1/entries/${encodeURIComponent(entryId)}/reactions/${encodeURIComponent(reactionId)}`,
  },
  partner: {
    get: '/v1/partner',
    invite: '/v1/partner/invite',
    acceptInvite: (code: string) => `/v1/partner/invite/${encodeURIComponent(code)}/accept`,
    respond: '/v1/partner/respond',
    delete: '/v1/partner',
  },
  circles: {
    list: '/v1/circles',
    create: '/v1/circles',
    detail: (id: string) => `/v1/circles/${encodeURIComponent(id)}`,
    update: (id: string) => `/v1/circles/${encodeURIComponent(id)}`,
    delete: (id: string) => `/v1/circles/${encodeURIComponent(id)}`,
    join: '/v1/circles/join',
    invite: (id: string) => `/v1/circles/${encodeURIComponent(id)}/invite`,
    leave: (id: string) => `/v1/circles/${encodeURIComponent(id)}/leave`,
  },
  notifications: {
    list: '/v1/notifications',
    unreadCount: '/v1/notifications/unread-count',
    markRead: (id: string) => `/v1/notifications/${encodeURIComponent(id)}/read`,
    markAllRead: '/v1/notifications/read-all',
  },
  settings: {
    get: '/v1/settings',
    update: '/v1/settings',
  },
  users: {
    updateMe: '/v1/users/me',
  },
} as const;
