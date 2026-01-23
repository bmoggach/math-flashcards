import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getTopicResume, getUserById, getUserProgress, updateProgress, updateTopicResume } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const topicId = searchParams.get('topicId');

    const user = await getUserById(session.user.email);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (topicId) {
      const nextCardId = await getTopicResume(user.id, topicId);
      return NextResponse.json({ nextCardId });
    }

    const progress = await getUserProgress(user.id);

    return NextResponse.json({ progress });
  } catch (error) {
    console.error('Get progress error:', error);
    return NextResponse.json({ error: 'Failed to get progress' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { cardId, correct, topicId, nextCardId } = await request.json();

    if (
      !cardId ||
      typeof correct !== 'boolean' ||
      typeof topicId !== 'string' ||
      (nextCardId !== null && nextCardId !== undefined && typeof nextCardId !== 'string')
    ) {
      return NextResponse.json({ error: 'Invalid request data' }, { status: 400 });
    }

    const user = await getUserById(session.user.email);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    await updateProgress(user.id, cardId, correct, topicId);
    await updateTopicResume(user.id, topicId, nextCardId ?? null);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update progress error:', error);
    return NextResponse.json({ error: 'Failed to update progress' }, { status: 500 });
  }
}
