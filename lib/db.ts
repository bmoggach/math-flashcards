import { neon, NeonQueryFunction } from '@neondatabase/serverless';
import { CardProgress } from './types';

let sql: NeonQueryFunction<false, false> | null = null;
let dbInitialized = false;

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
  if (dbInitialized) {
    return;
  }
  const db = getDb();

  // New users table for Google auth
  await db`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      name TEXT,
      google_id TEXT,
      child_name TEXT,
      child_birth_year INTEGER,
      school_name TEXT,
      onboarded BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
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

  await db`
    CREATE TABLE IF NOT EXISTS card_attempts (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      card_id TEXT NOT NULL,
      topic_id TEXT NOT NULL,
      correct BOOLEAN NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;

  await db`
    CREATE TABLE IF NOT EXISTS topic_progress (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      topic_id TEXT NOT NULL,
      next_card_id TEXT,
      updated_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(user_id, topic_id)
    )
  `;

  dbInitialized = true;
}

export interface DbUser {
  id: number;
  email: string;
  name: string | null;
  googleId: string | null;
  childName: string | null;
  childBirthYear: number | null;
  schoolName: string | null;
  onboarded: boolean;
  createdAt: Date;
}

type DbUserRow = {
  id: number;
  email: string;
  name: string | null;
  google_id: string | null;
  child_name: string | null;
  child_birth_year: number | null;
  school_name: string | null;
  onboarded: boolean;
  created_at: Date;
};

function mapUserRow(row: DbUserRow): DbUser {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    googleId: row.google_id,
    childName: row.child_name,
    childBirthYear: row.child_birth_year,
    schoolName: row.school_name,
    onboarded: row.onboarded,
    createdAt: row.created_at,
  };
}

export async function getOrCreateUser(data: {
  email: string;
  name: string;
  googleId: string;
}): Promise<DbUser> {
  const db = getDb();
  await initDb();

  // Try to get existing user
  const existing = (await db`
    SELECT id, email, name, google_id, child_name, child_birth_year, school_name, onboarded, created_at
    FROM users WHERE email = ${data.email}
  `) as DbUserRow[];

  if (existing.length > 0) {
    return mapUserRow(existing[0]);
  }

  // Create new user
  const rows = (await db`
    INSERT INTO users (email, name, google_id)
    VALUES (${data.email}, ${data.name}, ${data.googleId})
    RETURNING id, email, name, google_id, child_name, child_birth_year, school_name, onboarded, created_at
  `) as DbUserRow[];

  return mapUserRow(rows[0]);
}

export async function getUserById(email: string): Promise<DbUser | null> {
  const db = getDb();
  await initDb();

  const rows = (await db`
    SELECT id, email, name, google_id, child_name, child_birth_year, school_name, onboarded, created_at
    FROM users WHERE email = ${email}
  `) as DbUserRow[];

  if (rows.length === 0) return null;

  return mapUserRow(rows[0]);
}

export async function completeOnboarding(
  email: string,
  data: {
    childName: string;
    childBirthYear: number;
    schoolName?: string;
  }
): Promise<DbUser | null> {
  const db = getDb();
  await initDb();

  const rows = (await db`
    UPDATE users
    SET child_name = ${data.childName},
        child_birth_year = ${data.childBirthYear},
        school_name = ${data.schoolName || null},
        onboarded = TRUE,
        updated_at = NOW()
    WHERE email = ${email}
    RETURNING id, email, name, google_id, child_name, child_birth_year, school_name, onboarded, created_at
  `) as DbUserRow[];

  if (rows.length === 0) return null;

  return mapUserRow(rows[0]);
}

export async function getUserProgress(userId: number): Promise<Record<string, CardProgress>> {
  const db = getDb();
  await initDb();

  const progressRows = await db`
    SELECT card_id, correct, incorrect, last_seen, mastered
    FROM progress WHERE user_id = ${userId}
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

  return progress;
}

export async function getUserAttemptTotals(userId: number): Promise<{ attempts: number; correct: number }> {
  const db = getDb();
  await initDb();

  const rows = await db`
    SELECT COUNT(*)::int AS attempts,
           COALESCE(SUM(CASE WHEN correct THEN 1 ELSE 0 END), 0)::int AS correct
    FROM card_attempts
    WHERE user_id = ${userId}
  `;

  const row = rows[0];
  return {
    attempts: row?.attempts ?? 0,
    correct: row?.correct ?? 0,
  };
}

export async function getUserAttemptsToday(userId: number): Promise<number> {
  const db = getDb();
  await initDb();

  const rows = await db`
    SELECT COUNT(*)::int AS attempts
    FROM card_attempts
    WHERE user_id = ${userId}
      AND created_at >= CURRENT_DATE
      AND created_at < CURRENT_DATE + INTERVAL '1 day'
  `;

  return rows[0]?.attempts ?? 0;
}

export async function getUserPracticeDates(userId: number, limit = 30): Promise<string[]> {
  const db = getDb();
  await initDb();

  const rows = await db`
    SELECT DISTINCT DATE(created_at) AS day
    FROM card_attempts
    WHERE user_id = ${userId}
    ORDER BY day DESC
    LIMIT ${limit}
  `;

  return rows.map(row => {
    const day = row.day instanceof Date ? row.day : new Date(row.day);
    return day.toISOString().slice(0, 10);
  });
}

export async function updateProgress(
  userId: number,
  cardId: string,
  correct: boolean,
  topicId: string
): Promise<void> {
  const db = getDb();
  await initDb();

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

  await db`
    INSERT INTO card_attempts (user_id, card_id, topic_id, correct, created_at)
    VALUES (${userId}, ${cardId}, ${topicId}, ${correct}, NOW())
  `;
}

export async function updateTopicResume(
  userId: number,
  topicId: string,
  nextCardId: string | null
): Promise<void> {
  const db = getDb();
  await initDb();

  await db`
    INSERT INTO topic_progress (user_id, topic_id, next_card_id, updated_at)
    VALUES (${userId}, ${topicId}, ${nextCardId}, NOW())
    ON CONFLICT (user_id, topic_id) DO UPDATE SET
      next_card_id = ${nextCardId},
      updated_at = NOW()
  `;
}

export async function getTopicResume(
  userId: number,
  topicId: string
): Promise<string | null> {
  const db = getDb();
  await initDb();

  const rows = await db`
    SELECT next_card_id
    FROM topic_progress
    WHERE user_id = ${userId} AND topic_id = ${topicId}
  `;

  if (rows.length === 0) return null;

  return rows[0].next_card_id || null;
}

export interface CardAttemptSummary {
  topicId: string;
  attempts: number;
  correct: number;
  uniqueCards: number;
  lastAttempt: string | null;
}

export interface CardAttempt {
  cardId: string;
  topicId: string;
  correct: boolean;
  createdAt: string;
}

export interface AdminUserSummary {
  id: number;
  email: string;
  name: string | null;
  childName: string | null;
  onboarded: boolean;
  createdAt: Date;
  totalAttempts: number;
  correctAttempts: number;
  lastAttemptAt: string | null;
}

type AdminUserSummaryRow = {
  id: number;
  email: string;
  name: string | null;
  child_name: string | null;
  onboarded: boolean;
  created_at: Date;
  total_attempts: number | null;
  correct_attempts: number | null;
  last_attempt: Date | null;
};

export async function getUserAttemptStats(userId: number): Promise<CardAttemptSummary[]> {
  const db = getDb();
  await initDb();

  const rows = await db`
    SELECT topic_id,
           COUNT(*)::int AS attempts,
           SUM(CASE WHEN correct THEN 1 ELSE 0 END)::int AS correct,
           COUNT(DISTINCT card_id)::int AS unique_cards,
           MAX(created_at) AS last_attempt
    FROM card_attempts
    WHERE user_id = ${userId}
    GROUP BY topic_id
  `;

  return rows.map(row => ({
    topicId: row.topic_id,
    attempts: row.attempts,
    correct: row.correct,
    uniqueCards: row.unique_cards,
    lastAttempt: row.last_attempt?.toISOString() || null,
  }));
}

export async function getUserRecentAttempts(
  userId: number,
  limit = 10
): Promise<CardAttempt[]> {
  const db = getDb();
  await initDb();

  const rows = await db`
    SELECT card_id, topic_id, correct, created_at
    FROM card_attempts
    WHERE user_id = ${userId}
    ORDER BY created_at DESC
    LIMIT ${limit}
  `;

  return rows.map(row => ({
    cardId: row.card_id,
    topicId: row.topic_id,
    correct: row.correct,
    createdAt: row.created_at?.toISOString() || '',
  }));
}

export async function getAdminUserSummaries(): Promise<AdminUserSummary[]> {
  const db = getDb();
  await initDb();

  const rows = (await db`
    SELECT
      users.id,
      users.email,
      users.name,
      users.child_name,
      users.onboarded,
      users.created_at,
      COALESCE(stats.total_attempts, 0)::int AS total_attempts,
      COALESCE(stats.correct_attempts, 0)::int AS correct_attempts,
      stats.last_attempt
    FROM users
    LEFT JOIN (
      SELECT
        user_id,
        COUNT(*)::int AS total_attempts,
        SUM(CASE WHEN correct THEN 1 ELSE 0 END)::int AS correct_attempts,
        MAX(created_at) AS last_attempt
      FROM card_attempts
      GROUP BY user_id
    ) AS stats
      ON stats.user_id = users.id
    ORDER BY users.created_at DESC
  `) as AdminUserSummaryRow[];

  return rows.map(row => ({
    id: row.id,
    email: row.email,
    name: row.name,
    childName: row.child_name,
    onboarded: row.onboarded,
    createdAt: row.created_at,
    totalAttempts: row.total_attempts ?? 0,
    correctAttempts: row.correct_attempts ?? 0,
    lastAttemptAt: row.last_attempt ? row.last_attempt.toISOString() : null,
  }));
}
