# @przeslijmi/real-fake-data-mcp

A [Model Context Protocol](https://modelcontextprotocol.io) server for [Real Fake Data](https://realfakedata-api.onrender.com/docs) — gives an AI assistant (Claude Desktop, Claude Code, Cursor, …) realistic, synthetic test data on demand: valid PESELs (correct checksums), NIPs, REGONs, IBANs, addresses drawn from real cities and streets, people, and company names across 27 EU countries.

Output _looks_ real but is fake — safe for staging, demos, and seed data.

- **Two tools, self-updating.** `list_generators` for discovery, `generate` to run any generator by id. New generators on the API appear automatically — no client upgrade.
- **Thin and stateless.** Calls the hosted Real Fake Data API over HTTPS; no data is generated or stored locally.
- **Seeded when you want it.** Pass a `seed` for reproducible output, or omit it to randomise each call.

## Install

No global install needed — point your MCP client at the package via `npx`. It runs over **stdio**, so the client spawns it as a subprocess.

### Claude Desktop / Claude Code

Add it to your MCP servers config (`claude_desktop_config.json`, or via `claude mcp add`):

```json
{
  "mcpServers": {
    "real-fake-data": {
      "command": "npx",
      "args": ["-y", "@przeslijmi/real-fake-data-mcp"],
      "env": {
        "REAL_FAKE_DATA_API_KEY": "your-api-key"
      }
    }
  }
}
```

Restart the client; the `real-fake-data` tools become available in any conversation.

Requires Node 22+.

## Configuration

The client passes configuration through the server's `env`:

| Variable                      | Required | Description                                                                                                   |
| ----------------------------- | -------- | ------------------------------------------------------------------------------------------------------------- |
| `REAL_FAKE_DATA_API_KEY`      | No       | API key sent as `Authorization: Bearer <key>`, lifting requests onto your metered plan. Omit to use the anonymous lane. |
| `REAL_FAKE_DATA_API_BASE_URL` | No       | Override the hosted API. Defaults to `https://realfakedata-api.onrender.com`; point it at a local API during development. |

## Tools

### `list_generators`

Lists every available generator with its `id`, `description`, and `supportedLocales`. Call it first to discover which ids `generate` accepts.

> **You:** What fake-data generators are available?
>
> **Claude** _(calls `list_generators`)_ → `pl.pesel`, `pl.company`, `pl.address`, `any.email`, `de.company-name`, …

### `generate`

Runs one generator and returns the API's `{ data, meta }` envelope.

| Argument    | Type                                       | Description                                                                          |
| ----------- | ------------------------------------------ | ------------------------------------------------------------------------------------ |
| `generator` | `string` (required)                        | Generator id from `list_generators`, e.g. `pl.pesel` or `any.email`.                 |
| `options`   | `Record<string, string \| number \| boolean>` | Generator-specific query parameters; omit for defaults.                          |
| `count`     | `number`                                   | Number of records to generate; omit for a single record. (Upper bound enforced by your plan.) |
| `seed`      | `number`                                   | Seed for reproducible output; omit to randomise each call.                           |

> **You:** Generate 3 female Polish people for my staging DB.
>
> **Claude** _(calls `generate` with `{ generator: "pl.person", count: 3, options: { sex: "f" } }`)_ → three records of `{ name, surname, initials, birthDate, pesel }`.

`options` are the same query parameters the generator exposes on the REST API — `list_generators` describes each, and the [API docs](https://realfakedata-api.onrender.com/docs) list them in full. Examples: `{ "format": "digits-only" }` for a NIP, `{ "teryt": "14" }` to anchor an address to a region, `{ "invalid": true }` to get a deliberately-wrong checksum for testing your validators.

## How it relates to the REST API

This server is a thin MCP front end over the same hosted endpoints the [Playwright addon](https://www.npmjs.com/package/@przeslijmi/real-fake-data-playwright) and [REST API](https://realfakedata-api.onrender.com/docs) serve. A generator id maps directly to a route — `pl.pesel` → `GET /v1/pl/pesel`, `any.email` → `GET /v1/email` — and metering, plan limits, and validation all behave identically. Use this package when you want an **AI assistant** to produce test data conversationally; use the Playwright addon or the REST API directly from code.

## License

MIT

---

> **This repository is auto-generated** from a private upstream monorepo. Open
> **issues** here, but code changes are made upstream and re-synced — pull
> requests against this repo are applied upstream, not merged directly.
