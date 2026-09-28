import type { FitatuSession } from './session.js';

export class FitatuClient {
  constructor(private session: FitatuSession, private userId: string) {}

  private async getJson<T = unknown>(path: string): Promise<T> {
    const r = await this.session.request(path);
    const body = await r.text();
    if (!r.ok) {
      throw new Error(`fitatu ${r.status} ${path}: ${body.slice(0, 300)}`);
    }
    return JSON.parse(body) as T;
  }

  getMealPlan(date: string) {
    return this.getJson(`/diet-and-activity-plan/${this.userId}/day/${date}`);
  }

  getMealSchedule() {
    return this.getJson(
      `/diet-plan/${this.userId}/settings/preferences/meal-schema/default`,
    );
  }

  getWater(date: string) {
    return this.getJson(`/water/${this.userId}/${date}`);
  }

  getUser() {
    return this.getJson(`/users/${this.userId}`);
  }
}
