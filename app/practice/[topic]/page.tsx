'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Flashcard from '@/components/Flashcard';
import ProgressBar from '@/components/ProgressBar';
import BuyMeCoffee from '@/components/BuyMeCoffee';
import { Flashcard as FlashcardType, TOPICS } from '@/lib/types';

interface FlashcardsResponse {
  flashcards?: FlashcardType[];
}

interface ProgressResumeResponse {
  nextCardId?: string | null;
}

export default function PracticePage() {
  const params = useParams();
  const topicId = params.topic as string;
  const isNeedsWorkSession = topicId === 'needs-work';
  const [cards, setCards] = useState<FlashcardType[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sessionCorrect, setSessionCorrect] = useState(0);
  const [sessionTotal, setSessionTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [completed, setCompleted] = useState(false);

  const topic = isNeedsWorkSession
    ? {
        id: 'needs-work',
        name: 'Needs Work',
        description: 'Review the cards that need more practice',
        icon: '🧠',
        color: 'bg-amber-500',
      }
    : TOPICS.find(t => t.id === topicId);

  useEffect(() => {
    let isActive = true;
    setLoading(true);

    const loadData = async () => {
      try {
        const [cardsResponse, progressResponse] = await Promise.all([
          isNeedsWorkSession
            ? fetch('/api/needs-work')
            : fetch(`/api/flashcards?topic=${topicId}`),
          isNeedsWorkSession
            ? Promise.resolve(null)
            : fetch(`/api/progress?topicId=${topicId}`),
        ]);

        const cardsData = (await cardsResponse.json()) as FlashcardsResponse;
        const progressData = progressResponse
          ? ((await progressResponse.json()) as ProgressResumeResponse)
          : { nextCardId: null };

        if (!isActive) return;

        if (cardsData.flashcards) {
          const shuffled = [...cardsData.flashcards].sort(() => Math.random() - 0.5);
          setCards(shuffled);

          const resumeCardId = isNeedsWorkSession ? null : progressData.nextCardId ?? null;
          if (resumeCardId) {
            const resumeIndex = shuffled.findIndex(card => card.id === resumeCardId);
            setCurrentIndex(resumeIndex >= 0 ? resumeIndex : 0);
          } else {
            setCurrentIndex(0);
          }
        } else {
          setCards([]);
          setCurrentIndex(0);
        }
      } catch {
        if (isActive) {
          setCards([]);
          setCurrentIndex(0);
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isActive = false;
    };
  }, [topicId, isNeedsWorkSession]);

  const advanceCard = () => {
    if (currentIndex < cards.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setCompleted(true);
    }
  };

  const handleAnswer = async (correct: boolean) => {
    const currentCard = cards[currentIndex];
    const nextCardId = currentIndex < cards.length - 1 ? cards[currentIndex + 1]?.id : null;

    setSessionTotal(prev => prev + 1);
    if (correct) {
      setSessionCorrect(prev => prev + 1);
    }

    // Save progress
    if (currentCard) {
      try {
        await fetch('/api/progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            cardId: currentCard.id,
            correct,
            topicId: currentCard.topic,
            nextCardId,
          }),
        });
      } catch (err) {
        console.error('Failed to save progress:', err);
      }
    }

    advanceCard();
  };

  const handlePrevious = () => {
    setCurrentIndex(prev => Math.max(prev - 1, 0));
  };

  const handleSkip = () => {
    void handleAnswer(false);
  };

  const handleRestart = () => {
    // Reshuffle and restart
    const shuffled = [...cards].sort(() => Math.random() - 0.5);
    setCards(shuffled);
    setCurrentIndex(0);
    setSessionCorrect(0);
    setSessionTotal(0);
    setCompleted(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!topic) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl text-gray-600 mb-4">Topic not found</div>
          <Link href="/dashboard" className="text-indigo-600 hover:underline">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl text-gray-600 mb-4">
            {isNeedsWorkSession
              ? 'No needs work cards yet'
              : 'No flashcards available for this topic'}
          </div>
          <Link href="/dashboard" className="text-indigo-600 hover:underline">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // Completed screen
  if (completed) {
    const percentage = Math.round((sessionCorrect / sessionTotal) * 100);

    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">
            {percentage >= 80 ? '🎉' : percentage >= 50 ? '👍' : '💪'}
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Practice Complete!</h2>
          <p className="text-gray-500 mb-6">{topic.name}</p>

          <div className="bg-gray-50 rounded-2xl p-6 mb-6">
            <div className="text-4xl font-bold text-indigo-600 mb-2">{percentage}%</div>
            <div className="text-gray-600">
              {sessionCorrect} out of {sessionTotal} correct
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleRestart}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
            >
              Practice Again
            </button>
            <Link
              href="/dashboard"
              className="block w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-6 rounded-xl transition-colors"
            >
              Back to Topics
            </Link>
          </div>

          {/* Buy Me a Coffee on results page */}
          <div className="mt-8">
            <BuyMeCoffee />
          </div>
        </div>
      </div>
    );
  }

  const currentCard = cards[currentIndex];

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/dashboard"
            className="text-gray-500 hover:text-gray-700 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </Link>
          <div className={`${topic.color} text-white px-4 py-1 rounded-full text-sm font-medium`}>
            {topic.icon} {topic.name}
          </div>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <ProgressBar
            current={currentIndex + 1}
            total={cards.length}
            correct={sessionCorrect}
          />
        </div>

        {/* Flashcard */}
        <Flashcard key={currentCard.id} card={currentCard} onAnswer={handleAnswer} />

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={handlePrevious}
            disabled={currentIndex === 0}
            className="px-4 py-2 rounded-xl border border-gray-200 text-gray-600 hover:text-gray-800 hover:border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <button
            onClick={handleSkip}
            className="px-4 py-2 rounded-xl bg-amber-100 text-amber-700 hover:bg-amber-200 font-semibold"
          >
            Skip (Needs Work)
          </button>
        </div>

        {/* Subtopic indicator */}
        <div className="mt-6 text-center text-sm text-gray-400">
          {currentCard.subtopic.replace(/-/g, ' ')}
        </div>
      </div>
    </div>
  );
}
