# 🎬 CineTrack

A full-stack movie and TV show tracking platform built with Next.js 16, React 19, and Prisma. Track what you watch, rate titles, follow friends, share reviews, and discover new content through personalized recommendations.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)
![Prisma](https://img.shields.io/badge/Prisma-6-2D3748?logo=prisma)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-06B6D4?logo=tailwindcss)

---

## Features

**Core Tracking**
- Search movies & TV shows via TMDB/TVDB integration
- Mark titles as watched, add to watchlist, rate with stars
- Episode-level tracking for TV series
- Watch history with timestamps
- Custom user lists and collections

**Social**
- Follow/unfollow users
- Activity feed with posts from people you follow
- Post reviews, drop scenes, and reactions
- Comment threads on posts
- Emoji reactions system
- @mention notifications
- Taste match scores between users

**Discovery**
- Home page with hero carousel and curated sections
- Vibe-based filtering (mood, genre, decade)
- Surprise roulette for random picks
- Premiere countdown timers
- Pantheon (top-rated community picks)
- Binge stats and "Watching DNA" analytics

**UX**
- Dark/light theme toggle
- Framer Motion page transitions and micro-animations
- Mobile-first responsive design with bottom nav
- Skeleton loading states
- Infinite scroll pagination

---

## Tech Stack

| Layer | Tech |
|-------|------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| UI | React 19, Tailwind CSS 4, Framer Motion |
| Database | PostgreSQL + Prisma ORM |
| Auth | Custom session-based (bcrypt + HTTP-only cookies) |
| External APIs | TMDB, TVDB |
| Testing | Vitest + React Testing Library |
| Deployment | Vercel / Docker |

---

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL (or use Docker)
- TMDB API key ([get one here](https://www.themoviedb.org/settings/api))

### Setup

```bash
# Clone the repo
git clone https://github.com/edothecreator/CineTrack.git
cd CineTrack

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your database URL and API keys

# Run database migrations
npx prisma migrate deploy

# Seed demo data (optional)
node scripts/seed-demo.mjs

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Docker

```bash
docker-compose up --build
```

This spins up the app + PostgreSQL. The app will be available on port 3000.

---

## Project Structure

```
src/
├── app/
│   ├── api/          # REST API routes (auth, me, posts, users, search)
│   ├── feed/         # Social feed page
│   ├── movie/[id]/   # Movie detail page
│   ├── profile/      # User profile
│   ├── search/       # Search page
│   ├── watchlist/    # Watchlist page
│   └── ...
├── components/       # Reusable UI components
├── context/          # React context providers (Auth, Watched, Hover)
├── hooks/            # Custom hooks
├── lib/
│   ├── auth/         # Client-side auth utilities
│   └── server/       # Server-side services (TMDB, TVDB, Prisma, auth)
├── types/            # TypeScript type definitions
└── __tests__/        # Unit tests
```

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run test` | Run tests (single run) |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Run tests with coverage |
| `npm run db:migrate` | Apply database migrations |
| `npm run db:push` | Push schema changes (dev) |

---

## Environment Variables

```env
DATABASE_URL=postgresql://user:password@localhost:5432/cinetrack
TMDB_API_KEY=your_tmdb_api_key
TVDB_API_KEY=your_tvdb_api_key
SESSION_SECRET=your_session_secret
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

See `.env.example` for the full list.

---

## API Overview

| Endpoint | Description |
|----------|-------------|
| `POST /api/auth/register` | Create account |
| `POST /api/auth/login` | Login |
| `GET /api/auth/me` | Current user |
| `GET /api/search-movie?q=` | Search titles |
| `GET /api/me/watchlist` | User's watchlist |
| `POST /api/me/rate` | Rate a title |
| `GET /api/me/feed` | Social feed |
| `POST /api/posts` | Create a post |
| `GET /api/users/:username` | Public profile |
| `POST /api/users/:username/follow` | Follow user |
| `GET /api/home-discovery` | Home page content |
| `GET /api/watching-dna` | Viewing analytics |

---

## Testing

```bash
# Run all tests
npm run test

# With coverage report
npm run test:coverage
```

Tests cover utility functions (binge clock calculations, movie formatting, vibe filters, taste matching) and type guards.

---

## Deployment

**Vercel (recommended):**
- Connect your GitHub repo to Vercel
- Add environment variables in the Vercel dashboard
- Prisma migrations run automatically via the build command

**Docker:**
- Use the included `Dockerfile` and `docker-compose.yml`
- Suitable for self-hosting on any VPS

---

## License

MIT
