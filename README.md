# Math Flashcards - Grade 6 Ontario Curriculum

A web-based flashcard app for practicing Grade 6 Ontario Math curriculum with name+PIN authentication and progress tracking.

## Features

- **Simple Login**: Enter name + 4-digit PIN (creates account automatically if new)
- **5 Math Topics**: Number Sense, Algebra, Measurement, Geometry, Data & Probability
- **100+ Flashcards**: Covering fractions, decimals, percentages, BEDMAS, area, volume, coordinates, and more
- **Progress Tracking**: See your mastery level for each topic
- **Kid-Friendly UI**: Colorful, easy to use interface

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Storage**: Vercel KV

## Getting Started

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd math-flashcards
npm install
```

### 2. Set Up Vercel KV

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Create a new KV store (or use an existing project's store)
3. Copy the environment variables

### 3. Configure Environment

```bash
cp .env.local.example .env.local
```

Fill in your Vercel KV credentials in `.env.local`.

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Project Structure

```
math-flashcards/
├── app/
│   ├── page.tsx              # Login screen
│   ├── dashboard/
│   │   └── page.tsx          # Topic selection + progress
│   ├── practice/
│   │   └── [topic]/
│   │       └── page.tsx      # Flashcard practice
│   ├── api/
│   │   ├── auth/route.ts     # Login/create user
│   │   ├── progress/route.ts # Save/load progress
│   │   └── flashcards/route.ts
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── Flashcard.tsx         # Flip card component
│   ├── ProgressBar.tsx
│   └── TopicCard.tsx
├── data/
│   └── flashcards.ts         # All flashcard content
├── lib/
│   ├── kv.ts                 # Vercel KV helpers
│   └── types.ts              # TypeScript types
```

## Math Topics Covered

Based on the 2020 Ontario Mathematics Curriculum for Grade 6:

1. **Number Sense**: Fractions, decimals, percentages, integers, ratios
2. **Algebra**: Patterns, variables, BEDMAS, solving equations
3. **Measurement**: Area, volume, angles, unit conversions
4. **Geometry**: 2D/3D shapes, coordinates, transformations
5. **Data & Probability**: Mean/median/mode, graphs, probability

## Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USERNAME/math-flashcards)

1. Push your code to GitHub
2. Import the repository in Vercel
3. Add a KV store to your project
4. Deploy!

## License

MIT
