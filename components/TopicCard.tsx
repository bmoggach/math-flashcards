'use client';

import Link from 'next/link';
import { Topic } from '@/lib/types';

interface TopicCardProps {
  topic: Topic;
  progress: {
    total: number;
    mastered: number;
    attempted: number;
  };
}

export default function TopicCard({ topic, progress }: TopicCardProps) {
  const masteryPercent = progress.total > 0
    ? Math.round((progress.mastered / progress.total) * 100)
    : 0;

  return (
    <Link href={`/practice/${topic.id}`}>
      <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all hover:scale-105 overflow-hidden cursor-pointer">
        <div className={`${topic.color} h-3`} />
        <div className="p-6">
          <div className="text-4xl mb-3">{topic.icon}</div>
          <h3 className="text-xl font-bold text-gray-800 mb-1">{topic.name}</h3>
          <p className="text-sm text-gray-500 mb-4">{topic.description}</p>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Progress</span>
              <span className="font-medium text-gray-800">{masteryPercent}%</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full ${topic.color} transition-all duration-500`}
                style={{ width: `${masteryPercent}%` }}
              />
            </div>
            <div className="text-xs text-gray-400">
              {progress.mastered} of {progress.total} mastered
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
