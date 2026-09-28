import type { Session, SessionStore } from './store.js';

const API = 'https://pl-pl.fitatu.com/api';
const CLIENT_HEADERS = {
  'API-Key': 'FITATU-MOBILE-APP',
  'API-Secret': 'PYRXtfs88UDJMuCCrNpLV',
} as const;

const decodeExp = (jwt: string): number => {
  const payload = jwt.split('.')[1];
  const padded = payload.replace(/-/g, '+').replace(/_/g, '/');
  return JSON.parse(Buffer.from(padded, 'base64').toString()).exp as number;
};

export class FitatuSession {
  private inflight: Promise<string> | null = null;
  private cached: Session | null = null;

  constructor(private store: SessionStore, private skewSec = 60) {}

  async accessToken(): Promise<string> {
    if (!this.cached) this.cached = await this.store.load();
    if (!this.cached) {
      throw new Error(
        'No session. Set FITATU_REFRESH_TOKEN once, then start the server.',
      );
    }
    const now = Math.floor(Date.now() / 1000);
    if (this.cached.accessToken && this.cached.exp - this.skewSec > now) {
      return this.cached.accessToken;
    }
    return this.refresh();
  }

  private refresh(): Promise<string> {
    if (this.inflight) return this.inflight;
    this.inflight = (async () => {
      try {
        const r = await fetch(`${API}/token/refresh`, {
          method: 'POST',
          headers: {
            ...CLIENT_HEADERS,
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refresh_token: this.cached!.refreshToken }),
        });
        if (!r.ok) {
          throw new Error(`refresh failed ${r.status}: ${await r.text()}`);
        }
        const { token, refresh_token } = (await r.json()) as {
          token: string;
          refresh_token: string;
        };
        this.cached = {
          accessToken: token,
          refreshToken: refresh_token,
          exp: decodeExp(token),
        };
        await this.store.save(this.cached);
        return token;
      } finally {
        this.inflight = null;
      }
    })();
    return this.inflight;
  }

  async request(
    path: string,
    init: RequestInit = {},
    retried = false,
  ): Promise<Response> {
    const token = await this.accessToken();
    const r = await fetch(`${API}${path}`, {
      ...init,
      headers: {
        ...CLIENT_HEADERS,
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
        ...((init.headers as Record<string, string>) ?? {}),
      },
    });
    if (r.status === 401 && !retried && this.cached) {
      this.cached = { ...this.cached, exp: 0 };
      return this.request(path, init, true);
    }
    return r;
  }
}
