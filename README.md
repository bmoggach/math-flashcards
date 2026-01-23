# Math Flashcards - Grade 6 Ontario Curriculum

A web-based flashcard app for practicing Grade 6 Ontario Math curriculum with Google authentication and progress tracking.

## Features

- **Google Login**: Sign in with Google OAuth
- **5 Math Topics**: Number Sense, Algebra, Measurement, Geometry, Data & Probability
- **100+ Flashcards**: Covering fractions, decimals, percentages, BEDMAS, area, volume, coordinates, and more
- **Progress Tracking**: See your mastery level for each topic
- **Kid-Friendly UI**: Colorful, easy to use interface

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Neon (Serverless PostgreSQL)

## Getting Started

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd math-flashcards
npm install
```

### 2. Set Up Neon Database

1. Go to [Neon Console](https://console.neon.tech)
2. Create a new project
3. Copy the connection string (DATABASE_URL)

### 3. Configure Environment

```bash
cp .env.local.example .env.local
```

Fill in your Neon DATABASE_URL in `.env.local`. You will also need to configure Google OAuth and Auth.js secrets:

```bash
# Generate a random secret for Auth.js (run once)
openssl rand -base64 32
```

Then set the following values in `.env.local`:

```
AUTH_SECRET=<output-from-openssl>
AUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=<from-google-console>
GOOGLE_CLIENT_SECRET=<from-google-console>
```

In the Google Cloud Console, set the authorized redirect URI to:

```
http://localhost:3000/api/auth/callback/google
```

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
│   ├── db.ts                 # Neon database helpers
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
3. Add the following environment variables in Vercel:
   - `DATABASE_URL`
   - `AUTH_SECRET` (generate once with `openssl rand -base64 32`)
   - `AUTH_URL` (set to your production URL, e.g. `https://your-app.vercel.app`)
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
4. In Google Cloud Console, add the production redirect URI:
   ```
   https://your-app.vercel.app/api/auth/callback/google
   ```
5. Deploy!

## License

MIT
