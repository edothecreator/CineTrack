-- User-created named lists (Collections)
CREATE TABLE IF NOT EXISTS "UserList" (
  "id"          TEXT NOT NULL,
  "userId"      TEXT NOT NULL,
  "name"        TEXT NOT NULL,
  "description" TEXT,
  "isPublic"    BOOLEAN NOT NULL DEFAULT true,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "UserList_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "UserList_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "UserList_userId_idx" ON "UserList"("userId");

-- Items inside a named list
CREATE TABLE IF NOT EXISTS "UserListItem" (
  "id"        TEXT NOT NULL,
  "listId"    TEXT NOT NULL,
  "tmdbId"    TEXT NOT NULL,
  "title"     TEXT NOT NULL,
  "posterUrl" TEXT NOT NULL,
  "addedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "UserListItem_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "UserListItem_listId_tmdbId_key" UNIQUE ("listId", "tmdbId"),
  CONSTRAINT "UserListItem_listId_fkey" FOREIGN KEY ("listId") REFERENCES "UserList"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "UserListItem_listId_idx" ON "UserListItem"("listId");
