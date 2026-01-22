import { NextRequest, NextResponse } from 'next/server';
import { flashcards } from '@/data/flashcards';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const topic = searchParams.get('topic');

  if (topic) {
    const filteredCards = flashcards.filter(card => card.topic === topic);
    return NextResponse.json({ flashcards: filteredCards });
  }

  return NextResponse.json({ flashcards });
}
