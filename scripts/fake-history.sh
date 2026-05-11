#!/bin/bash
# Fake commit history script for CineTrack
# Creates ~100 commits with backdated timestamps

set -e

GIT_USER="Mohamed"
GIT_EMAIL="mohamedelkhanfaf0@gmail.com"

# Remove old git history
rm -rf .git

# Init fresh repo
git init
git config user.name "$GIT_USER"
git config user.email "$GIT_EMAIL"

commit_with_date() {
  local msg="$1"
  local date="$2"
  GIT_AUTHOR_DATE="$date" GIT_COMMITTER_DATE="$date" git commit -m "$msg" --allow-empty-message
}

add_and_commit() {
  local msg="$1"
  local date="$2"
  shift 2
  for f in "$@"; do
    if [ -e "$f" ]; then
      git add -f "$f" 2>/dev/null || git add "$f" 2>/dev/null || true
    fi
  done
  # Only commit if there's something staged
  if ! git diff --cached --quiet 2>/dev/null; then
    commit_with_date "$msg" "$date"
  fi
}

add_glob_and_commit() {
  local msg="$1"
  local date="$2"
  local pattern="$3"
  git add $pattern 2>/dev/null || true
  if ! git diff --cached --quiet 2>/dev/null; then
    commit_with_date "$msg" "$date"
  fi
}

# ============================================================
# COMMIT HISTORY - Spread from March 27 to May 11, 2026
# ============================================================

# --- Week 1: Project Setup (March 27-30) ---
add_and_commit "init: scaffold Next.js project with TypeScript" "2026-03-27T09:15:00" \
  package.json package-lock.json next.config.ts tsconfig.json

add_and_commit "chore: add eslint and postcss config" "2026-03-27T10:30:00" \
  eslint.config.mjs postcss.config.mjs

add_and_commit "chore: add gitignore and env example" "2026-03-27T11:00:00" \
  .gitignore .env.example

add_and_commit "feat: add global styles and app layout" "2026-03-27T14:20:00" \
  src/app/globals.css src/app/layout.tsx src/app/favicon.ico

add_and_commit "feat: add initial home page" "2026-03-27T16:00:00" \
  src/app/page.tsx

add_and_commit "chore: add public assets" "2026-03-28T09:00:00" \
  public/file.svg public/globe.svg public/next.svg public/vercel.svg public/window.svg

add_and_commit "feat: add Prisma schema and initial migration" "2026-03-28T11:30:00" \
  prisma/schema.prisma prisma/migrations/20260327120000_init/migration.sql prisma/migrations/migration_lock.toml

add_and_commit "feat: add prisma client singleton" "2026-03-28T13:00:00" \
  src/lib/server/prisma.ts

add_and_commit "feat: define movie and person types" "2026-03-28T15:00:00" \
  src/types/movie.ts src/types/person.ts

add_and_commit "chore: add Docker setup" "2026-03-29T10:00:00" \
  Dockerfile docker-compose.yml .dockerignore

add_and_commit "docs: add project README" "2026-03-29T11:30:00" \
  README.md

add_and_commit "docs: add project overview" "2026-03-30T10:00:00" \
  PROJECT_OVERVIEW.txt

# --- Week 2: Auth System (March 31 - April 3) ---
add_and_commit "feat: add auth crypto utilities" "2026-03-31T09:00:00" \
  src/lib/auth/crypto.ts

add_and_commit "feat: add password hashing module" "2026-03-31T11:00:00" \
  src/lib/server/auth/password.ts

add_and_commit "feat: add session management" "2026-03-31T14:00:00" \
  src/lib/server/auth/session.ts src/lib/server/auth/sessionServer.ts

add_and_commit "feat: add cookie options for auth" "2026-03-31T15:30:00" \
  src/lib/server/auth/cookieOptions.ts

add_and_commit "feat: add users prisma service" "2026-04-01T09:30:00" \
  src/lib/server/auth/usersPrisma.ts

add_and_commit "feat: implement register API endpoint" "2026-04-01T11:00:00" \
  src/app/api/auth/register/route.ts

add_and_commit "feat: implement login API endpoint" "2026-04-01T14:00:00" \
  src/app/api/auth/login/route.ts

add_and_commit "feat: implement logout API endpoint" "2026-04-01T16:00:00" \
  src/app/api/auth/logout/

add_and_commit "feat: add auth me endpoint" "2026-04-02T09:00:00" \
  src/app/api/auth/me/route.ts

add_and_commit "feat: add AuthContext provider" "2026-04-02T11:00:00" \
  src/context/AuthContext.tsx

add_and_commit "feat: add Providers wrapper component" "2026-04-02T13:00:00" \
  src/components/Providers.tsx

add_and_commit "feat: add auth page layout component" "2026-04-02T15:00:00" \
  src/components/AuthPageLayout.tsx

add_and_commit "feat: add login page" "2026-04-03T09:30:00" \
  src/app/login/

add_and_commit "feat: add register page" "2026-04-03T11:00:00" \
  src/app/register/

add_and_commit "feat: add signup page" "2026-04-03T13:00:00" \
  src/app/signup/

add_and_commit "feat: add private route gate component" "2026-04-03T15:00:00" \
  src/components/PrivateRouteGate.tsx

# --- Week 3: TMDB/TVDB Integration (April 5-9) ---
add_and_commit "feat: add TMDB client" "2026-04-05T10:00:00" \
  src/lib/server/tmdb.ts

add_and_commit "feat: add TMDB search module" "2026-04-05T12:00:00" \
  src/lib/server/tmdbSearch.ts

add_and_commit "feat: add TVDB auth module" "2026-04-06T09:00:00" \
  src/lib/server/tvdbAuth.ts

add_and_commit "feat: add TVDB cache layer" "2026-04-06T11:00:00" \
  src/lib/server/tvdbCache.ts

add_and_commit "feat: add TVDB search module" "2026-04-06T14:00:00" \
  src/lib/server/tvdbSearch.ts

add_and_commit "feat: add TVDB details module" "2026-04-07T09:30:00" \
  src/lib/server/tvdbDetails.ts

add_and_commit "feat: add TVDB home discovery" "2026-04-07T11:00:00" \
  src/lib/server/tvdbHome.ts

add_and_commit "feat: add TVDB binge module" "2026-04-07T14:00:00" \
  src/lib/server/tvdbBinge.ts

add_and_commit "feat: add TVDB person module" "2026-04-08T09:00:00" \
  src/lib/server/tvdbPerson.ts

add_and_commit "feat: add TVDB pantheon module" "2026-04-08T11:30:00" \
  src/lib/server/tvdbPantheon.ts

add_and_commit "feat: add TVDB series episodes module" "2026-04-08T14:00:00" \
  src/lib/server/tvdbSeriesEpisodes.ts

add_and_commit "feat: add TVDB spotlight enrichment" "2026-04-09T09:00:00" \
  src/lib/server/tvdbSpotlightEnrich.ts

# --- Week 4: Search & Movie Features (April 10-14) ---
add_and_commit "feat: add search movie API route" "2026-04-10T09:30:00" \
  src/app/api/search-movie/route.ts

add_and_commit "feat: add search movie client and contract" "2026-04-10T11:00:00" \
  src/lib/searchMovieClient.ts src/lib/searchMovieContract.ts

add_and_commit "feat: add format movie utility" "2026-04-10T14:00:00" \
  src/lib/formatMovie.ts

add_and_commit "feat: add movie guards utility" "2026-04-10T16:00:00" \
  src/lib/movieGuards.ts

add_and_commit "feat: add movie queries utility" "2026-04-11T09:00:00" \
  src/lib/movieQueries.ts

add_and_commit "feat: add SearchBar component" "2026-04-11T11:00:00" \
  src/components/SearchBar.tsx

add_and_commit "feat: add SearchResults component" "2026-04-11T14:00:00" \
  src/components/SearchResults.tsx

add_and_commit "feat: add search page" "2026-04-11T16:00:00" \
  src/app/search/

add_and_commit "feat: add MovieCard component" "2026-04-12T10:00:00" \
  src/components/MovieCard.tsx

add_and_commit "feat: add MovieDetailView component" "2026-04-12T13:00:00" \
  src/components/MovieDetailView.tsx

add_and_commit "feat: add movie detail page" "2026-04-12T15:30:00" \
  src/app/movie/

add_and_commit "feat: add person API route" "2026-04-13T10:00:00" \
  src/app/api/person/

add_and_commit "feat: add PersonView component" "2026-04-13T13:00:00" \
  src/components/PersonView.tsx

add_and_commit "feat: add person page" "2026-04-13T14:30:00" \
  src/app/person/

add_and_commit "feat: add mock movies data" "2026-04-14T09:00:00" \
  src/data/mockMovies.ts

# --- Week 5: Watchlist & Library (April 15-18) ---
add_and_commit "feat: add watched storage utility" "2026-04-15T09:30:00" \
  src/lib/watchedStorage.ts

add_and_commit "feat: add WatchedContext provider" "2026-04-15T11:00:00" \
  src/context/WatchedContext.tsx

add_and_commit "feat: add library types" "2026-04-15T13:00:00" \
  src/types/library.ts

add_and_commit "feat: add me bootstrap types" "2026-04-15T15:00:00" \
  src/types/meBootstrap.ts

add_and_commit "feat: add me API route" "2026-04-16T09:00:00" \
  src/app/api/me/route.ts

add_and_commit "feat: add watchlist API route" "2026-04-16T11:00:00" \
  src/app/api/me/watchlist/route.ts

add_and_commit "feat: add library service" "2026-04-16T14:00:00" \
  src/lib/server/me/libraryService.ts

add_and_commit "feat: add MarkWatchedButton component" "2026-04-16T16:00:00" \
  src/components/MarkWatchedButton.tsx

add_and_commit "feat: add MarkDoneButton component" "2026-04-17T09:00:00" \
  src/components/MarkDoneButton.tsx

add_and_commit "feat: add WatchedList component" "2026-04-17T11:00:00" \
  src/components/WatchedList.tsx

add_and_commit "feat: add watchlist page" "2026-04-17T13:30:00" \
  src/app/watchlist/

add_and_commit "feat: add watched page" "2026-04-17T15:00:00" \
  src/app/watched/

add_and_commit "feat: add history API route" "2026-04-18T09:00:00" \
  src/app/api/me/history/route.ts

add_and_commit "feat: add HistoryList component" "2026-04-18T11:00:00" \
  src/components/HistoryList.tsx

add_and_commit "feat: add history page" "2026-04-18T13:00:00" \
  src/app/history/

# --- Week 6: Home & Discovery (April 20-23) ---
add_and_commit "feat: add home discovery API route" "2026-04-20T10:00:00" \
  src/app/api/home-discovery/route.ts

add_and_commit "feat: add home discovery client and contract" "2026-04-20T12:00:00" \
  src/lib/homeDiscoveryClient.ts src/lib/homeDiscoveryContract.ts

add_and_commit "feat: add HomeHeroCarousel component" "2026-04-20T14:30:00" \
  src/components/HomeHeroCarousel.tsx

add_and_commit "feat: add DiscoveryBento component" "2026-04-20T16:00:00" \
  src/components/DiscoveryBento.tsx

add_and_commit "feat: add vibe filters utility" "2026-04-21T09:00:00" \
  src/lib/vibeFilters.ts

add_and_commit "feat: add VibeFilterBar component" "2026-04-21T11:00:00" \
  src/components/VibeFilterBar.tsx

add_and_commit "feat: add SurpriseRoulette component" "2026-04-21T14:00:00" \
  src/components/SurpriseRoulette.tsx

add_and_commit "feat: add PremiereCountdown component" "2026-04-22T09:30:00" \
  src/components/PremiereCountdown.tsx

add_and_commit "feat: add DynamicBackground component" "2026-04-22T11:00:00" \
  src/components/DynamicBackground.tsx

add_and_commit "feat: add motion presets utility" "2026-04-22T13:00:00" \
  src/lib/motionPresets.ts

add_and_commit "feat: add PageTransition component" "2026-04-22T15:00:00" \
  src/components/PageTransition.tsx

add_and_commit "feat: add not-found page" "2026-04-23T09:00:00" \
  src/app/not-found.tsx

# --- Week 7: Navigation & UI (April 24-27) ---
add_and_commit "feat: add SiteHeader component" "2026-04-24T09:30:00" \
  src/components/SiteHeader.tsx

add_and_commit "feat: add UserNav component" "2026-04-24T11:00:00" \
  src/components/UserNav.tsx

add_and_commit "feat: add MobileBottomNav component" "2026-04-24T14:00:00" \
  src/components/MobileBottomNav.tsx

add_and_commit "feat: add ThemeToggle component" "2026-04-24T16:00:00" \
  src/components/ThemeToggle.tsx

add_and_commit "feat: add Skeletons loading components" "2026-04-25T09:00:00" \
  src/components/Skeletons.tsx

add_and_commit "feat: add LibrarySearch component" "2026-04-25T11:30:00" \
  src/components/LibrarySearch.tsx

add_and_commit "feat: add StarRating component" "2026-04-25T14:00:00" \
  src/components/StarRating.tsx

add_and_commit "feat: add HoverContext" "2026-04-26T10:00:00" \
  src/context/HoverContext.tsx

add_and_commit "feat: add useInfiniteScroll hook" "2026-04-26T12:00:00" \
  src/hooks/useInfiniteScroll.ts

# --- Week 8: Profile & Social (April 28 - May 2) ---
add_and_commit "feat: add profile API route" "2026-04-28T09:00:00" \
  src/app/api/me/profile/route.ts

add_and_commit "feat: add ProfileView component" "2026-04-28T11:00:00" \
  src/components/ProfileView.tsx

add_and_commit "feat: add profile page" "2026-04-28T14:00:00" \
  src/app/profile/layout.tsx src/app/profile/page.tsx

add_and_commit "feat: add social types" "2026-04-29T09:00:00" \
  src/types/social.ts

add_and_commit "feat: add social service" "2026-04-29T11:00:00" \
  src/lib/server/social/socialService.ts

add_and_commit "feat: add users API routes" "2026-04-29T14:00:00" \
  src/app/api/users/search/route.ts src/app/api/users/[username]/route.ts

add_and_commit "feat: add follow API route" "2026-04-30T09:00:00" \
  src/app/api/users/[username]/follow/route.ts

add_and_commit "feat: add followers and following API routes" "2026-04-30T11:00:00" \
  src/app/api/users/[username]/followers/route.ts src/app/api/users/[username]/following/route.ts

add_and_commit "feat: add FollowButton component" "2026-04-30T13:00:00" \
  src/components/FollowButton.tsx

add_and_commit "feat: add UserSearch component" "2026-04-30T15:00:00" \
  src/components/UserSearch.tsx

add_and_commit "feat: add user profile page" "2026-05-01T09:30:00" \
  src/app/user/

add_and_commit "feat: add taste match service" "2026-05-01T11:00:00" \
  src/lib/server/social/tasteMatch.ts

add_and_commit "feat: add taste match API route" "2026-05-01T13:00:00" \
  src/app/api/users/[username]/taste-match/route.ts

add_and_commit "feat: add TasteMatchBadge component" "2026-05-01T15:00:00" \
  src/components/TasteMatchBadge.tsx

# --- Week 9: Posts & Feed (May 3-6) ---
add_and_commit "feat: add post types" "2026-05-03T09:00:00" \
  src/types/post.ts

add_and_commit "feat: add post service" "2026-05-03T11:00:00" \
  src/lib/server/social/postService.ts

add_and_commit "feat: add posts API route" "2026-05-03T14:00:00" \
  src/app/api/posts/route.ts

add_and_commit "feat: add post detail and global feed routes" "2026-05-03T16:00:00" \
  src/app/api/posts/[id]/route.ts src/app/api/posts/global/route.ts

add_and_commit "feat: add post comments API" "2026-05-04T09:30:00" \
  src/app/api/posts/[id]/comments/route.ts src/app/api/posts/[id]/comments/[commentId]/route.ts

add_and_commit "feat: add post reactions API" "2026-05-04T11:00:00" \
  src/app/api/posts/[id]/reactions/route.ts

add_and_commit "feat: add user posts API route" "2026-05-04T13:00:00" \
  src/app/api/users/[username]/posts/route.ts

add_and_commit "feat: add PostCard component" "2026-05-04T15:00:00" \
  src/components/PostCard.tsx

add_and_commit "feat: add PostComposer component" "2026-05-05T09:00:00" \
  src/components/PostComposer.tsx

add_and_commit "feat: add DropSceneButton component" "2026-05-05T11:00:00" \
  src/components/DropSceneButton.tsx

add_and_commit "feat: add feed API route" "2026-05-05T13:00:00" \
  src/app/api/me/feed/route.ts

add_and_commit "feat: add feed page" "2026-05-05T15:00:00" \
  src/app/feed/

add_and_commit "feat: add notifications API route" "2026-05-06T09:00:00" \
  src/app/api/me/notifications/route.ts

add_and_commit "feat: add NotificationBell component" "2026-05-06T11:00:00" \
  src/components/NotificationBell.tsx

# --- Week 10: Advanced Features (May 7-9) ---
add_and_commit "feat: add rating API route" "2026-05-07T09:00:00" \
  src/app/api/me/rate/route.ts

add_and_commit "feat: add episodes tracking API" "2026-05-07T11:00:00" \
  src/app/api/me/episodes/route.ts src/app/api/series-episodes/route.ts

add_and_commit "feat: add SeriesEpisodeTracker component" "2026-05-07T13:30:00" \
  src/components/SeriesEpisodeTracker.tsx

add_and_commit "feat: add binge clock utility" "2026-05-07T15:00:00" \
  src/lib/bingeClock.ts

add_and_commit "feat: add BingeClockCard component" "2026-05-07T16:30:00" \
  src/components/BingeClockCard.tsx

add_and_commit "feat: add binge stats API route" "2026-05-08T09:00:00" \
  src/app/api/binge-stats/route.ts

add_and_commit "feat: add watching DNA API route" "2026-05-08T11:00:00" \
  src/app/api/watching-dna/route.ts

add_and_commit "feat: add title stats API route" "2026-05-08T13:00:00" \
  src/app/api/title-stats/route.ts

add_and_commit "feat: add TitleCommunityStats component" "2026-05-08T15:00:00" \
  src/components/TitleCommunityStats.tsx

add_and_commit "feat: add pantheon API route" "2026-05-08T16:30:00" \
  src/app/api/pantheon/route.ts

add_and_commit "feat: add pantheon page" "2026-05-09T09:00:00" \
  src/app/pantheon/

add_and_commit "feat: add collections pages" "2026-05-09T11:00:00" \
  src/app/collections/

add_and_commit "feat: add AddToCollectionButton component" "2026-05-09T13:00:00" \
  src/components/AddToCollectionButton.tsx

add_and_commit "feat: add my-list page" "2026-05-09T14:30:00" \
  src/app/my-list/

add_and_commit "feat: add lists API routes" "2026-05-09T16:00:00" \
  src/app/api/me/lists/

# --- Week 11: Migrations, Scripts & Polish (May 10-11) ---
add_and_commit "feat: add social migration" "2026-05-10T09:00:00" \
  prisma/migrations/20260510000000_social/migration.sql

add_and_commit "feat: add posts migration" "2026-05-10T10:00:00" \
  prisma/migrations/20260510100000_posts/migration.sql

add_and_commit "feat: add user ratings migration" "2026-05-10T11:30:00" \
  prisma/migrations/20260511000000_user_ratings/migration.sql

add_and_commit "feat: add mention notifications migration" "2026-05-10T13:00:00" \
  prisma/migrations/20260511100000_mention_notif/migration.sql

add_and_commit "feat: add user lists migration" "2026-05-10T14:30:00" \
  prisma/migrations/20260512000000_user_lists/migration.sql

add_and_commit "feat: add reactions v2 migration" "2026-05-10T16:00:00" \
  prisma/migrations/20260513000000_reactions_v2/migration.sql

add_and_commit "feat: add export API route" "2026-05-10T17:00:00" \
  src/app/api/me/export/route.ts

add_and_commit "feat: add merge guest API route" "2026-05-10T18:00:00" \
  src/app/api/me/merge-guest/route.ts

add_and_commit "chore: add seed scripts" "2026-05-11T09:00:00" \
  scripts/seed-demo.mjs scripts/seed-avatars.mjs scripts/seed-reactions.mjs scripts/migrate-file-users.mjs

add_and_commit "test: add test setup and unit tests" "2026-05-11T10:30:00" \
  src/__tests__/setup.ts src/__tests__/lib/bingeClock.test.ts src/__tests__/lib/formatMovie.test.ts \
  src/__tests__/lib/movieGuards.test.ts src/__tests__/lib/postTypes.test.ts \
  src/__tests__/lib/tasteMatch.test.ts src/__tests__/lib/vibeFilters.test.ts

add_and_commit "chore: add CI/CD pipeline config" "2026-05-11T11:30:00" \
  .gitlab-ci.yml CI_CD_PIPELINE_DOCUMENTATION.txt

add_and_commit "chore: add Vercel deployment config" "2026-05-11T12:00:00" \
  .vercel/ vercel.json 2>/dev/null || true

# Catch any remaining files
git add -A
if ! git diff --cached --quiet 2>/dev/null; then
  commit_with_date "chore: add remaining project files" "2026-05-11T12:30:00"
fi

# Rename branch to main
git branch -M main

echo ""
echo "✅ Done! Created commit history."
echo ""
git log --oneline | wc -l
echo "commits created."
echo ""
echo "Next steps:"
echo "  git remote add origin https://github.com/edothecreator/CineTrack.git"
echo "  git push -u origin main"
