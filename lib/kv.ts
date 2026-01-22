import { kv } from '@vercel/kv';
import { UserData } from './types';

function getUserKey(name: string, pin: string): string {
  return `user:${name.toLowerCase().trim()}:${pin}`;
}

export async function getUser(name: string, pin: string): Promise<UserData | null> {
  const key = getUserKey(name, pin);
  return await kv.get<UserData>(key);
}

export async function createUser(name: string, pin: string): Promise<UserData> {
  const key = getUserKey(name, pin);
  const userData: UserData = {
    name: name.trim(),
    createdAt: new Date().toISOString(),
    progress: {},
  };
  await kv.set(key, userData);
  return userData;
}

export async function updateUserProgress(
  name: string,
  pin: string,
  cardId: string,
  correct: boolean
): Promise<UserData | null> {
  const key = getUserKey(name, pin);
  const user = await kv.get<UserData>(key);

  if (!user) return null;

  const existingProgress = user.progress[cardId] || {
    correct: 0,
    incorrect: 0,
    lastSeen: '',
    mastered: false,
  };

  const newProgress = {
    correct: existingProgress.correct + (correct ? 1 : 0),
    incorrect: existingProgress.incorrect + (correct ? 0 : 1),
    lastSeen: new Date().toISOString(),
    mastered: existingProgress.correct + (correct ? 1 : 0) >= 3,
  };

  user.progress[cardId] = newProgress;
  await kv.set(key, user);

  return user;
}

export async function getUserProgress(name: string, pin: string): Promise<UserData | null> {
  return getUser(name, pin);
}
