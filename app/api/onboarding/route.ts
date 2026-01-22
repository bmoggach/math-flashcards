import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { completeOnboarding } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { childName, childBirthYear, schoolName } = await request.json();

    if (!childName || typeof childName !== 'string' || !childName.trim()) {
      return NextResponse.json({ error: 'Child name is required' }, { status: 400 });
    }

    if (!childBirthYear || typeof childBirthYear !== 'number') {
      return NextResponse.json({ error: 'Birth year is required' }, { status: 400 });
    }

    const user = await completeOnboarding(session.user.email, {
      childName: childName.trim(),
      childBirthYear,
      schoolName: schoolName?.trim(),
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Onboarding error:', error);
    return NextResponse.json({ error: 'Failed to complete onboarding' }, { status: 500 });
  }
}
