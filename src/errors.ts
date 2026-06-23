/**
 * Thrown when a Real Fake Data API request fails: a non-2xx response
 * (`status` carries the HTTP code) or a transport/configuration failure
 * (`status` is `0`). The MCP tool handlers catch these and surface the message
 * to the model as a tool error rather than crashing the server.
 */
export class RfdApiError extends Error {
  public readonly status: number;

  public constructor(message: string, status: number) {
    super(message);
    this.name = 'RfdApiError';
    this.status = status;
  }
}
