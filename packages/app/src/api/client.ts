export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export interface ApiClientConfig {
  baseUrl: string;
  getAccessToken: () => string | null;
  onUnauthorized: () => Promise<boolean>;
  /** Request timeout in milliseconds. Defaults to 30000. */
  timeoutMs?: number;
}

type RequestOptions = {
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined>;
  signal?: AbortSignal;
  /** When true, skip the automatic token-refresh retry on 401 responses. */
  skipAuthRetry?: boolean;
};

function buildUrl(baseUrl: string, path: string, query?: Record<string, string | number | boolean | undefined>): string {
  const url = new URL(path, baseUrl);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined) url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

async function handleResponse(
  res: Response,
  onUnauthorized: () => Promise<boolean>,
  retryFetch: () => Promise<Response>,
  skipAuthRetry?: boolean,
): Promise<unknown> {
  if (res.status === 204) return undefined;

  if (res.status === 401) {
    const json = await res.json().catch(() => null);
    if (skipAuthRetry) {
      throw new ApiError(401, json?.code ?? 'UNAUTHORIZED', json?.message ?? 'Unauthorized', json?.errors);
    }
    const refreshed = await onUnauthorized();
    if (refreshed) {
      // Retry the original request once after successful refresh
      const retryRes = await retryFetch();
      if (retryRes.status === 204) return undefined;
      if (!retryRes.ok) {
        const retryJson = await retryRes.json().catch(() => null);
        throw new ApiError(
          retryRes.status,
          retryJson?.code ?? 'UNKNOWN_ERROR',
          retryJson?.message ?? `Request failed with status ${retryRes.status}`,
          retryJson?.errors,
        );
      }
      return retryRes.json();
    }
    throw new ApiError(401, json?.code ?? 'UNAUTHORIZED', json?.message ?? 'Unauthorized', json?.errors);
  }

  if (!res.ok) {
    const json = await res.json().catch(() => null);
    throw new ApiError(
      res.status,
      json?.code ?? 'UNKNOWN_ERROR',
      json?.message ?? `Request failed with status ${res.status}`,
      json?.errors,
    );
  }

  // For successful responses, let JSON parse errors propagate
  return res.json();
}

export function createApiClient(config: ApiClientConfig) {
  // Validate baseUrl once at client creation time
  try {
    new URL(config.baseUrl);
  } catch {
    throw new Error(`[innera] Invalid API base URL: ${config.baseUrl}`);
  }

  function buildHeaders(hasBody: boolean): HeadersInit {
    const h: Record<string, string> = {};
    if (hasBody) {
      h['Content-Type'] = 'application/json';
    }
    const token = config.getAccessToken();
    if (token) h['Authorization'] = `Bearer ${token}`;
    return h;
  }

  const timeoutMs = config.timeoutMs ?? 30_000;

  async function request(method: string, path: string, opts?: RequestOptions): Promise<unknown> {
    const url = buildUrl(config.baseUrl, path, opts?.query);

    const doFetch = () => {
      // Combine caller's signal with a timeout signal
      const timeoutController = new AbortController();
      const timeoutId = setTimeout(() => timeoutController.abort(), timeoutMs);

      let signal: AbortSignal = timeoutController.signal;
      let onAbort: (() => void) | undefined;
      if (opts?.signal) {
        // If caller provided a signal, abort on whichever fires first
        const combined = new AbortController();
        onAbort = () => combined.abort();
        // Check if already aborted before adding listener
        if (opts.signal.aborted) {
          combined.abort();
        } else {
          opts.signal.addEventListener('abort', onAbort, { once: true });
        }
        timeoutController.signal.addEventListener('abort', onAbort, { once: true });
        signal = combined.signal;
      }

      return fetch(url, {
        method,
        headers: buildHeaders(!!opts?.body),
        body: opts?.body ? JSON.stringify(opts.body) : undefined,
        signal,
      }).finally(() => {
        clearTimeout(timeoutId);
        if (onAbort) {
          opts?.signal?.removeEventListener('abort', onAbort);
          timeoutController.signal.removeEventListener('abort', onAbort);
        }
      });
    };

    const res = await doFetch();
    return handleResponse(res, config.onUnauthorized, doFetch, opts?.skipAuthRetry);
  }

  return {
    get: <T = unknown>(path: string, opts?: RequestOptions) => request('GET', path, opts) as Promise<T>,
    post: <T = unknown>(path: string, opts?: RequestOptions) => request('POST', path, opts) as Promise<T>,
    put: <T = unknown>(path: string, opts?: RequestOptions) => request('PUT', path, opts) as Promise<T>,
    patch: <T = unknown>(path: string, opts?: RequestOptions) => request('PATCH', path, opts) as Promise<T>,
    delete: <T = unknown>(path: string, opts?: RequestOptions) => request('DELETE', path, opts) as Promise<T>,
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;
