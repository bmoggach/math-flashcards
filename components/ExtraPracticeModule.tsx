import Link from 'next/link';

interface ExtraPracticeModuleProps {
  needsWorkCount: number;
}

export default function ExtraPracticeModule({ needsWorkCount }: ExtraPracticeModuleProps) {
  return (
    <div className="bg-amber-50 border border-amber-100 rounded-2xl p-6 shadow-sm flex flex-col gap-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">Extra Practice</p>
        <h2 className="text-2xl font-bold text-gray-800 mt-2">Needs Work Cards</h2>
        <p className="text-sm text-gray-600 mt-1">
          Focus on the cards that need a little more attention.
        </p>
      </div>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-amber-700 font-semibold">Cards to revisit</p>
          <p className="text-3xl font-bold text-gray-800">{needsWorkCount}</p>
        </div>
        <div className="h-14 w-14 rounded-full bg-amber-100 flex items-center justify-center text-2xl">
          🎯
        </div>
      </div>
      <Link
        href="/practice/needs-work"
        className="inline-flex items-center justify-center rounded-full bg-amber-600 text-white text-sm font-semibold px-5 py-2.5 shadow-sm hover:bg-amber-700 transition"
      >
        Start extra practice
      </Link>
    </div>
  );
}
