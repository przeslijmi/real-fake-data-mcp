#!/usr/bin/env node
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

import { loadConfig } from './config.js';
import { createMcpServer } from './create-mcp-server.js';

/**
 * Entry point. An MCP client spawns this process and speaks the protocol over
 * stdio, so nothing may be written to stdout except protocol traffic —
 * diagnostics go to stderr.
 */
const main = async (): Promise<void> => {
  const config = loadConfig();
  const server = createMcpServer(config);
  const transport = new StdioServerTransport();
  await server.connect(transport);
  process.stderr.write(`real-fake-data MCP server connected (baseUrl: ${config.baseUrl})\n`);
};

try {
  await main();
} catch (error: unknown) {
  process.stderr.write(
    `Failed to start real-fake-data MCP server: ${error instanceof Error ? error.message : String(error)}\n`,
  );
  process.exitCode = 1;
}
