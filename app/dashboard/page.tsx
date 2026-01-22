import { auth, signOut } from '@/auth';
import { redirect } from 'next/navigation';
import { getUserById, getUserProgress } from '@/lib/db';
import { TOPICS } from '@/lib/types';
import { flashcards } from '@/data/flashcards';
import TopicCard from '@/components/TopicCard';
import BuyMeCoffee from '@/components/BuyMeCoffee';

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

  const progress = await getUserProgress(user.id);

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

        {/* Buy Me a Coffee */}
        <div className="mt-12 flex justify-center">
          <BuyMeCoffee />
        </div>
      </div>
    </div>
  );
}
