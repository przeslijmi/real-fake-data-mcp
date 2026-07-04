import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';

import { RfdCloudClient } from './cloud-client.js';
import type { QueryValue } from './cloud-client.js';
import type { McpServerConfig } from './config.js';
import { RfdApiError } from './errors.js';
import { generatorIdToPath } from './generator-id.js';

/**
 * Identifies this server to MCP clients. Keep in lockstep with the `version`
 * in package.json / server.json — clients surface it in their server list.
 */
const SERVER_VERSION = '1.0.0';

const jsonResult = (value: unknown): CallToolResult => ({
  content: [{ type: 'text', text: JSON.stringify(value, null, 2) }],
});

const errorResult = (error: unknown): CallToolResult => {
  const message =
    error instanceof RfdApiError
      ? `Real Fake Data API error (status ${String(error.status)}): ${error.message}`
      : `Unexpected error: ${error instanceof Error ? error.message : String(error)}`;
  return {
    content: [{ type: 'text', text: message }],
    isError: true,
  };
};

/**
 * Builds the Real Fake Data MCP server, exposing two tools over the hosted
 * API:
 *
 * - `list_generators` — discovery: returns every generator with its id,
 *   description and supported locales, so the model knows what it can ask for.
 * - `generate` — runs one generator by id, with optional per-generator
 *   `options`, a record `count`, and a `seed` for reproducible output.
 *
 * Two generic tools (rather than one tool per generator) keep the surface
 * small and self-updating: a generator added to the API shows up in
 * `list_generators` with no change here.
 */
export const createMcpServer = (config: McpServerConfig): McpServer => {
  const client = new RfdCloudClient({ baseUrl: config.baseUrl, apiKey: config.apiKey });

  const server = new McpServer({
    name: 'real-fake-data',
    version: SERVER_VERSION,
  });

  server.registerTool(
    'list_generators',
    {
      title: 'List Real Fake Data generators',
      description:
        'List every available Real Fake Data generator with its id, ' +
        'description and supported locales. Call this first to discover which ' +
        '`generator` ids the `generate` tool accepts (e.g. `pl.pesel`, ' +
        '`pl.company`, `any.email`).',
      inputSchema: {},
    },
    async (): Promise<CallToolResult> => {
      try {
        return jsonResult(await client.listGenerators());
      } catch (error) {
        return errorResult(error);
      }
    },
  );

  server.registerTool(
    'generate',
    {
      title: 'Generate realistic fake data',
      description:
        'Generate realistic synthetic data from one Real Fake Data generator. ' +
        'Pass a `generator` id from `list_generators` (e.g. `pl.pesel`). Use ' +
        '`options` for generator-specific parameters (e.g. {"sex":"f"} for a ' +
        'person, {"format":"digits-only"} for a NIP) — see each generator\'s ' +
        'description. Set `count` for a batch and `seed` for reproducible ' +
        'output. Returns the API\'s `{ data, meta }` envelope.',
      inputSchema: {
        generator: z
          .string()
          .describe('Generator id from `list_generators`, e.g. `pl.pesel` or `any.email`.'),
        options: z
          .record(z.union([z.string(), z.number(), z.boolean()]))
          .optional()
          .describe('Generator-specific query parameters; omit for defaults.'),
        count: z
          .number()
          .int()
          .positive()
          .optional()
          .describe('Number of records to generate; omit for a single record.'),
        seed: z
          .number()
          .int()
          .optional()
          .describe('Seed for reproducible output; omit to randomise each call.'),
      },
    },
    async ({ generator, options, count, seed }): Promise<CallToolResult> => {
      const query: Record<string, QueryValue> = { ...options };
      if (count !== undefined) {
        query['count'] = count;
      }
      if (seed !== undefined) {
        query['seed'] = seed;
      }

      try {
        return jsonResult(await client.generate(generatorIdToPath(generator), query));
      } catch (error) {
        return errorResult(error);
      }
    },
  );

  return server;
};
