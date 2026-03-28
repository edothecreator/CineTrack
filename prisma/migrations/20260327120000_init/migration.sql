-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "memberSince" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "profileBio" TEXT NOT NULL DEFAULT '',
    "profileAvatar" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WatchlistItem" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tvdbId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "posterUrl" TEXT NOT NULL,
    "rating" DOUBLE PRECISION,
    "releaseDate" TEXT NOT NULL DEFAULT '',
    "runtimeMinutes" INTEGER,
    "heroBackdropUrl" TEXT,
    "genres" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WatchlistItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WatchedTitle" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tvdbId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "posterUrl" TEXT NOT NULL,
    "rating" DOUBLE PRECISION,
    "releaseDate" TEXT NOT NULL DEFAULT '',
    "runtimeMinutes" INTEGER,
    "genres" JSONB,
    "completedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WatchedTitle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EpisodeMark" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "seriesId" TEXT NOT NULL,
    "episodeId" TEXT NOT NULL,

    CONSTRAINT "EpisodeMark_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "WatchlistItem_userId_idx" ON "WatchlistItem"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "WatchlistItem_userId_tvdbId_key" ON "WatchlistItem"("userId", "tvdbId");

-- CreateIndex
CREATE INDEX "WatchedTitle_userId_idx" ON "WatchedTitle"("userId");

-- CreateIndex
CREATE INDEX "WatchedTitle_userId_completedAt_idx" ON "WatchedTitle"("userId", "completedAt");

-- CreateIndex
CREATE UNIQUE INDEX "WatchedTitle_userId_tvdbId_key" ON "WatchedTitle"("userId", "tvdbId");

-- CreateIndex
CREATE INDEX "EpisodeMark_userId_seriesId_idx" ON "EpisodeMark"("userId", "seriesId");

-- CreateIndex
CREATE UNIQUE INDEX "EpisodeMark_userId_seriesId_episodeId_key" ON "EpisodeMark"("userId", "seriesId", "episodeId");

-- AddForeignKey
ALTER TABLE "WatchlistItem" ADD CONSTRAINT "WatchlistItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WatchedTitle" ADD CONSTRAINT "WatchedTitle_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EpisodeMark" ADD CONSTRAINT "EpisodeMark_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
