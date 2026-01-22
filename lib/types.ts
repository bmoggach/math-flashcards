export interface Flashcard {
  id: string;
  topic: string;
  subtopic: string;
  question: string;
  answer: string;
  hint?: string;
}

export interface CardProgress {
  correct: number;
  incorrect: number;
  lastSeen: string;
  mastered: boolean;
}

export interface UserData {
  name: string;
  createdAt: string;
  progress: Record<string, CardProgress>;
}

export interface Topic {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
}

export const TOPICS: Topic[] = [
  {
    id: 'number-sense',
    name: 'Number Sense',
    description: 'Fractions, decimals, percentages, integers, ratios',
    icon: '🔢',
    color: 'bg-blue-500',
  },
  {
    id: 'algebra',
    name: 'Algebra',
    description: 'Patterns, variables, BEDMAS, equations',
    icon: '🔤',
    color: 'bg-purple-500',
  },
  {
    id: 'measurement',
    name: 'Measurement',
    description: 'Area, volume, angles, unit conversions',
    icon: '📐',
    color: 'bg-green-500',
  },
  {
    id: 'geometry',
    name: 'Geometry',
    description: '2D & 3D shapes, coordinates, transformations',
    icon: '📊',
    color: 'bg-orange-500',
  },
  {
    id: 'data-probability',
    name: 'Data & Probability',
    description: 'Mean, median, mode, graphs, probability',
    icon: '📈',
    color: 'bg-pink-500',
  },
];
