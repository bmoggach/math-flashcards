'use client';

interface ProgressBarProps {
  current: number;
  total: number;
  correct: number;
}

export default function ProgressBar({ current, total, correct }: ProgressBarProps) {
  const progressPercent = total > 0 ? Math.round((current / total) * 100) : 0;

  return (
    <div className="w-full">
      <div className="flex justify-between text-sm mb-2">
        <span className="text-gray-600">
          Card {current} of {total}
        </span>
        <span className="text-emerald-600 font-medium">
          {correct} correct
        </span>
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-indigo-500 transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </div>
  );
}
