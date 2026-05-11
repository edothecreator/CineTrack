# 🎬 CineTrack

**Spotify Wrapped meets Letterboxd — a social platform for people who treat watching as a lifestyle, not a pastime.**

Track your taste, flex your watch history, follow cinephiles, and discover what to watch next through vibe-based filters, community rankings, and AI-like analytics that map your "Watching DNA."

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)
![Prisma](https://img.shields.io/badge/Prisma-6-2D3748?logo=prisma)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-06B6D4?logo=tailwindcss)

🔗 **[Live Demo → movie-tracker-five-theta.vercel.app](https://movie-tracker-five-theta.vercel.app/)**

---

## Preview

<!-- SCREENSHOTS: Replace these placeholders with actual screenshots -->

| Home & Discovery | Movie Detail | Social Feed |
|:---:|:---:|:---:|
| ![Home Page](docs/screenshots/home.png) | ![Movie Detail](docs/screenshots/movie-detail.png) | ![Feed](docs/screenshots/feed.png) |

| Profile & Stats | Watchlist | Mobile View |
|:---:|:---:|:---:|
| ![Profile](docs/screenshots/profile.png) | ![Watchlist](docs/screenshots/watchlist.png) | ![Mobile](docs/screenshots/mobile.png) |

<!--
📸 SCREENSHOTS TO TAKE:
1. home.png        → Home page with hero carousel + discovery bento grid
2. movie-detail.png → A movie/show detail page with ratings, cast, community stats
3. feed.png        → Social feed showing posts, reactions, comments
4. profile.png     → User profile with watching DNA / binge stats
5. watchlist.png   → Watchlist or watched page with filters
6. mobile.png      → Any page on mobile (shows bottom nav + responsive layout)

Put them in a docs/screenshots/ folder and the table above will render them.
-->

---

## What Makes This Different

This isn't another CRUD movie list. CineTrack is built around three ideas:

### 🧬 Watching DNA
Your viewing habits become data. Genre breakdowns, binge patterns, average ratings, decade preferences — all computed and visualized. Think Spotify Wrapped, but it updates in real-time as you watch.

### 🎰 Vibe-Based Discovery
Forget browsing by genre alone. Filter by mood, decade, vibe. Can't decide? Hit the **Surprise Roulette** and let the algorithm pick. The **Pantheon** surfaces community-ranked all-time greats — not what's trending, what's *actually* good.

### 🤝 Social Layer That Matters
Follow friends. See what they're watching in your feed. Post reviews, drop memorable scenes, react with emojis. A **Taste Match** score tells you how aligned your preferences are with anyone on the platform — so you know whose recommendations to trust.

---

## Tech Stack

| Layer | Tech | Why |
|-------|------|-----|
| Framework | Next.js 16 (App Router) | Server components for data-heavy pages, API routes co-located with UI |
| Language | TypeScript 5 | End-to-end type safety from DB to component props |
| UI | React 19 + Tailwind CSS 4 + Framer Motion | Utility-first styling with fluid animations |
| Database | PostgreSQL + Prisma ORM | Relational data (follows, ratings, lists) with type-safe queries |
| Auth | Custom session-based (bcrypt + HTTP-only cookies) | No third-party dependency, full control over session lifecycle |
| External APIs | TMDB + TVDB | Dual-source for comprehensive movie/TV metadata |
| Testing | Vitest | Fast unit tests for business logic |
| Deployment | Vercel + Docker | Serverless for prod, containerized for local/self-host |

---

## Architecture & Engineering Decisions

- **App Router over Pages Router** — Server Components reduce client bundle size significantly for data-heavy pages (movie details, search results, discovery). Only interactive pieces (reactions, forms, carousels) ship JS to the client.

- **Prisma over raw SQL or Drizzle** — The schema is highly relational (users → follows → posts → comments → reactions). Prisma's relation API and migration system made iterating on the social graph painless. Type generation means zero runtime type mismatches between DB and API.

- **Custom auth over NextAuth** — The app needed guest-to-user account merging, custom session shapes, and full control over cookie behavior. Rolling our own was simpler than fighting adapter abstractions.

- **Server-side services layer (`lib/server/`)** — All external API calls (TMDB, TVDB) and DB queries live in dedicated service modules, not in route handlers. Routes stay thin (validate → call service → respond). This makes testing and reuse trivial.

- **LRU cache for external APIs** — TMDB/TVDB responses are cached in-memory with TTL to avoid rate limits and reduce latency on repeated searches. No Redis needed at this scale.

- **Context for client state, server for source of truth** — `AuthContext` and `WatchedContext` handle optimistic UI updates. The server remains the single source of truth — contexts revalidate on mount and after mutations.

---

## API Architecture

### 🔐 Auth System
Session-based authentication with HTTP-only cookies. Supports guest browsing with seamless account merging on registration.

```
POST /api/auth/register    → Create account (merges guest data)
POST /api/auth/login       → Authenticate + set session cookie
POST /api/auth/logout      → Clear session
GET  /api/auth/me          → Current user or null
```

### 🎬 Content & Discovery
Dual-source metadata from TMDB and TVDB with server-side caching. Discovery engine serves personalized home content.

```
GET  /api/search-movie     → Full-text search across movies & TV
GET  /api/home-discovery   → Curated home page sections
GET  /api/series-episodes  → Episode list for a series
GET  /api/person/:id       → Actor/director filmography
GET  /api/pantheon         → Community top-rated titles
GET  /api/title-stats      → Rating distribution for a title
```

### 👤 User Library
Personal tracking: watchlist, watched history, ratings, episode progress, custom lists, and analytics.

```
GET  /api/me/watchlist     → User's want-to-watch list
GET  /api/me/history       → Chronological watch log
POST /api/me/rate          → Rate a title (1-5 stars)
GET  /api/me/episodes      → Episode completion tracking
GET  /api/me/lists         → Custom collections
GET  /api/watching-dna     → Viewing analytics & patterns
GET  /api/binge-stats      → Binge session metrics
```

### 🌐 Social System
Full social graph with feed, posts, comments, reactions, follows, and taste matching.

```
POST /api/posts            → Create a post (review, scene drop, thought)
GET  /api/me/feed          → Posts from followed users
GET  /api/posts/global     → Public timeline
POST /api/posts/:id/reactions    → React to a post
POST /api/posts/:id/comments    → Comment on a post
POST /api/users/:username/follow → Follow/unfollow
GET  /api/users/:username/taste-match → Compatibility score
GET  /api/me/notifications → Mentions, follows, reactions
```

---

## Project Structure

```
src/
├── app/
│   ├── api/              # 30+ REST endpoints grouped by domain
│   ├── feed/             # Social feed page
│   ├── movie/[id]/       # Movie/show detail
│   ├── collections/      # User collections
│   ├── pantheon/         # Community rankings
│   ├── profile/          # User profile + stats
│   ├── search/           # Search interface
│   └── ...
├── components/           # 35+ UI components (cards, forms, nav, modals)
├── context/              # Auth, Watched, Hover state providers
├── hooks/                # useInfiniteScroll, etc.
├── lib/
│   ├── server/           # Service layer (TMDB, TVDB, auth, social, library)
│   └── *.ts              # Client utilities (formatters, guards, contracts)
├── types/                # Shared TypeScript interfaces
└── __tests__/            # Unit tests for business logic
```

---

## Running Locally

```bash
git clone https://github.com/edothecreator/CineTrack.git
cd CineTrack
npm install
cp .env.example .env   # add your DB URL and API keys
npx prisma migrate deploy
npm run dev
```

Or with Docker:

```bash
docker-compose up --build
```

### Environment Variables

```env
DATABASE_URL=postgresql://user:password@localhost:5432/cinetrack
TMDB_API_KEY=your_tmdb_api_key
TVDB_API_KEY=your_tvdb_api_key
SESSION_SECRET=your_session_secret
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build (includes Prisma generate) |
| `npm run test` | Run unit tests |
| `npm run test:coverage` | Tests with coverage report |
| `npm run lint` | ESLint check |
| `npm run db:migrate` | Apply migrations |

---

## License

MIT
