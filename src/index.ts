import express from 'express';
import { randomUUID, timingSafeEqual } from 'node:crypto';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js';
import { fileStore } from './store.js';
import { FitatuSession } from './session.js';
import { FitatuClient } from './client.js';
import { buildServer } from './server.js';

const required = (k: string): string => {
  const v = process.env[k];
  if (!v) throw new Error(`missing env: ${k}`);
  return v;
};

const userId = required('FITATU_USER_ID');
const bearer = required('MCP_BEARER_TOKEN');
const statePath = process.env.FITATU_STATE_PATH ?? './.fitatu-session.json';
const port = Number(process.env.PORT ?? 3333);

const session = new FitatuSession(fileStore(statePath));
const fitatu = new FitatuClient(session, userId);

const checkAuth = (header: string | undefined): boolean => {
  if (!header?.startsWith('Bearer ')) return false;
  const got = Buffer.from(header.slice(7));
  const want = Buffer.from(bearer);
  return got.length === want.length && timingSafeEqual(got, want);
};

const app = express();
app.use(express.json({ limit: '4mb' }));

app.get('/healthz', (_req, res) => res.json({ ok: true }));

const transports = new Map<string, StreamableHTTPServerTransport>();

app.post('/mcp', async (req, res) => {
  if (!checkAuth(req.header('authorization'))) {
    res.status(401).json({ error: 'unauthorized' });
    return;
  }

  const sessionId = req.header('mcp-session-id');
  let transport = sessionId ? transports.get(sessionId) : undefined;

  if (!transport) {
    if (sessionId || !isInitializeRequest(req.body)) {
      res.status(400).json({ error: 'bad session' });
      return;
    }
    transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => randomUUID(),
      onsessioninitialized: (id) => {
        transports.set(id, transport!);
      },
    });
    transport.onclose = () => {
      if (transport!.sessionId) transports.delete(transport!.sessionId);
    };
    await buildServer(fitatu).connect(transport);
  }

  await transport.handleRequest(req, res, req.body);
});

const sessionRoute = async (req: express.Request, res: express.Response) => {
  if (!checkAuth(req.header('authorization'))) {
    res.status(401).json({ error: 'unauthorized' });
    return;
  }
  const sid = req.header('mcp-session-id');
  const transport = sid ? transports.get(sid) : undefined;
  if (!transport) {
    res.status(400).json({ error: 'unknown session' });
    return;
  }
  await transport.handleRequest(req, res);
};

app.get('/mcp', sessionRoute);
app.delete('/mcp', sessionRoute);

app.listen(port, () => {
  console.log(`fitatu-mcp listening on :${port}`);
});
