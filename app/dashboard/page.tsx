'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import TopicCard from '@/components/TopicCard';
import { TOPICS, UserData, Flashcard } from '@/lib/types';

interface TopicProgress {
  total: number;
  mastered: number;
  attempted: number;
}

export default function DashboardPage() {
  const [userName, setUserName] = useState<string>('');
  const [userData, setUserData] = useState<UserData | null>(null);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const name = sessionStorage.getItem('userName');
    const pin = sessionStorage.getItem('userPin');

    if (!name || !pin) {
      router.push('/');
      return;
    }

    setUserName(name);

    // Fetch user data and flashcards
    Promise.all([
      fetch(`/api/progress?name=${encodeURIComponent(name)}&pin=${pin}`).then(r => r.json()),
      fetch('/api/flashcards').then(r => r.json()),
    ]).then(([userRes, cardsRes]) => {
      if (userRes.user) {
        setUserData(userRes.user);
      }
      if (cardsRes.flashcards) {
        setFlashcards(cardsRes.flashcards);
      }
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });
  }, [router]);

  const getTopicProgress = (topicId: string): TopicProgress => {
    const topicCards = flashcards.filter(c => c.topic === topicId);
    const progress = userData?.progress || {};

    let mastered = 0;
    let attempted = 0;

    topicCards.forEach(card => {
      const cardProgress = progress[card.id];
      if (cardProgress) {
        attempted++;
        if (cardProgress.mastered) mastered++;
      }
    });

    return {
      total: topicCards.length,
      mastered,
      attempted,
    };
  };

  const handleLogout = () => {
    sessionStorage.removeItem('userName');
    sessionStorage.removeItem('userPin');
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl text-gray-600">Loading...</div>
      </div>
    );
  }

  const totalCards = flashcards.length;
  const totalMastered = Object.values(userData?.progress || {}).filter(p => p.mastered).length;
  const overallPercent = totalCards > 0 ? Math.round((totalMastered / totalCards) * 100) : 0;

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              Welcome back, {userName}!
            </h1>
            <p className="text-gray-500 mt-1">Choose a topic to practice</p>
          </div>
          <button
            onClick={handleLogout}
            className="text-gray-500 hover:text-gray-700 text-sm self-start md:self-auto"
          >
            Log out
          </button>
        </div>

        {/* Overall Progress */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Overall Progress</h2>
            <span className="text-2xl font-bold text-indigo-600">{overallPercent}%</span>
          </div>
          <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
              style={{ width: `${overallPercent}%` }}
            />
          </div>
          <p className="text-sm text-gray-500 mt-2">
            {totalMastered} of {totalCards} flashcards mastered
          </p>
        </div>

        {/* Topic Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {TOPICS.map(topic => (
            <TopicCard
              key={topic.id}
              topic={topic}
              progress={getTopicProgress(topic.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
