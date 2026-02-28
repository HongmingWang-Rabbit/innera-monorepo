import type { PaginatedResponse } from '@innera/shared';

export function decodeCursor(cursor?: string): Date | null {
  if (!cursor) return null;
  try {
    const decoded = Buffer.from(cursor, 'base64url').toString('utf-8');
    const date = new Date(decoded);
    if (isNaN(date.getTime())) return null;
    return date;
  } catch {
    return null;
  }
}

export function encodeCursor(date: Date): string {
  return Buffer.from(date.toISOString()).toString('base64url');
}

export function buildPaginatedResponse<T>(
  items: T[],
  limit: number,
  getCursor: (item: T) => Date,
): PaginatedResponse<T> {
  const hasMore = items.length > limit;
  const data = hasMore ? items.slice(0, limit) : items;
  const nextCursor = hasMore && data.length > 0
    ? encodeCursor(getCursor(data[data.length - 1]!))
    : null;

  return {
    data,
    pagination: {
      nextCursor,
      hasMore,
      limit,
    },
  };
}
