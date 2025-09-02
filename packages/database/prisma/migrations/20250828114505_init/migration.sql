-- CreateEnum
CREATE TYPE "public"."PartyStatus" AS ENUM ('WAITING', 'ACTIVE', 'PAUSED', 'ENDED');

-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "name" TEXT,
    "image" TEXT,
    "emailVerified" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "public"."MusicProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "service" TEXT NOT NULL,
    "serviceUserId" TEXT,
    "topTracks" JSONB,
    "topArtists" JSONB,
    "topGenres" JSONB,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "expiresAt" TIMESTAMP(3),
    "lastSyncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MusicProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Party" (
    "id" TEXT NOT NULL,
    "code" VARCHAR(6) NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "hostId" TEXT NOT NULL,
    "settings" JSONB NOT NULL DEFAULT '{}',
    "status" "public"."PartyStatus" NOT NULL DEFAULT 'WAITING',
    "startedAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Party_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Membership" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "partyId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'guest',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leftAt" TIMESTAMP(3),

    CONSTRAINT "Membership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Track" (
    "id" TEXT NOT NULL,
    "partyId" TEXT NOT NULL,
    "isrc" TEXT,
    "spotifyId" TEXT,
    "appleId" TEXT,
    "lastfmId" TEXT,
    "title" TEXT NOT NULL,
    "artist" TEXT NOT NULL,
    "album" TEXT,
    "duration" INTEGER,
    "imageUrl" TEXT,
    "previewUrl" TEXT,
    "energy" DOUBLE PRECISION DEFAULT 0.5,
    "danceability" DOUBLE PRECISION DEFAULT 0.5,
    "valence" DOUBLE PRECISION DEFAULT 0.5,
    "tempo" DOUBLE PRECISION,
    "position" INTEGER NOT NULL,
    "addedById" TEXT,
    "source" TEXT,
    "playedAt" TIMESTAMP(3),
    "skippedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Track_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Vote" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "trackId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Vote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."GeneratedPlaylist" (
    "id" TEXT NOT NULL,
    "partyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "spotifyId" TEXT,
    "appleId" TEXT,
    "tracks" JSONB NOT NULL,
    "exportedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GeneratedPlaylist_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE INDEX "Account_userId_idx" ON "public"."Account"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "public"."Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "public"."Session"("sessionToken");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "public"."Session"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "public"."VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "public"."VerificationToken"("identifier", "token");

-- CreateIndex
CREATE INDEX "MusicProfile_userId_idx" ON "public"."MusicProfile"("userId");

-- CreateIndex
CREATE INDEX "MusicProfile_service_idx" ON "public"."MusicProfile"("service");

-- CreateIndex
CREATE UNIQUE INDEX "MusicProfile_userId_service_key" ON "public"."MusicProfile"("userId", "service");

-- CreateIndex
CREATE UNIQUE INDEX "Party_code_key" ON "public"."Party"("code");

-- CreateIndex
CREATE INDEX "Party_code_idx" ON "public"."Party"("code");

-- CreateIndex
CREATE INDEX "Party_hostId_idx" ON "public"."Party"("hostId");

-- CreateIndex
CREATE INDEX "Party_status_idx" ON "public"."Party"("status");

-- CreateIndex
CREATE INDEX "Membership_partyId_idx" ON "public"."Membership"("partyId");

-- CreateIndex
CREATE INDEX "Membership_userId_idx" ON "public"."Membership"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Membership_userId_partyId_key" ON "public"."Membership"("userId", "partyId");

-- CreateIndex
CREATE INDEX "Track_partyId_idx" ON "public"."Track"("partyId");

-- CreateIndex
CREATE UNIQUE INDEX "Track_partyId_position_key" ON "public"."Track"("partyId", "position");

-- CreateIndex
CREATE INDEX "Vote_trackId_idx" ON "public"."Vote"("trackId");

-- CreateIndex
CREATE INDEX "Vote_userId_idx" ON "public"."Vote"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Vote_userId_trackId_key" ON "public"."Vote"("userId", "trackId");

-- CreateIndex
CREATE INDEX "GeneratedPlaylist_partyId_idx" ON "public"."GeneratedPlaylist"("partyId");

-- AddForeignKey
ALTER TABLE "public"."Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MusicProfile" ADD CONSTRAINT "MusicProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Party" ADD CONSTRAINT "Party_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Membership" ADD CONSTRAINT "Membership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Membership" ADD CONSTRAINT "Membership_partyId_fkey" FOREIGN KEY ("partyId") REFERENCES "public"."Party"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Track" ADD CONSTRAINT "Track_partyId_fkey" FOREIGN KEY ("partyId") REFERENCES "public"."Party"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Track" ADD CONSTRAINT "Track_addedById_fkey" FOREIGN KEY ("addedById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Vote" ADD CONSTRAINT "Vote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Vote" ADD CONSTRAINT "Vote_trackId_fkey" FOREIGN KEY ("trackId") REFERENCES "public"."Track"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GeneratedPlaylist" ADD CONSTRAINT "GeneratedPlaylist_partyId_fkey" FOREIGN KEY ("partyId") REFERENCES "public"."Party"("id") ON DELETE CASCADE ON UPDATE CASCADE;
