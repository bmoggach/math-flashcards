'use client';

import { useState } from 'react';
import { Flashcard as FlashcardType } from '@/lib/types';

interface FlashcardProps {
  card: FlashcardType;
  onAnswer: (correct: boolean) => void;
  showHint?: boolean;
}

export default function Flashcard({ card, onAnswer, showHint = true }: FlashcardProps) {
  const [flipped, setFlipped] = useState(false);
  const [showingHint, setShowingHint] = useState(false);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [markedCorrect, setMarkedCorrect] = useState<boolean | null>(null);

  const handleFlip = () => {
    if (!flipped) {
      setFlipped(true);
      return;
    }
    if (hasAnswered) {
      setFlipped(false);
    }
  };

  const handleAnswer = (correct: boolean) => {
    setHasAnswered(true);
    setMarkedCorrect(correct);
    onAnswer(correct);
  };

  return (
    <div className="w-full max-w-lg mx-auto">
      {/* Card */}
      <div
        onClick={handleFlip}
        className={`relative w-full aspect-[4/3] cursor-pointer perspective-1000 ${
          !flipped ? 'hover:scale-[1.02]' : ''
        } transition-transform`}
      >
        <div
          className={`absolute inset-0 transition-transform duration-500 transform-style-3d ${
            flipped ? 'rotate-y-180' : ''
          }`}
          style={{
            transformStyle: 'preserve-3d',
            transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          }}
        >
          {/* Front - Question */}
          <div
            className="absolute inset-0 bg-white rounded-3xl shadow-xl p-8 flex flex-col items-center justify-center backface-hidden"
            style={{ backfaceVisibility: 'hidden' }}
          >
            <div className="text-sm text-indigo-500 font-medium mb-4 uppercase tracking-wide">
              Question
            </div>
            <div className="text-2xl md:text-3xl text-center text-gray-800 font-medium">
              {card.question}
            </div>
            {showHint && card.hint && !showingHint && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowingHint(true);
                }}
                className="mt-6 text-sm text-indigo-400 hover:text-indigo-600"
              >
                Need a hint?
              </button>
            )}
            {showingHint && card.hint && (
              <div className="mt-6 text-sm text-amber-600 bg-amber-50 px-4 py-2 rounded-xl">
                Hint: {card.hint}
              </div>
            )}
            {hasAnswered && markedCorrect !== null && (
              <div
                className={`mt-6 text-sm font-semibold px-4 py-2 rounded-xl ${
                  markedCorrect
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-rose-100 text-rose-700'
                }`}
              >
                {markedCorrect ? 'Marked: Got it' : 'Marked: Needs work'}
              </div>
            )}
            <div className="absolute bottom-6 text-sm text-gray-400">
              {flipped ? 'Tap to return (after marking)' : 'Tap to reveal answer'}
            </div>
          </div>

          {/* Back - Answer */}
          <div
            className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl shadow-xl p-8 flex flex-col items-center justify-center"
            style={{
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
            }}
          >
            <div className="text-sm text-indigo-200 font-medium mb-4 uppercase tracking-wide">
              Answer
            </div>
            <div className="text-2xl md:text-3xl text-center text-white font-medium">
              {card.answer}
            </div>
          </div>
        </div>
      </div>

      {/* Answer Buttons */}
      {flipped && !hasAnswered && (
        <div className="flex gap-4 mt-6 justify-center">
          <button
            onClick={() => handleAnswer(false)}
            className="flex-1 max-w-[150px] bg-rose-100 hover:bg-rose-200 text-rose-700 font-semibold py-4 px-6 rounded-2xl transition-colors"
          >
            Needs Work
          </button>
          <button
            onClick={() => handleAnswer(true)}
            className="flex-1 max-w-[150px] bg-emerald-100 hover:bg-emerald-200 text-emerald-700 font-semibold py-4 px-6 rounded-2xl transition-colors"
          >
            Got It!
          </button>
        </div>
      )}
      {hasAnswered && (
        <div className="flex flex-col sm:flex-row gap-3 mt-6 justify-center">
          <p className="text-sm text-gray-400 self-center">
            Tap the card to flip back and review, or use Previous to revisit.
          </p>
        </div>
      )}
    </div>
  );
}
