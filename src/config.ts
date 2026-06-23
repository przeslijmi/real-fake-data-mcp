/**
 * Runtime configuration for the MCP server, resolved from the process
 * environment. An MCP client (Claude Desktop, Claude Code, …) spawns this
 * server as a subprocess and passes these as `env` in its server config.
 */
export interface McpServerConfig {
  /** Base URL of the Real Fake Data API. */
  readonly baseUrl: string;
  /**
   * Optional API key. When set it is sent as `Authorization: Bearer <key>`,
   * which lifts the request onto the caller's metered plan; without it the
   * server uses the API's anonymous lane.
   */
  readonly apiKey: string | undefined;
}

/** The hosted API the server talks to when `REAL_FAKE_DATA_API_BASE_URL` is unset. */
export const DEFAULT_BASE_URL = 'https://realfakedata-api.onrender.com';

/**
 * Builds the server config from an environment bag (defaults to
 * `process.env`). `REAL_FAKE_DATA_API_BASE_URL` overrides the hosted default —
 * point it at a locally-running Real Fake Data API during development.
 */
export const loadConfig = (
  environment: Readonly<Record<string, string | undefined>> = process.env,
): McpServerConfig => {
  const baseUrl = environment['REAL_FAKE_DATA_API_BASE_URL'];
  const apiKey = environment['REAL_FAKE_DATA_API_KEY'];

  return {
    baseUrl: baseUrl !== undefined && baseUrl !== '' ? baseUrl : DEFAULT_BASE_URL,
    apiKey: apiKey !== undefined && apiKey !== '' ? apiKey : undefined,
  };
};
