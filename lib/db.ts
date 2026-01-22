import { neon, NeonQueryFunction } from '@neondatabase/serverless';
import { UserData, CardProgress } from './types';

let sql: NeonQueryFunction<false, false> | null = null;

function getDb() {
  if (!sql) {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is not set');
    }
    sql = neon(process.env.DATABASE_URL);
  }
  return sql;
}

export async function initDb() {
  const db = getDb();

  await db`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      pin TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(LOWER(name), pin)
    )
  `;

  await db`
    CREATE TABLE IF NOT EXISTS progress (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      card_id TEXT NOT NULL,
      correct INTEGER DEFAULT 0,
      incorrect INTEGER DEFAULT 0,
      last_seen TIMESTAMP DEFAULT NOW(),
      mastered BOOLEAN DEFAULT FALSE,
      UNIQUE(user_id, card_id)
    )
  `;
}

export async function getUser(name: string, pin: string): Promise<UserData | null> {
  const db = getDb();

  const rows = await db`
    SELECT id, name, created_at FROM users
    WHERE LOWER(name) = LOWER(${name.trim()}) AND pin = ${pin}
  `;

  if (rows.length === 0) return null;

  const user = rows[0];
  const progressRows = await db`
    SELECT card_id, correct, incorrect, last_seen, mastered
    FROM progress WHERE user_id = ${user.id}
  `;

  const progress: Record<string, CardProgress> = {};
  for (const row of progressRows) {
    progress[row.card_id] = {
      correct: row.correct,
      incorrect: row.incorrect,
      lastSeen: row.last_seen?.toISOString() || '',
      mastered: row.mastered,
    };
  }

  return {
    name: user.name,
    createdAt: user.created_at?.toISOString() || '',
    progress,
  };
}

export async function createUser(name: string, pin: string): Promise<UserData> {
  const db = getDb();

  const rows = await db`
    INSERT INTO users (name, pin)
    VALUES (${name.trim()}, ${pin})
    RETURNING id, name, created_at
  `;

  const user = rows[0];
  return {
    name: user.name,
    createdAt: user.created_at?.toISOString() || '',
    progress: {},
  };
}

export async function updateUserProgress(
  name: string,
  pin: string,
  cardId: string,
  correct: boolean
): Promise<UserData | null> {
  const db = getDb();

  // Get user id
  const userRows = await db`
    SELECT id FROM users
    WHERE LOWER(name) = LOWER(${name.trim()}) AND pin = ${pin}
  `;

  if (userRows.length === 0) return null;

  const userId = userRows[0].id;

  // Upsert progress
  await db`
    INSERT INTO progress (user_id, card_id, correct, incorrect, last_seen, mastered)
    VALUES (
      ${userId},
      ${cardId},
      ${correct ? 1 : 0},
      ${correct ? 0 : 1},
      NOW(),
      FALSE
    )
    ON CONFLICT (user_id, card_id) DO UPDATE SET
      correct = progress.correct + ${correct ? 1 : 0},
      incorrect = progress.incorrect + ${correct ? 0 : 1},
      last_seen = NOW(),
      mastered = (progress.correct + ${correct ? 1 : 0}) >= 3
  `;

  return getUser(name, pin);
}

export async function getUserProgress(name: string, pin: string): Promise<UserData | null> {
  return getUser(name, pin);
}
