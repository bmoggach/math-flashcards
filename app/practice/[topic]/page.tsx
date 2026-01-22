'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Flashcard from '@/components/Flashcard';
import ProgressBar from '@/components/ProgressBar';
import BuyMeCoffee from '@/components/BuyMeCoffee';
import { Flashcard as FlashcardType, TOPICS } from '@/lib/types';

export default function PracticePage() {
  const params = useParams();
  const topicId = params.topic as string;
  const router = useRouter();

  const [cards, setCards] = useState<FlashcardType[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sessionCorrect, setSessionCorrect] = useState(0);
  const [sessionTotal, setSessionTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [completed, setCompleted] = useState(false);

  const topic = TOPICS.find(t => t.id === topicId);

  useEffect(() => {
    // Fetch flashcards for this topic
    fetch(`/api/flashcards?topic=${topicId}`)
      .then(r => r.json())
      .then(data => {
        if (data.flashcards) {
          // Shuffle the cards
          const shuffled = [...data.flashcards].sort(() => Math.random() - 0.5);
          setCards(shuffled);
        }
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [topicId]);

  const handleAnswer = async (correct: boolean) => {
    const currentCard = cards[currentIndex];

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
          }),
        });
      } catch (err) {
        console.error('Failed to save progress:', err);
      }
    }

    // Move to next card or complete
    if (currentIndex < cards.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setCompleted(true);
    }
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
          <div className="text-2xl text-gray-600 mb-4">No flashcards available for this topic</div>
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
        <Flashcard card={currentCard} onAnswer={handleAnswer} />

        {/* Subtopic indicator */}
        <div className="mt-6 text-center text-sm text-gray-400">
          {currentCard.subtopic.replace(/-/g, ' ')}
        </div>
      </div>
    </div>
  );
}
