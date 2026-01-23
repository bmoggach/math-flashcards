import Link from 'next/link';

interface Achievement {
  title: string;
  description: string;
  unlocked: boolean;
}

interface MiniGame {
  name: string;
  description: string;
  href: string;
  icon: string;
}

interface FunLearningHubProps {
  streakDays: number;
  dailyGoalTarget: number;
  attemptsToday: number;
  achievements: Achievement[];
  miniGames: MiniGame[];
}

export default function FunLearningHub({
  streakDays,
  dailyGoalTarget,
  attemptsToday,
  achievements,
  miniGames,
}: FunLearningHubProps) {
  const dailyProgress = Math.min(attemptsToday, dailyGoalTarget);
  const dailyPercent = dailyGoalTarget > 0
    ? Math.round((dailyProgress / dailyGoalTarget) * 100)
    : 0;

  return (
    <section className="bg-white rounded-2xl shadow-lg p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">Fun Learning</p>
          <h2 className="text-2xl font-bold text-gray-800 mt-1">Streaks, goals, and rewards</h2>
        </div>
        <p className="text-sm text-gray-500">Make practice feel like a game while staying focused.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-indigo-50 rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Streaks & Daily Goals</h3>
              <p className="text-sm text-gray-600">Keep the streak alive with small wins.</p>
            </div>
            <div className="text-3xl">🔥</div>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Current streak</p>
              <p className="text-2xl font-bold text-gray-800">{streakDays} days</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Today&apos;s goal</p>
              <p className="text-lg font-semibold text-gray-800">
                {dailyProgress}/{dailyGoalTarget} cards
              </p>
            </div>
          </div>
          <div className="mt-4 h-2 bg-white rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-500 transition-all"
              style={{ width: `${dailyPercent}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-gray-500">Tip: A 10-minute streak beats a 1-hour marathon.</p>
        </div>

        <div className="bg-emerald-50 rounded-2xl p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Highlights</h3>
              <p className="text-sm text-gray-600">Achievements and quick-play modes in one spot.</p>
            </div>
            <div className="text-3xl">🏅</div>
          </div>
          <ul className="space-y-2">
            {achievements.map(achievement => (
              <li
                key={achievement.title}
                className="flex items-center justify-between rounded-xl bg-white/70 px-3 py-2"
              >
                <div>
                  <p className="text-sm font-semibold text-gray-800">{achievement.title}</p>
                  <p className="text-xs text-gray-500">{achievement.description}</p>
                </div>
                <span
                  className={`text-xs font-semibold px-2 py-1 rounded-full ${
                    achievement.unlocked
                      ? 'bg-emerald-200 text-emerald-800'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {achievement.unlocked ? 'Unlocked' : 'Locked'}
                </span>
              </li>
            ))}
          </ul>
          <div className="pt-2 space-y-2">
            {miniGames.map(game => (
              <Link
                key={game.name}
                href={game.href}
                className="flex items-center justify-between rounded-xl bg-white/80 px-3 py-2 text-sm font-semibold text-gray-800 hover:bg-white transition"
              >
                <span>
                  {game.icon} {game.name}
                  <span className="block text-xs font-normal text-gray-500">{game.description}</span>
                </span>
                <span className="text-xs font-semibold text-emerald-700">Play</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
