import { readFile, writeFile } from 'node:fs/promises';

export interface Session {
  accessToken: string;
  refreshToken: string;
  exp: number;
}

export interface SessionStore {
  load(): Promise<Session | null>;
  save(s: Session): Promise<void>;
}

export const fileStore = (path: string): SessionStore => ({
  async load() {
    try {
      return JSON.parse(await readFile(path, 'utf8')) as Session;
    } catch (e: unknown) {
      if ((e as NodeJS.ErrnoException).code === 'ENOENT') {
        const rt = process.env.FITATU_REFRESH_TOKEN;
        if (!rt) return null;
        // exp=0 forces a refresh on first call, which seeds the file
        return { accessToken: '', refreshToken: rt, exp: 0 };
      }
      throw e;
    }
  },
  async save(s) {
    await writeFile(path, JSON.stringify(s, null, 2), { mode: 0o600 });
  },
});
