import { fileStore } from './store.js';
import { FitatuSession } from './session.js';
import { FitatuClient } from './client.js';

const userId = process.env.FITATU_USER_ID;
if (!userId) throw new Error('FITATU_USER_ID required');
if (!process.env.FITATU_REFRESH_TOKEN) {
  throw new Error('FITATU_REFRESH_TOKEN required for first run');
}

const session = new FitatuSession(
  fileStore(process.env.FITATU_STATE_PATH ?? './.fitatu-session.json'),
);
const fitatu = new FitatuClient(session, userId);

const today = new Date().toISOString().slice(0, 10);
console.log(`fetching meal plan for ${today}…`);
const plan = await fitatu.getMealPlan(today);
const meals = Object.keys((plan as { dietPlan?: object }).dietPlan ?? {});
console.log(`OK. session persisted. meal slots today: ${meals.join(', ') || '(none)'}`);
