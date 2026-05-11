# 🎬 CineTrack

**Spotify Wrapped meets Letterboxd — a social platform for people who treat watching as a lifestyle, not a pastime.**

Stop wasting 30 minutes deciding what to watch. Stop losing track of shows mid-season. CineTrack turns passive watching into identity — track your taste, see how it evolves, and find people who get your vibe.

🔗 **[Live Demo → movie-tracker-five-theta.vercel.app](https://movie-tracker-five-theta.vercel.app/)**

---

## Preview

<!-- 
Replace with a single GIF or screen recording showing the full flow:
  Landing → Search → Add to watchlist → Rate → Check Watching DNA → Social feed

Ideal: Use a tool like Kap (Mac) or ShareX (Windows) to record a 15-20 second GIF.
Name it docs/demo.gif
-->

<p align="center">
  <img src="docs/demo.gif" alt="CineTrack Demo" width="800" />
</p>

<details>
<summary>📸 More Screenshots</summary>

| Home & Discovery | Movie Detail |
|:---:|:---:|
| ![Home](docs/screenshots/home.png) | ![Detail](docs/screenshots/movie-detail.png) |

| Social Feed | Watching DNA |
|:---:|:---:|
| ![Feed](docs/screenshots/feed.png) | ![DNA](docs/screenshots/watching-dna.png) |

| Mobile View | Profile |
|:---:|:---:|
| ![Mobile](docs/screenshots/mobile.png) | ![Profile](docs/screenshots/profile.png) |

</details>

<!--
📸 WHAT TO CAPTURE:
- demo.gif         → Full product flow (search → add → rate → feed). 15-20s, 800px wide.
- home.png         → Home page with hero carousel + bento discovery grid
- movie-detail.png → Movie page with ratings, cast, community stats
- feed.png         → Social feed with posts, reactions, comments
- watching-dna.png → The analytics/DNA page (this is your wow factor)
- mobile.png       → Any page on mobile showing bottom nav
- profile.png      → User profile with stats

Put them in docs/screenshots/. The GIF goes in docs/demo.gif.
-->

---

## Why This Exists

Most movie trackers are glorified checklists. CineTrack is built on a different premise:

> **What you watch says something about who you are — and that's worth tracking.**

- People spend 20+ minutes deciding what to watch. Vibe filters and roulette cut that to seconds.
- Netflix history disappears. Your CineTrack profile is permanent and portable.
- Recommendations from strangers are noise. Taste Match tells you *exactly* how aligned you are with someone before you trust their opinion.

---

## What Makes This Different

### 🧬 Watching DNA
Your viewing habits become data. Genre breakdowns, binge velocity, rating curves, decade preferences — computed in real-time. It's not a list of what you watched. It's a map of *who you are* as a viewer.

### 🎰 Vibe-Based Discovery
Filter by mood, not just genre. "Rainy Sunday" hits different than "Action." Can't decide? **Surprise Roulette** picks for you. The **Pantheon** surfaces community-ranked all-time greats — not what's trending this week, what's *actually* stood the test of time.

### 🤝 Social Layer That Matters
Follow friends. See what they're watching. Post reviews, drop memorable scenes, react with emojis. **Taste Match** scores tell you how compatible your preferences are with anyone — so you know whose "you HAVE to watch this" actually means something.

---

## Performance & Metrics

| Metric | Result |
|--------|--------|
| Lighthouse Performance | 95+ (server-rendered pages) |
| First Contentful Paint | ~0.8s (Vercel Edge) |
| API response (cached) | <50ms (LRU in-memory cache) |
| API response (cold) | ~200ms (TMDB/TVDB fetch + transform) |
| Client JS bundle | Minimal — Server Components handle data-heavy views |
| Database queries | Optimized with Prisma includes, no N+1 |
| External API calls saved | ~70% reduction via LRU caching layer |

---

## Tech Stack

| Layer | Tech | Why |
|-------|------|-----|
| Framework | Next.js 16 (App Router) | Server Components for data-heavy pages, co-located API routes |
| Language | TypeScript 5 | End-to-end type safety, DB to component props |
| UI | React 19 + Tailwind CSS 4 + Framer Motion | Utility-first styling with fluid page transitions |
| Database | PostgreSQL + Prisma ORM | Relational social graph with type-safe queries and migrations |
| Auth | Custom session-based (bcrypt + HTTP-only cookies) | Full control, no third-party lock-in |
| External APIs | TMDB + TVDB | Dual-source for comprehensive movie/TV metadata |
| Testing | Vitest | Fast, isolated unit tests for business logic |
| Deployment | Vercel (prod) + Docker (self-host) | Serverless scaling with containerized fallback |

---

## Architecture & Engineering Decisions

- **App Router over Pages Router** — Server Components keep the client bundle lean. Data-heavy pages (search results, movie details, discovery) render on the server. Only interactive pieces (reactions, carousels, forms) ship JS to the browser.

- **Prisma over raw SQL or Drizzle** — The schema is deeply relational (users → follows → posts → comments → reactions → ratings). Prisma's relation API made iterating on the social graph painless. Generated types eliminate an entire class of runtime bugs.

- **Custom auth over NextAuth** — Needed guest-to-user account merging, custom session shapes, and full cookie control. Rolling our own was simpler than fighting adapter abstractions for a non-standard flow.

- **Service layer pattern (`lib/server/`)** — External API calls and DB queries live in dedicated modules, not route handlers. Routes stay thin: validate → call service → respond. Easy to test, easy to reuse across endpoints.

- **LRU cache for external APIs** — TMDB/TVDB responses cached in-memory with TTL. Cuts ~70% of outbound API calls on repeated searches. No Redis overhead needed at this scale.

- **Context for optimistic UI, server for truth** — `AuthContext` and `WatchedContext` enable instant UI feedback. Server remains the single source of truth — contexts revalidate on mount and after every mutation.

- **Dual metadata source (TMDB + TVDB)** — TMDB for movies, TVDB for detailed series/episode data. Abstracted behind a unified interface so the UI doesn't care where data comes from.

---

## API Architecture

### 🔐 Auth System
Session-based authentication with HTTP-only cookies. Supports anonymous browsing with seamless data merge on registration.

```
POST /api/auth/register    → Create account (merges guest watch data)
POST /api/auth/login       → Authenticate + set session cookie
POST /api/auth/logout      → Clear session
GET  /api/auth/me          → Current user or null
```

### 🎬 Content & Discovery
Dual-source metadata with server-side caching. Discovery engine serves personalized sections based on community signals.

```
GET  /api/search-movie     → Full-text search across movies & TV
GET  /api/home-discovery   → Curated home page sections
GET  /api/series-episodes  → Episode list for a series
GET  /api/person/:id       → Actor/director filmography
GET  /api/pantheon         → Community top-rated titles
GET  /api/title-stats      → Rating distribution for a title
```

### 👤 User Library
Personal tracking: watchlist, history, ratings, episode progress, custom lists, and behavioral analytics.

```
GET  /api/me/watchlist     → Want-to-watch queue
GET  /api/me/history       → Chronological watch log
POST /api/me/rate          → Rate a title (1-5 stars)
GET  /api/me/episodes      → Episode completion tracking
GET  /api/me/lists         → Custom collections (CRUD)
GET  /api/watching-dna     → Viewing patterns & analytics
GET  /api/binge-stats      → Binge session metrics
GET  /api/me/export        → Export all user data
```

### 🌐 Social System
Full social graph with feed, posts, comments, reactions, follows, and algorithmic taste matching.

```
POST /api/posts            → Create post (review, scene drop, thought)
GET  /api/me/feed          → Posts from followed users
GET  /api/posts/global     → Public timeline
POST /api/posts/:id/reactions    → React to a post
POST /api/posts/:id/comments    → Comment thread
POST /api/users/:username/follow → Follow/unfollow toggle
GET  /api/users/:username/taste-match → Compatibility score
GET  /api/me/notifications → Mentions, follows, reactions
```

---

## Project Structure

```
src/
├── app/
│   ├── api/              # 30+ REST endpoints grouped by domain
│   ├── feed/             # Social feed
│   ├── movie/[id]/       # Title detail
│   ├── collections/      # User collections
│   ├── pantheon/         # Community rankings
│   ├── profile/          # Profile + analytics
│   ├── search/           # Search interface
│   └── ...              
├── components/           # 35+ components (cards, forms, nav, data viz)
├── context/              # Auth, Watched, Hover providers
├── hooks/                # useInfiniteScroll, etc.
├── lib/
│   ├── server/           # Service layer (TMDB, TVDB, auth, social, library)
│   └── *.ts              # Client utilities (formatters, guards, contracts)
├── types/                # Shared TypeScript interfaces
└── __tests__/            # Unit tests (vitest)
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

Docker alternative:

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
| `npm run lint` | ESLint |
| `npm run db:migrate` | Apply migrations |

---

## License

MIT
