export const queryKeys = {
  entries: {
    all: ['entries'] as const,
    lists: () => [...queryKeys.entries.all, 'list'] as const,
    list: (filters?: Record<string, unknown>) => [...queryKeys.entries.lists(), filters] as const,
    details: () => [...queryKeys.entries.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.entries.details(), id] as const,
    search: (q: string) => [...queryKeys.entries.all, 'search', q] as const,
  },
  notifications: {
    all: ['notifications'] as const,
    lists: () => [...queryKeys.notifications.all, 'list'] as const,
    list: (filters?: Record<string, unknown>) => [...queryKeys.notifications.lists(), filters] as const,
    unreadCount: () => [...queryKeys.notifications.all, 'unread-count'] as const,
  },
  partner: {
    all: ['partner'] as const,
    current: () => [...queryKeys.partner.all, 'current'] as const,
  },
  circles: {
    all: ['circles'] as const,
    lists: () => [...queryKeys.circles.all, 'list'] as const,
    details: () => [...queryKeys.circles.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.circles.details(), id] as const,
  },
  settings: {
    all: ['settings'] as const,
  },
  user: {
    all: ['user'] as const,
    me: () => [...queryKeys.user.all, 'me'] as const,
  },
  comments: {
    all: ['comments'] as const,
    list: (entryId: string) => [...queryKeys.comments.all, entryId] as const,
  },
  reactions: {
    all: ['reactions'] as const,
    list: (entryId: string) => [...queryKeys.reactions.all, entryId] as const,
  },
} as const;
