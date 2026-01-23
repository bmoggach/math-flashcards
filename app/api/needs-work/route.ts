import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getUserById, getUserProgress } from '@/lib/db';
import { flashcards } from '@/data/flashcards';

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const user = await getUserById(session.user.email);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const progress = await getUserProgress(user.id);
    const needsWorkEntries = Object.entries(progress)
      .filter(([, value]) => value.incorrect > 0)
      .map(([cardId, value]) => ({
        cardId,
        lastSeen: value.lastSeen,
      }));

    const needsWorkCards = needsWorkEntries
      .map(entry => ({
        card: flashcards.find(cardItem => cardItem.id === entry.cardId),
        lastSeen: entry.lastSeen,
      }))
      .filter((entry): entry is { card: (typeof flashcards)[number]; lastSeen: string } => !!entry.card)
      .sort((a, b) => b.lastSeen.localeCompare(a.lastSeen))
      .map(entry => entry.card);

    return NextResponse.json({ flashcards: needsWorkCards });
  } catch (error) {
    console.error('Needs work error:', error);
    return NextResponse.json({ error: 'Failed to load needs work cards' }, { status: 500 });
  }
}
