#!/usr/bin/env node
/**
 * cron MCP server. Two tools: `next` and `validate`.
 *
 * Backed by `cron-parser` for spec-compliant five-field crontab expressions
 * (`m h dom mon dow`). Returns the next N firing times in UTC ISO 8601, or
 * validates a candidate expression.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { CronExpressionParser } from 'cron-parser';

const VERSION = '0.1.0';

export interface NextResult {
  expression: string;
  from: string;
  next: string[];
}

export function nextRuns(expression: string, n = 5, from: Date = new Date()): NextResult {
  if (n < 1 || n > 100) throw new Error('n must be in [1, 100]');
  const iter = CronExpressionParser.parse(expression, { currentDate: from, tz: 'UTC' });
  const next: string[] = [];
  for (let i = 0; i < n; i++) {
    next.push(iter.next().toDate().toISOString());
  }
  return { expression, from: from.toISOString(), next };
}

export function validate(expression: string): { valid: true } | { valid: false; error: string } {
  try {
    CronExpressionParser.parse(expression);
    return { valid: true };
  } catch (e) {
    return { valid: false, error: (e as Error).message };
  }
}

const server = new Server({ name: 'cron', version: VERSION }, { capabilities: { tools: {} } });

const TOOLS = [
  {
    name: 'next',
    description: 'Return the next N firing times for a cron expression, in UTC ISO 8601.',
    inputSchema: {
      type: 'object',
      properties: {
        expression: { type: 'string', description: 'Crontab expression, e.g. "0 9 * * 1-5".' },
        n: { type: 'integer', default: 5, description: 'How many runs to return (1-100).' },
        from: { type: 'string', description: 'Optional ISO 8601 start time. Defaults to now.' },
      },
      required: ['expression'],
    },
  },
  {
    name: 'validate',
    description: 'Check whether a cron expression parses. Returns { valid, error? }.',
    inputSchema: {
      type: 'object',
      properties: { expression: { type: 'string' } },
      required: ['expression'],
    },
  },
] as const;

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));

server.setRequestHandler(CallToolRequestSchema, async (req) => {
  const { name, arguments: args } = req.params;
  try {
    if (name === 'next') {
      const a = args as unknown as { expression: string; n?: number; from?: string };
      const from = a.from ? new Date(a.from) : new Date();
      if (Number.isNaN(from.getTime())) return errorResult(`invalid from: ${a.from}`);
      return jsonResult(nextRuns(a.expression, a.n ?? 5, from));
    }
    if (name === 'validate') {
      const a = args as unknown as { expression: string };
      return jsonResult(validate(a.expression));
    }
    return errorResult('unknown tool: ' + name);
  } catch (err) {
    return errorResult('cron tool failed: ' + (err as Error).message);
  }
});

function jsonResult(value: unknown) {
  return { content: [{ type: 'text', text: JSON.stringify(value, null, 2) }] };
}
function errorResult(message: string) {
  return { isError: true, content: [{ type: 'text', text: message }] };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  process.stderr.write(`cron MCP server v${VERSION} ready on stdio\n`);
}
