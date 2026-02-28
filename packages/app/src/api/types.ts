/**
 * Shared API response wrapper types.
 * Used by all data hooks to type API responses consistently.
 */

export interface ApiResponse<T> {
  statusCode: number;
  data: T;
}

export interface ApiPaginatedResponse<T> {
  statusCode: number;
  data: T[];
  pagination: {
    nextCursor: string | null;
    hasMore: boolean;
    limit: number;
  };
}
