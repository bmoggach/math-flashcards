import { NextRequest, NextResponse } from 'next/server';
import { getUser, createUser, initDb } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { name, pin } = await request.json();

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    if (!pin || !/^\d{4}$/.test(pin)) {
      return NextResponse.json({ error: 'PIN must be 4 digits' }, { status: 400 });
    }

    // Ensure tables exist
    await initDb();

    // Try to get existing user
    let user = await getUser(name, pin);

    if (!user) {
      // Create new user if doesn't exist
      user = await createUser(name, pin);
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
  }
}
