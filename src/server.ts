import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { FitatuClient } from './client.js';

const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'YYYY-MM-DD');

const today = () => new Date().toISOString().slice(0, 10);

const eachDate = (start: string, end: string): string[] => {
  const out: string[] = [];
  const cur = new Date(start + 'T00:00:00Z');
  const last = new Date(end + 'T00:00:00Z');
  while (cur <= last) {
    out.push(cur.toISOString().slice(0, 10));
    cur.setUTCDate(cur.getUTCDate() + 1);
    if (out.length > 60) throw new Error('range too large (max 60 days)');
  }
  return out;
};

const text = (data: unknown) => ({
  content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }],
});

export const buildServer = (fitatu: FitatuClient) => {
  const server = new McpServer({
    name: 'fitatu-mcp',
    version: '0.1.0',
  });

  server.tool(
    'get_meal_plan',
    'Get the full meal plan (jadłospis) for a single day, including each meal slot, items, weights, and full macros.',
    { date: dateSchema.optional().describe('YYYY-MM-DD; defaults to today') },
    async ({ date }) => text(await fitatu.getMealPlan(date ?? today())),
  );

  server.tool(
    'get_meal_plan_range',
    'Get meal plans for a date range (inclusive). Max 60 days.',
    {
      start: dateSchema,
      end: dateSchema,
    },
    async ({ start, end }) => {
      const dates = eachDate(start, end);
      const results = await Promise.all(
        dates.map(async (d) => [d, await fitatu.getMealPlan(d)] as const),
      );
      return text(Object.fromEntries(results));
    },
  );

  server.tool(
    'get_meal_schedule',
    'Get the user’s default meal schema (slots, target meal times, recommended kcal split).',
    {},
    async () => text(await fitatu.getMealSchedule()),
  );

  server.tool(
    'get_water',
    'Get water intake for a single day.',
    { date: dateSchema.optional() },
    async ({ date }) => text(await fitatu.getWater(date ?? today())),
  );

  server.tool(
    'get_user',
    'Get the user profile, roles, and subscription info.',
    {},
    async () => text(await fitatu.getUser()),
  );

  return server;
};
