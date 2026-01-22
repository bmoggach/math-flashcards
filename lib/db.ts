import { neon, NeonQueryFunction } from '@neondatabase/serverless';
import { CardProgress } from './types';

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

export async function getOrCreateUser(data: {
  email: string;
  name: string;
  googleId: string;
}): Promise<DbUser> {
  const db = getDb();
  await initDb();

  // Try to get existing user
  const existing = await db`
    SELECT id, email, name, google_id, child_name, child_birth_year, school_name, onboarded, created_at
    FROM users WHERE email = ${data.email}
  `;

  if (existing.length > 0) {
    const row = existing[0];
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

  // Create new user
  const rows = await db`
    INSERT INTO users (email, name, google_id)
    VALUES (${data.email}, ${data.name}, ${data.googleId})
    RETURNING id, email, name, google_id, child_name, child_birth_year, school_name, onboarded, created_at
  `;

  const row = rows[0];
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

export async function getUserById(email: string): Promise<DbUser | null> {
  const db = getDb();

  const rows = await db`
    SELECT id, email, name, google_id, child_name, child_birth_year, school_name, onboarded, created_at
    FROM users WHERE email = ${email}
  `;

  if (rows.length === 0) return null;

  const row = rows[0];
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

export async function completeOnboarding(
  email: string,
  data: {
    childName: string;
    childBirthYear: number;
    schoolName?: string;
  }
): Promise<DbUser | null> {
  const db = getDb();

  const rows = await db`
    UPDATE users
    SET child_name = ${data.childName},
        child_birth_year = ${data.childBirthYear},
        school_name = ${data.schoolName || null},
        onboarded = TRUE,
        updated_at = NOW()
    WHERE email = ${email}
    RETURNING id, email, name, google_id, child_name, child_birth_year, school_name, onboarded, created_at
  `;

  if (rows.length === 0) return null;

  const row = rows[0];
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

export async function getUserProgress(userId: number): Promise<Record<string, CardProgress>> {
  const db = getDb();

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

export async function updateProgress(
  userId: number,
  cardId: string,
  correct: boolean
): Promise<void> {
  const db = getDb();

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
}
