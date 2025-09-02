#!/bin/bash

# apps/web/fix-project.sh
# Исправленный скрипт для применения всех фиксов

echo "═══════════════════════════════════════════════════════════════"
echo "            TOOTFM PROJECT FIXES                                "
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Проверяем что мы в правильной директории
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found"
    echo "Please run this script from apps/web directory"
    echo "Current directory: $(pwd)"
    exit 1
fi

echo "📍 Working directory: $(pwd)"
echo ""

# Создаем директорию для бэкапов
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR=".backups/$TIMESTAMP"
mkdir -p "$BACKUP_DIR"

echo "📦 Creating backups in $BACKUP_DIR..."

# Бэкапим существующие файлы (используем find чтобы избежать проблем с квадратными скобками)
if [ -f "lib/storage.ts" ]; then
    cp lib/storage.ts "$BACKUP_DIR/storage.ts.bak"
    echo "  ✓ Backed up lib/storage.ts"
fi

# Для [...nextauth] используем find
AUTH_FILE=$(find app/api/auth -name "route.ts" -path "*nextauth*" 2>/dev/null | head -1)
if [ -n "$AUTH_FILE" ] && [ -f "$AUTH_FILE" ]; then
    cp "$AUTH_FILE" "$BACKUP_DIR/nextauth-route.ts.bak"
    echo "  ✓ Backed up auth route.ts"
fi

if [ -f "types/index.ts" ]; then
    cp types/index.ts "$BACKUP_DIR/types-index.ts.bak"
    echo "  ✓ Backed up types/index.ts"
fi

echo ""
echo "🔧 Applying fixes..."
echo ""

# 1. Исправляем storage.ts
echo "1️⃣ Updating lib/storage.ts..."
cat > lib/storage-new.ts << 'STORAGE_EOF'
// apps/web/lib/storage.ts

import { promises as fs } from 'fs';
import path from 'path';
import { User, Party, Track, Membership, Vote, MusicProfile } from '@/types';

interface StorageData {
  users: User[];
  parties: Party[];
  tracks: Track[];
  memberships: Membership[];
  votes?: Vote[];
  musicProfiles?: MusicProfile[];
}

class Storage {
  private filePath: string;

  constructor() {
    this.filePath = path.join(process.cwd(), 'data.json');
  }

  async read(): Promise<StorageData> {
    try {
      const data = await fs.readFile(this.filePath, 'utf-8');
      const parsed = JSON.parse(data);
      
      if (!parsed.votes) parsed.votes = [];
      if (!parsed.musicProfiles) parsed.musicProfiles = [];
      
      return parsed;
    } catch (error) {
      console.log('Creating new data.json file at:', this.filePath);
      const emptyData: StorageData = {
        users: [],
        parties: [],
        tracks: [],
        memberships: [],
        votes: [],
        musicProfiles: []
      };
      await this.write(emptyData);
      return emptyData;
    }
  }

  async write(data: StorageData): Promise<void> {
    try {
      await fs.writeFile(this.filePath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Error writing to storage:', error);
      throw error;
    }
  }

  async getUsers(): Promise<User[]> {
    const data = await this.read();
    return data.users || [];
  }

  async getUser(id: string): Promise<User | undefined> {
    const data = await this.read();
    return data.users?.find(u => u.id === id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const data = await this.read();
    return data.users?.find(u => u.email === email);
  }

  async createUser(user: User): Promise<User> {
    const data = await this.read();
    if (!data.users) data.users = [];
    data.users.push(user);
    await this.write(data);
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | null> {
    const data = await this.read();
    if (!data.users) return null;
    const index = data.users.findIndex(u => u.id === id);
    if (index === -1) return null;
    
    data.users[index] = { ...data.users[index], ...updates, updatedAt: new Date().toISOString() };
    await this.write(data);
    return data.users[index];
  }

  async getParties(): Promise<Party[]> {
    const data = await this.read();
    return data.parties || [];
  }

  async getParty(id: string): Promise<Party | undefined> {
    const data = await this.read();
    return data.parties?.find(p => p.id === id);
  }

  async findPartyById(id: string): Promise<Party | undefined> {
    return this.getParty(id);
  }

  async getPartyByCode(code: string): Promise<Party | undefined> {
    const data = await this.read();
    return data.parties?.find(p => p.code === code);
  }

  async createParty(party: Party): Promise<Party> {
    const data = await this.read();
    if (!data.parties) data.parties = [];
    
    if (!party.id) {
      party.id = `party_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    party.createdAt = party.createdAt || new Date().toISOString();
    party.updatedAt = party.updatedAt || new Date().toISOString();
    
    data.parties.push(party);
    
    if (!data.memberships) data.memberships = [];
    data.memberships.push({
      id: `membership_${Date.now()}`,
      userId: party.hostId,
      partyId: party.id,
      role: 'host',
      joinedAt: new Date().toISOString()
    });
    
    await this.write(data);
    return party;
  }

  async updateParty(id: string, updates: Partial<Party>): Promise<Party | null> {
    const data = await this.read();
    if (!data.parties) return null;
    const index = data.parties.findIndex(p => p.id === id);
    if (index === -1) return null;
    
    data.parties[index] = { ...data.parties[index], ...updates, updatedAt: new Date().toISOString() };
    await this.write(data);
    return data.parties[index];
  }

  async getMemberships(): Promise<Membership[]> {
    const data = await this.read();
    return data.memberships || [];
  }

  async createMembership(membership: Membership): Promise<Membership> {
    const data = await this.read();
    if (!data.memberships) data.memberships = [];
    
    const existing = data.memberships.find(m => 
      m.userId === membership.userId && m.partyId === membership.partyId
    );
    
    if (existing) return existing;
    
    data.memberships.push(membership);
    await this.write(data);
    return membership;
  }

  async getMembership(userId: string, partyId: string): Promise<Membership | undefined> {
    const data = await this.read();
    return data.memberships?.find(m => m.userId === userId && m.partyId === partyId);
  }

  async getPartyMembers(partyId: string): Promise<Array<{ userId: string; role: string; user?: User }>> {
    const data = await this.read();
    const memberships = data.memberships?.filter(m => m.partyId === partyId) || [];
    
    return memberships.map(m => ({
      userId: m.userId,
      role: m.role,
      user: data.users?.find(u => u.id === m.userId)
    }));
  }

  async getTracks(partyId: string): Promise<Track[]> {
    const data = await this.read();
    return data.tracks?.filter(t => t.partyId === partyId) || [];
  }

  async createTrack(track: Track): Promise<Track> {
    const data = await this.read();
    if (!data.tracks) data.tracks = [];
    
    if (!track.id) {
      track.id = `track_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    if (track.position === undefined) {
      const partyTracks = data.tracks.filter(t => t.partyId === track.partyId);
      track.position = partyTracks.length;
    }
    
    track.createdAt = track.createdAt || new Date().toISOString();
    
    data.tracks.push(track);
    await this.write(data);
    return track;
  }

  async updateTrack(id: string, updates: Partial<Track>): Promise<Track | null> {
    const data = await this.read();
    if (!data.tracks) return null;
    const index = data.tracks.findIndex(t => t.id === id);
    if (index === -1) return null;
    
    data.tracks[index] = { ...data.tracks[index], ...updates };
    await this.write(data);
    return data.tracks[index];
  }

  async deleteTrack(id: string): Promise<boolean> {
    const data = await this.read();
    if (!data.tracks) return false;
    
    const initialLength = data.tracks.length;
    data.tracks = data.tracks.filter(t => t.id !== id);
    
    if (data.tracks.length < initialLength) {
      await this.write(data);
      return true;
    }
    return false;
  }

  async getVotes(trackId: string): Promise<Vote[]> {
    const data = await this.read();
    return data.votes?.filter(v => v.trackId === trackId) || [];
  }

  async createVote(vote: Vote): Promise<Vote> {
    const data = await this.read();
    if (!data.votes) data.votes = [];
    
    data.votes = data.votes.filter(v => 
      !(v.userId === vote.userId && v.trackId === vote.trackId)
    );
    
    if (!vote.id) {
      vote.id = `vote_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    vote.createdAt = vote.createdAt || new Date().toISOString();
    
    data.votes.push(vote);
    await this.write(data);
    return vote;
  }

  async getMusicProfiles(userId: string): Promise<MusicProfile[]> {
    const data = await this.read();
    return data.musicProfiles?.filter(p => p.userId === userId) || [];
  }

  async getMusicProfile(userId: string, service: string): Promise<MusicProfile | undefined> {
    const data = await this.read();
    return data.musicProfiles?.find(p => p.userId === userId && p.service === service);
  }

  async createMusicProfile(profile: MusicProfile): Promise<MusicProfile> {
    const data = await this.read();
    if (!data.musicProfiles) data.musicProfiles = [];
    
    data.musicProfiles = data.musicProfiles.filter(p => 
      !(p.userId === profile.userId && p.service === profile.service)
    );
    
    if (!profile.id) {
      profile.id = `music_profile_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    profile.createdAt = profile.createdAt || new Date().toISOString();
    profile.updatedAt = profile.updatedAt || new Date().toISOString();
    
    data.musicProfiles.push(profile);
    await this.write(data);
    return profile;
  }

  async updateMusicProfile(id: string, updates: Partial<MusicProfile>): Promise<MusicProfile | null> {
    const data = await this.read();
    if (!data.musicProfiles) return null;
    const index = data.musicProfiles.findIndex(p => p.id === id);
    if (index === -1) return null;
    
    data.musicProfiles[index] = { 
      ...data.musicProfiles[index], 
      ...updates, 
      updatedAt: new Date().toISOString() 
    };
    await this.write(data);
    return data.musicProfiles[index];
  }

  async getUserParties(emailOrId: string): Promise<{ hosted: Party[], joined: Party[] }> {
    const data = await this.read();
    
    const user = data.users?.find(u => u.id === emailOrId || u.email === emailOrId);
    const userId = user?.id || emailOrId;
    
    const hosted = data.parties?.filter(p => p.hostId === userId) || [];
    
    const membershipPartyIds = data.memberships
      ?.filter(m => m.userId === userId && m.role !== 'host')
      ?.map(m => m.partyId) || [];
    
    const joined = data.parties?.filter(p => membershipPartyIds.includes(p.id)) || [];
    
    return { hosted, joined };
  }

  async getPartyMemberCount(partyId: string): Promise<number> {
    const data = await this.read();
    return data.memberships?.filter(m => m.partyId === partyId).length || 0;
  }

  async getPartyTrackCount(partyId: string): Promise<number> {
    const data = await this.read();
    return data.tracks?.filter(t => t.partyId === partyId).length || 0;
  }

  async generateUniquePartyCode(): Promise<string> {
    const data = await this.read();
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code: string;
    let attempts = 0;
    
    do {
      code = '';
      for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      attempts++;
      
      if (attempts > 100) {
        throw new Error('Could not generate unique party code');
      }
    } while (data.parties?.some(p => p.code === code));
    
    return code;
  }
}

export const storage = new Storage();

export const getUserParties = storage.getUserParties.bind(storage);
export const getPartyMemberCount = storage.getPartyMemberCount.bind(storage);
export const getPartyTrackCount = storage.getPartyTrackCount.bind(storage);
export const generateUniquePartyCode = storage.generateUniquePartyCode.bind(storage);
export const findPartyByCode = storage.getPartyByCode.bind(storage);
export const findPartyById = storage.findPartyById.bind(storage);
export const getPartyMembers = storage.getPartyMembers.bind(storage);
export const createParty = storage.createParty.bind(storage);
export const readData = storage.read.bind(storage);

export const joinParty = async (partyId: string, userId: string) => {
  const membership: Membership = {
    id: `membership_${Date.now()}`,
    userId,
    partyId,
    role: 'guest',
    joinedAt: new Date().toISOString()
  };
  return storage.createMembership(membership);
};
STORAGE_EOF

mv lib/storage-new.ts lib/storage.ts
echo "  ✅ Updated lib/storage.ts"

# 2. Исправляем NextAuth route
echo "2️⃣ Updating NextAuth route..."

# Создаем временный файл
cat > auth-route-temp.ts << 'AUTH_EOF'
// apps/web/app/api/auth/[...nextauth]/route.ts

import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import SpotifyProvider from "next-auth/providers/spotify";
import { JWT } from "next-auth/jwt";
import { Session, User } from "next-auth";
import { storage } from "@/lib/storage";

const SPOTIFY_SCOPES = [
  "user-read-email",
  "user-read-private",
  "user-top-read",
  "user-read-recently-played",
  "user-library-read",
  "user-read-playback-state",
  "user-modify-playback-state",
  "user-read-currently-playing",
  "playlist-read-private",
  "playlist-read-collaborative",
  "streaming"
].join(" ");

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    SpotifyProvider({
      clientId: process.env.SPOTIFY_CLIENT_ID!,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET!,
      authorization: {
        url: "https://accounts.spotify.com/authorize",
        params: {
          scope: SPOTIFY_SCOPES,
          show_dialog: true,
        },
      },
    }),
  ],
  
  callbacks: {
    async signIn({ user, account, profile }) {
      if (!user.email) return false;
      
      try {
        let dbUser = await storage.getUserByEmail(user.email);
        
        if (!dbUser) {
          const userId = account?.providerAccountId || `user_${Date.now()}`;
          
          dbUser = await storage.createUser({
            id: userId,
            email: user.email,
            name: user.name || "User",
            image: user.image || null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
        }
        
        if (account?.provider === 'spotify' && account.access_token) {
          await storage.createMusicProfile({
            id: `spotify_${dbUser.id}`,
            service: 'spotify',
            userId: dbUser.id,
            accessToken: account.access_token,
            refreshToken: account.refresh_token || '',
            expiresAt: new Date(Date.now() + (account.expires_at || 3600) * 1000).toISOString(),
            spotifyId: account.providerAccountId,
            email: user.email || '',
            displayName: user.name || '',
            topTracks: [],
            topArtists: [],
            lastSyncedAt: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
        }
        
        return true;
      } catch (error) {
        console.error('Error in signIn callback:', error);
        return false;
      }
    },
    
    async jwt({ token, account, user, profile }) {
      if (account && user) {
        let dbUser = await storage.getUserByEmail(user.email!);
        
        if (!dbUser && user.email) {
          const userId = account.providerAccountId || `user_${Date.now()}`;
          dbUser = await storage.createUser({
            id: userId,
            email: user.email,
            name: user.name || "User",
            image: user.image || null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
        }
        
        token.id = dbUser?.id || account.providerAccountId;
        token.email = user.email;
        token.name = user.name;
        token.picture = user.image;
        token.provider = account.provider;
        
        if (account.provider === 'spotify') {
          token.spotifyAccessToken = account.access_token;
          token.spotifyRefreshToken = account.refresh_token;
          token.spotifyExpiresAt = account.expires_at;
          token.spotifyId = account.providerAccountId;
        }
      }
      
      return token;
    },
    
    async session({ session, token }: { session: Session; token: JWT }) {
      if (session.user) {
        (session.user as any).id = token.id || token.sub;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.image = token.picture as string;
      }
      
      if (token.spotifyAccessToken) {
        (session as any).spotifyTokens = {
          accessToken: token.spotifyAccessToken,
          refreshToken: token.spotifyRefreshToken,
          expiresAt: token.spotifyExpiresAt,
          spotifyId: token.spotifyId
        };
      }
      
      (session as any).provider = token.provider;
      
      return session;
    },
  },
  
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60,
  },
  
  debug: process.env.NODE_ENV === 'development',
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
AUTH_EOF

# Находим и обновляем файл правильно
if [ -n "$AUTH_FILE" ]; then
    cp auth-route-temp.ts "$AUTH_FILE"
    echo "  ✅ Updated $AUTH_FILE"
else
    # Если не нашли через find, пробуем напрямую
    AUTH_DIR="app/api/auth/[...nextauth]"
    if [ -d "$AUTH_DIR" ]; then
        cp auth-route-temp.ts "$AUTH_DIR/route.ts"
        echo "  ✅ Updated $AUTH_DIR/route.ts"
    else
        echo "  ⚠️  Could not find auth route file"
    fi
fi
rm auth-route-temp.ts

# 3. Обновляем types/index.ts
echo "3️⃣ Updating types/index.ts..."
cat > types/index.ts << 'TYPES_EOF'
// apps/web/types/index.ts

export interface User {
  id: string;
  email: string;
  name: string;
  image: string | null;
  createdAt: string;
  updatedAt: string;
  musicProfiles?: MusicProfile[];
}

export interface MusicProfile {
  id: string;
  service: "spotify" | "apple" | "lastfm";
  userId: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  spotifyId?: string;
  email?: string;
  displayName?: string;
  topTracks: SpotifyTrack[];
  topArtists: SpotifyArtist[];
  lastSyncedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SpotifyTrack {
  id: string;
  name: string;
  artist: string;
  artists: string[];
  album: string;
  duration: number;
  isrc?: string;
  spotifyId: string;
  imageUrl?: string;
  previewUrl?: string;
  popularity: number;
  uri: string;
}

export interface SpotifyArtist {
  id: string;
  name: string;
  genres: string[];
  popularity: number;
  imageUrl?: string;
}

export interface Party {
  id: string;
  code: string;
  name: string;
  description?: string;
  hostId: string;
  hostName?: string;
  hostImage?: string | null;
  status: "WAITING" | "ACTIVE" | "PAUSED" | "ENDED";
  settings: {
    maxTracks?: number;
    autoPlay?: boolean;
    votingEnabled?: boolean;
    skipThreshold?: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Track {
  id: string;
  partyId: string;
  position: number;
  title: string;
  artist: string;
  album?: string;
  duration?: number;
  isrc?: string;
  spotifyId?: string;
  imageUrl?: string;
  previewUrl?: string;
  addedById?: string;
  addedByName?: string;
  playedAt?: string;
  createdAt: string;
}

export interface Membership {
  id: string;
  userId: string;
  partyId: string;
  role: "host" | "dj" | "guest";
  joinedAt: string;
  leftAt?: string;
}

export interface Vote {
  id: string;
  userId: string;
  trackId: string;
  type: "up" | "down" | "skip";
  createdAt: string;
}

export interface CreatePartyRequest {
  name: string;
  description?: string;
  settings?: {
    maxTracks?: number;
    autoPlay?: boolean;
    votingEnabled?: boolean;
    skipThreshold?: number;
  };
}

export interface JoinPartyRequest {
  code: string;
}

export interface JoinPartyResponse {
  success: boolean;
  id: string;
  message: string;
}

export interface PartyWithCounts extends Party {
  members: number;
  tracks: number;
}

export interface AddTrackRequest {
  partyId: string;
  spotifyId: string;
  title: string;
  artist: string;
  album?: string;
  duration?: number;
  imageUrl?: string;
  previewUrl?: string;
}

export interface VoteRequest {
  trackId: string;
  type: "up" | "down" | "skip";
}

export interface SearchTracksRequest {
  query: string;
  limit?: number;
}

export interface SearchTracksResponse {
  tracks: SpotifyTrack[];
}

export type PartyStatus = "WAITING" | "ACTIVE" | "PAUSED" | "ENDED";
export type MemberRole = "host" | "dj" | "guest";
export type VoteType = "up" | "down" | "skip";
export type MusicService = "spotify" | "apple" | "lastfm";
TYPES_EOF

echo "  ✅ Updated types/index.ts"

# 4. Создаем типы для NextAuth
echo "4️⃣ Creating types/next-auth.d.ts..."
cat > types/next-auth.d.ts << 'NEXTAUTH_EOF'
// apps/web/types/next-auth.d.ts

import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      image: string;
    } & DefaultSession["user"];
    spotifyTokens?: {
      accessToken: string;
      refreshToken: string;
      expiresAt: number;
      spotifyId: string;
    };
    provider?: string;
  }
  
  interface User {
    id: string;
    email: string;
    name?: string | null;
    image?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    email?: string;
    name?: string;
    picture?: string;
    provider?: string;
    spotifyAccessToken?: string;
    spotifyRefreshToken?: string;
    spotifyExpiresAt?: number;
    spotifyId?: string;
  }
}
NEXTAUTH_EOF

echo "  ✅ Created types/next-auth.d.ts"

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "✅ All fixes applied successfully!"
echo ""
echo "📁 Backups saved in: $BACKUP_DIR"
echo ""
echo "Next steps:"
echo "1. Run './check-project.sh' to verify fixes"
echo "2. Run 'npm run dev' to start the development server"
echo ""
echo "═══════════════════════════════════════════════════════════════"

