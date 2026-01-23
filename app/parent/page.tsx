import { auth, signOut } from '@/auth';
import { redirect } from 'next/navigation';
import { getUserAttemptStats, getUserById, getUserProgress, getUserRecentAttempts } from '@/lib/db';
import { TOPICS } from '@/lib/types';
import { flashcards } from '@/data/flashcards';

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
});

export default async function ParentDashboardPage() {
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

  const [progress, attemptStats, recentAttempts] = await Promise.all([
    getUserProgress(user.id),
    getUserAttemptStats(user.id),
    getUserRecentAttempts(user.id, 8),
  ]);

  const attemptStatsMap = new Map(attemptStats.map(stat => [stat.topicId, stat]));
  const totalCards = flashcards.length;
  const totalAttemptedCards = Object.keys(progress).length;
  const totalAttempts = attemptStats.reduce((sum, stat) => sum + stat.attempts, 0);
  const totalCorrect = attemptStats.reduce((sum, stat) => sum + stat.correct, 0);
  const accuracy = totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0;

  const overallMastered = Object.values(progress).filter(item => item.mastered).length;

  const recent = recentAttempts.map(attempt => {
    const card = flashcards.find(item => item.id === attempt.cardId);
    const topic = TOPICS.find(item => item.id === attempt.topicId);
    return {
      ...attempt,
      question: card?.question ?? attempt.cardId,
      topicName: topic?.name ?? attempt.topicId,
    };
  });

  return (
    <div className="min-h-screen p-4 md:p-8 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
          <div>
            <p className="text-sm text-indigo-600 font-semibold">Parent Dashboard</p>
            <h1 className="text-3xl font-bold text-gray-800">{user.childName}&apos;s Progress</h1>
            <p className="text-gray-500 mt-1">Overview of practice results and topic mastery.</p>
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <p className="text-sm text-gray-500">Cards Attempted</p>
            <div className="text-3xl font-bold text-gray-900 mt-2">{totalAttemptedCards}</div>
            <p className="text-sm text-gray-400 mt-1">out of {totalCards} total cards</p>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <p className="text-sm text-gray-500">Overall Accuracy</p>
            <div className="text-3xl font-bold text-gray-900 mt-2">{accuracy}%</div>
            <p className="text-sm text-gray-400 mt-1">{totalCorrect} correct / {totalAttempts} attempts</p>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <p className="text-sm text-gray-500">Mastered Cards</p>
            <div className="text-3xl font-bold text-gray-900 mt-2">{overallMastered}</div>
            <p className="text-sm text-gray-400 mt-1">mastered so far</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Progress by Unit</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500">
                  <th className="py-2 pr-4 font-medium">Unit</th>
                  <th className="py-2 pr-4 font-medium">Cards Attempted</th>
                  <th className="py-2 pr-4 font-medium">Accuracy</th>
                  <th className="py-2 pr-4 font-medium">Last Practice</th>
                </tr>
              </thead>
              <tbody className="text-gray-700">
                {TOPICS.map(topic => {
                  const stat = attemptStatsMap.get(topic.id);
                  const topicCards = flashcards.filter(card => card.topic === topic.id);
                  const attempts = stat?.attempts ?? 0;
                  const correct = stat?.correct ?? 0;
                  const uniqueCards = stat?.uniqueCards ?? 0;
                  const percent = attempts > 0 ? Math.round((correct / attempts) * 100) : 0;
                  const lastAttempt = stat?.lastAttempt
                    ? dateFormatter.format(new Date(stat.lastAttempt))
                    : 'Not yet';

                  return (
                    <tr key={topic.id} className="border-t border-gray-100">
                      <td className="py-3 pr-4 font-medium text-gray-800">
                        <span className="mr-2">{topic.icon}</span>
                        {topic.name}
                      </td>
                      <td className="py-3 pr-4">
                        {uniqueCards} / {topicCards.length}
                      </td>
                      <td className="py-3 pr-4">{percent}%</td>
                      <td className="py-3 pr-4 text-gray-500">{lastAttempt}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Recent Results</h2>
          {recent.length === 0 ? (
            <p className="text-sm text-gray-500">No practice results yet.</p>
          ) : (
            <ul className="space-y-4">
              {recent.map((attempt, index) => (
                <li
                  key={`${attempt.cardId}-${attempt.createdAt}-${index}`}
                  className="flex flex-col md:flex-row md:items-center md:justify-between gap-2"
                >
                  <div>
                    <p className="text-gray-800 font-medium">{attempt.question}</p>
                    <p className="text-sm text-gray-500">{attempt.topicName}</p>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <span
                      className={`px-2 py-1 rounded-full font-semibold ${
                        attempt.correct
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-rose-100 text-rose-700'
                      }`}
                    >
                      {attempt.correct ? 'Correct' : 'Needs work'}
                    </span>
                    <span className="text-gray-400">
                      {dateFormatter.format(new Date(attempt.createdAt))}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
