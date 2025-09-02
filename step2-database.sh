#!/bin/bash

# ============================================
# tootFM v3 - STEP 2: Database Setup
# Creates: Prisma schema, database package
# ============================================

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🎵 tootFM v3 - Step 2: Database${NC}"
echo "===================================="

# Database package.json
echo -e "${YELLOW}Creating database package...${NC}"

cat > packages/database/package.json << 'EOF'
{
  "name": "@tootfm/database",
  "version": "0.1.0",
  "private": true,
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "db:generate": "prisma generate",
    "db:push": "prisma db push",
    "db:migrate": "prisma migrate dev",
    "db:studio": "prisma studio",
    "db:reset": "prisma migrate reset",
    "postinstall": "prisma generate"
  },
  "dependencies": {
    "@prisma/client": "^5.8.0"
  },
  "devDependencies": {
    "prisma": "^5.8.0",
    "typescript": "^5.3.3"
  }
}
EOF

# Prisma schema - COMPLETE
cat > packages/database/prisma/schema.prisma << 'EOF'
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id            String    @id @default(cuid())
  email         String?   @unique
  name          String?
  image         String?
  emailVerified DateTime?
  
  accounts      Account[]
  sessions      Session[]
  musicProfiles MusicProfile[]
  hostedParties Party[]       @relation("HostedParties")
  memberships   Membership[]
  addedTracks   Track[]
  votes         Vote[]
  
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
  @@index([userId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId])
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}

model MusicProfile {
  id            String   @id @default(cuid())
  userId        String
  service       String
  serviceUserId String?
  
  topTracks     Json?
  topArtists    Json?
  topGenres     Json?
  
  accessToken   String?  @db.Text
  refreshToken  String?  @db.Text
  expiresAt     DateTime?
  
  lastSyncedAt  DateTime?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@unique([userId, service])
  @@index([userId])
  @@index([service])
}

model Party {
  id          String       @id @default(cuid())
  code        String       @unique @db.VarChar(6)
  name        String
  description String?
  
  hostId      String
  host        User         @relation("HostedParties", fields: [hostId], references: [id])
  
  settings    Json         @default("{}")
  status      PartyStatus  @default(WAITING)
  
  tracks      Track[]
  members     Membership[]
  playlists   GeneratedPlaylist[]
  
  startedAt   DateTime?
  endedAt     DateTime?
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt
  
  @@index([code])
  @@index([hostId])
  @@index([status])
}

enum PartyStatus {
  WAITING
  ACTIVE
  PAUSED
  ENDED
}

model Membership {
  id        String   @id @default(cuid())
  userId    String
  partyId   String
  role      String   @default("guest")
  
  joinedAt  DateTime @default(now())
  leftAt    DateTime?
  
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  party     Party    @relation(fields: [partyId], references: [id], onDelete: Cascade)
  
  @@unique([userId, partyId])
  @@index([partyId])
  @@index([userId])
}

model Track {
  id          String    @id @default(cuid())
  partyId     String
  
  isrc        String?
  spotifyId   String?
  appleId     String?
  lastfmId    String?
  
  title       String
  artist      String
  album       String?
  duration    Int?
  imageUrl    String?
  previewUrl  String?
  
  energy      Float?    @default(0.5)
  danceability Float?   @default(0.5)
  valence     Float?    @default(0.5)
  tempo       Float?
  
  position    Int
  addedById   String?
  source      String?
  
  playedAt    DateTime?
  skippedAt   DateTime?
  
  createdAt   DateTime  @default(now())
  
  party       Party     @relation(fields: [partyId], references: [id], onDelete: Cascade)
  addedBy     User?     @relation(fields: [addedById], references: [id])
  votes       Vote[]
  
  @@unique([partyId, position])
  @@index([partyId])
}

model Vote {
  id        String   @id @default(cuid())
  userId    String
  trackId   String
  type      String
  
  createdAt DateTime @default(now())
  
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  track     Track    @relation(fields: [trackId], references: [id], onDelete: Cascade)
  
  @@unique([userId, trackId])
  @@index([trackId])
  @@index([userId])
}

model GeneratedPlaylist {
  id          String   @id @default(cuid())
  partyId     String
  
  name        String
  description String?
  
  spotifyId   String?
  appleId     String?
  
  tracks      Json
  
  exportedAt  DateTime?
  createdAt   DateTime @default(now())
  
  party       Party    @relation(fields: [partyId], references: [id], onDelete: Cascade)
  
  @@index([partyId])
}
EOF

# Database index file
cat > packages/database/src/index.ts << 'EOF'
export * from '@prisma/client';
export { prisma } from './client';
EOF

# Prisma client
cat > packages/database/src/client.ts << 'EOF'
import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
EOF

# Database tsconfig
cat > packages/database/tsconfig.json << 'EOF'
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
EOF

echo -e "${GREEN}✓ Step 2 Complete!${NC}"
echo ""
echo "Database package created with:"
echo "  ✓ Prisma schema (all models)"
echo "  ✓ Database client"
echo "  ✓ Package configuration"
echo ""
echo -e "${YELLOW}Status Check:${NC}"
ls -la packages/database/
echo ""
echo -e "${BLUE}Next: Run ./step3-nextjs-app.sh${NC}"

