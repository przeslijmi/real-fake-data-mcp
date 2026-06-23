import { RfdApiError } from './errors.js';

/** A query value as it goes on the wire; `undefined` entries are dropped. */
export type QueryValue = string | number | boolean | undefined;

/** The subset of the global `fetch` signature this client relies on. */
export type FetchLike = (input: string | URL, init?: RequestInit) => Promise<Response>;

export interface RfdCloudClientOptions {
  /** Base URL of the Real Fake Data API, without a trailing `/v1`. */
  readonly baseUrl: string;
  /** When set, sent as `Authorization: Bearer <apiKey>` on every request. */
  readonly apiKey?: string | undefined;
  /** Custom fetch implementation; defaults to the global `fetch`. */
  readonly fetch?: FetchLike;
}

/**
 * A thin HTTP client over the hosted Real Fake Data API. It maps a path and
 * query to `GET {baseUrl}/v1/{path}?{query}`, returns the parsed JSON body, and
 * turns non-2xx responses and transport failures into an {@link RfdApiError}.
 *
 * Mirrors the `CloudFakeDataProvider` of the Playwright addon, minus the typed
 * facade — the MCP tools are generic, so the client stays untyped and just
 * relays whatever JSON the API returns.
 */
export class RfdCloudClient {
  readonly #baseUrl: string;
  readonly #headers: Record<string, string>;
  readonly #fetch: FetchLike;

  public constructor(options: RfdCloudClientOptions) {
    this.#baseUrl = options.baseUrl.replace(/\/+$/u, '');
    this.#headers =
      options.apiKey === undefined ? {} : { authorization: `Bearer ${options.apiKey}` };
    this.#fetch = options.fetch ?? globalThis.fetch;
  }

  /** `GET /v1/generators` — the discovery endpoint. */
  public async listGenerators(): Promise<unknown> {
    return await this.#get('generators', {});
  }

  /** `GET /v1/{path}?{query}` — a single generator endpoint. */
  public async generate(
    path: string,
    query: Readonly<Record<string, QueryValue>>,
  ): Promise<unknown> {
    return await this.#get(path, query);
  }

  async #get(path: string, query: Readonly<Record<string, QueryValue>>): Promise<unknown> {
    const url = new URL(`${this.#baseUrl}/v1/${path}`);
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined) {
        url.searchParams.set(key, String(value));
      }
    }

    let response: Response;
    try {
      response = await this.#fetch(url, { headers: this.#headers });
    } catch (error) {
      throw new RfdApiError(
        `Request to ${url.pathname} failed: ${error instanceof Error ? error.message : String(error)}`,
        0,
      );
    }

    if (!response.ok) {
      throw await toError(response, url);
    }

    return await response.json();
  }
}

interface ApiErrorBody {
  readonly error?: {
    readonly message?: unknown;
  };
}

const toError = async (response: Response, url: URL): Promise<RfdApiError> => {
  let parsed: unknown;
  try {
    parsed = await response.json();
  } catch {
    parsed = undefined;
  }

  const apiError = (parsed as ApiErrorBody | undefined)?.error;
  const message =
    typeof apiError?.message === 'string'
      ? apiError.message
      : `Request to ${url.pathname} failed with status ${String(response.status)}`;

  return new RfdApiError(message, response.status);
};
