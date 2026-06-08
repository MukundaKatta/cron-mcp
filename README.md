# cron-mcp

[![npm](https://img.shields.io/npm/v/@mukundakatta/cron-mcp.svg)](https://www.npmjs.com/package/@mukundakatta/cron-mcp)
[![mcp](https://img.shields.io/badge/protocol-MCP-blue.svg)](https://modelcontextprotocol.io)
[![license](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

MCP server: parse a five-field crontab expression and preview when it will
fire next. Backed by `cron-parser`. All times are UTC.

## Tools

### `next`

```json
{ "expression": "0 9 * * 1-5", "n": 3, "from": "2024-01-01T00:00:00Z" }
```

→

```json
{
  "expression": "0 9 * * 1-5",
  "from": "2024-01-01T00:00:00.000Z",
  "next": [
    "2024-01-01T09:00:00.000Z",
    "2024-01-02T09:00:00.000Z",
    "2024-01-03T09:00:00.000Z"
  ]
}
```

`n` defaults to 5 and must be an integer in `[1, 100]`; out-of-range values are rejected.

### `validate`

```json
{ "expression": "0 0 * * *" }
```

→ `{ "valid": true }` or `{ "valid": false, "error": "..." }`.

## Configure

```json
{ "mcpServers": { "cron": { "command": "npx", "args": ["-y", "@mukundakatta/cron-mcp"] } } }
```

## License

MIT.
