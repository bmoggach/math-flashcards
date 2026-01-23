import { auth, signOut } from '@/auth';
import { redirect } from 'next/navigation';
import {
  getUserAttemptsToday,
  getUserAttemptTotals,
  getUserById,
  getUserPracticeDates,
  getUserProgress,
} from '@/lib/db';
import { TOPICS } from '@/lib/types';
import { flashcards } from '@/data/flashcards';
import Link from 'next/link';
import TopicCard from '@/components/TopicCard';
import BuyMeCoffee from '@/components/BuyMeCoffee';
import ExtraPracticeModule from '@/components/ExtraPracticeModule';
import FunLearningHub from '@/components/FunLearningHub';

const DAILY_GOAL_TARGET = 10;

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user?.email) {
    redirect('/');
  }

  const user = await getUserById(session.user.email);

  if (!user) {
    redirect('/');
  }

  if (!user.onboarded) {
    redirect('/onboarding');
  }

  const [progress, attemptsToday, attemptTotals, practiceDates] = await Promise.all([
    getUserProgress(user.id),
    getUserAttemptsToday(user.id),
    getUserAttemptTotals(user.id),
    getUserPracticeDates(user.id, 30),
  ]);

  const getTopicProgress = (topicId: string) => {
    const topicCards = flashcards.filter(c => c.topic === topicId);
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

  const totalCards = flashcards.length;
  const totalMastered = Object.values(progress).filter(p => p.mastered).length;
  const overallPercent = totalCards > 0 ? Math.round((totalMastered / totalCards) * 100) : 0;
  const needsWorkCount = Object.values(progress).filter(p => p.incorrect > 0).length;
  const accuracy = attemptTotals.attempts > 0
    ? Math.round((attemptTotals.correct / attemptTotals.attempts) * 100)
    : 0;

  const practiceDateSet = new Set(practiceDates);
  const today = new Date();
  let streakDays = 0;
  for (let offset = 0; offset < 365; offset++) {
    const date = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - offset));
    const dateKey = date.toISOString().slice(0, 10);
    if (practiceDateSet.has(dateKey)) {
      streakDays += 1;
    } else {
      break;
    }
  }

  const achievements = [
    {
      title: 'Warm-up Wizard',
      description: 'Answer 10 questions',
      unlocked: attemptTotals.attempts >= 10,
    },
    {
      title: 'Accuracy Ace',
      description: 'Reach 80% accuracy',
      unlocked: attemptTotals.attempts >= 20 && accuracy >= 80,
    },
    {
      title: 'Unit Hero',
      description: 'Master 15 cards',
      unlocked: totalMastered >= 15,
    },
  ];

  const featuredTopic = TOPICS[0];
  const miniGames = [
    {
      name: 'Lightning Round',
      description: '10 quick questions from needs work.',
      href: '/practice/needs-work?mode=lightning',
      icon: '⚡',
    },
    {
      name: 'Unit Sprint',
      description: `15 fast cards from ${featuredTopic.name}.`,
      href: `/practice/${featuredTopic.id}?mode=sprint`,
      icon: '🏁',
    },
  ];

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              Welcome back, {user.childName}!
            </h1>
            <p className="text-gray-500 mt-1">Choose a topic to practice</p>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/parent"
              className="text-sm font-semibold text-indigo-600 hover:text-indigo-700"
            >
              Parent Dashboard
            </Link>
            <form
              action={async () => {
                'use server';
                await signOut();
              }}
            >
              <button
                type="submit"
                className="text-gray-500 hover:text-gray-700 text-sm"
              >
                Log out
              </button>
            </form>
          </div>
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

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,2fr)] gap-6 mb-10">
          <ExtraPracticeModule needsWorkCount={needsWorkCount} />
          <div className="bg-white rounded-2xl shadow-sm p-6 flex flex-col justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">Keep Going</p>
              <h2 className="text-2xl font-bold text-gray-800 mt-2">Daily Practice Tip</h2>
              <p className="text-sm text-gray-600 mt-2">
                Short, steady practice builds confidence. Try one unit a day and finish with extra practice.
              </p>
            </div>
            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Last mastered cards
                <div className="text-lg font-semibold text-gray-800">{totalMastered}</div>
              </div>
              <div className="text-3xl">✨</div>
            </div>
          </div>
        </div>

        <div className="mb-10">
          <FunLearningHub
            streakDays={streakDays}
            dailyGoalTarget={DAILY_GOAL_TARGET}
            attemptsToday={attemptsToday}
            achievements={achievements}
            miniGames={miniGames}
          />
        </div>

        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Units</h2>
          <p className="text-sm text-gray-500">Keep working through each unit in order.</p>
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

        {/* Buy Me a Coffee */}
        <div className="mt-12 flex justify-center">
          <BuyMeCoffee />
        </div>
      </div>
    </div>
  );
}
