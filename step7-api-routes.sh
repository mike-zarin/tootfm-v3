#!/bin/bash

# step7-api-routes.sh - API Routes Setup
# CTO: RESTful API для parties, tracks, voting

set -e

echo "🚀 Step 7: Creating API Routes"
echo "==============================="

# Create API structure
mkdir -p apps/web/app/api/{parties,music,health}
mkdir -p apps/web/lib

# 1. Health check endpoint
echo "💚 Creating health check API..."
cat > apps/web/app/api/health/route.ts << 'EOF'
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'tootfm-api',
    version: '0.1.0'
  });
}
EOF

# 2. Party CRUD endpoints
echo "🎉 Creating parties API route..."
cat > apps/web/app/api/parties/route.ts << 'EOF'
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authConfig } from '@tootfm/auth';
import { prisma } from '@tootfm/database';
import { z } from 'zod';

const createPartySchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  settings: z.object({
    maxTracks: z.number().min(10).max(200).default(50),
    autoPlay: z.boolean().default(true),
    allowRequests: z.boolean().default(false)
  }).optional()
});

// GET /api/parties - Get user's parties
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const [hosted, joined] = await Promise.all([
      prisma.party.findMany({
        where: {
          hostId: session.user.id,
          status: { in: ['WAITING', 'ACTIVE', 'PAUSED'] }
        },
        include: {
          _count: {
            select: { members: true, tracks: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      }),
      prisma.membership.findMany({
        where: {
          userId: session.user.id,
          party: {
            status: { in: ['WAITING', 'ACTIVE', 'PAUSED'] }
          }
        },
        include: {
          party: {
            include: {
              host: { select: { name: true, image: true } },
              _count: {
                select: { members: true, tracks: true }
              }
            }
          }
        },
        orderBy: { joinedAt: 'desc' },
        take: 10
      })
    ]);
    
    return NextResponse.json({
      hosted,
      joined: joined.map(m => m.party)
    });
  } catch (error) {
    console.error('Error fetching parties:', error);
    return NextResponse.json({ error: 'Failed to fetch parties' }, { status: 500 });
  }
}

// POST /api/parties - Create new party
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    const validatedData = createPartySchema.parse(body);
    
    // Generate unique 6-char code
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    const party = await prisma.party.create({
      data: {
        code,
        name: validatedData.name,
        description: validatedData.description,
        hostId: session.user.id,
        settings: validatedData.settings || {
          maxTracks: 50,
          autoPlay: true,
          allowRequests: false
        },
        status: 'WAITING',
        members: {
          create: {
            userId: session.user.id,
            role: 'host'
          }
        }
      }
    });
    
    return NextResponse.json(party, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create party' }, { status: 500 });
  }
}
EOF

# 3. Join party endpoint
echo "🤝 Creating join party API..."
mkdir -p apps/web/app/api/parties/join
cat > apps/web/app/api/parties/join/route.ts << 'EOF'
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authConfig } from '@tootfm/auth';
import { prisma } from '@tootfm/database';
import { z } from 'zod';

const joinPartySchema = z.object({
  code: z.string().length(6).toUpperCase()
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    const { code } = joinPartySchema.parse(body);
    
    const party = await prisma.party.findUnique({
      where: { code },
      include: {
        members: { where: { userId: session.user.id } }
      }
    });
    
    if (!party) {
      return NextResponse.json({ error: 'Party not found' }, { status: 404 });
    }
    
    if (party.status === 'ENDED') {
      return NextResponse.json({ error: 'Party has ended' }, { status: 400 });
    }
    
    if (party.members.length === 0) {
      await prisma.membership.create({
        data: {
          userId: session.user.id,
          partyId: party.id,
          role: 'guest'
        }
      });
    }
    
    return NextResponse.json(party);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid party code' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to join party' }, { status: 500 });
  }
}
EOF

# 4. Music profiles endpoint
echo "🎵 Creating music profiles API..."
cat > apps/web/app/api/music/profiles/route.ts << 'EOF'
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authConfig } from '@tootfm/auth';
import { prisma } from '@tootfm/database';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const profiles = await prisma.musicProfile.findMany({
      where: { userId: session.user.id },
      select: {
        id: true,
        service: true,
        lastSyncedAt: true,
        topTracks: true,
        topArtists: true,
        topGenres: true
      }
    });
    
    return NextResponse.json(profiles);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch profiles' }, { status: 500 });
  }
}
EOF

# 5. Spotify OAuth callback
echo "🎧 Creating Spotify OAuth callback..."
mkdir -p apps/web/app/api/auth/spotify
cat > apps/web/app/api/auth/spotify/callback/route.ts << 'EOF'
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authConfig } from '@tootfm/auth';
import { MusicServiceFactory } from '@tootfm/music-api';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig);
    
    if (!session?.user?.id) {
      return NextResponse.redirect('/auth/signin');
    }
    
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    
    if (error) {
      return NextResponse.redirect('/profile?error=spotify_denied');
    }
    
    if (!code) {
      return NextResponse.redirect('/profile?error=no_code');
    }
    
    // Exchange code for tokens (simplified - needs actual implementation)
    const spotifyService = MusicServiceFactory.getService('spotify');
    
    // For now, just redirect back
    return NextResponse.redirect('/profile?connected=spotify');
  } catch (error) {
    console.error('Spotify callback error:', error);
    return NextResponse.redirect('/profile?error=callback_failed');
  }
}
EOF

# 6. API utilities
echo "🔧 Creating API utilities..."
cat > apps/web/lib/api-utils.ts << 'EOF'
import { NextResponse } from 'next/server';

export class ApiError extends Error {
  constructor(
    public message: string,
    public status: number = 500
  ) {
    super(message);
  }
}

export function handleApiError(error: unknown) {
  console.error('API Error:', error);
  
  if (error instanceof ApiError) {
    return NextResponse.json(
      { error: error.message },
      { status: error.status }
    );
  }
  
  if (error instanceof Error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
  
  return NextResponse.json(
    { error: 'An unexpected error occurred' },
    { status: 500 }
  );
}

export function requireAuth(session: any) {
  if (!session?.user?.id) {
    throw new ApiError('Unauthorized', 401);
  }
  return session.user;
}

export function generatePartyCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}
EOF

# 7. WebSocket connection helper (placeholder)
echo "🔌 Creating WebSocket helper..."
cat > apps/web/lib/websocket.ts << 'EOF'
// WebSocket helper for real-time features
// Will be implemented with Pusher or Socket.io

export class PartyWebSocket {
  private ws: WebSocket | null = null;
  private listeners: Map<string, Set<Function>> = new Map();
  
  connect(partyId: string) {
    // Placeholder for WebSocket connection
    console.log(`Connecting to party ${partyId}`);
  }
  
  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
  
  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)?.add(callback);
  }
  
  off(event: string, callback: Function) {
    this.listeners.get(event)?.delete(callback);
  }
  
  emit(event: string, data: any) {
    // Send event through WebSocket
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ event, data }));
    }
  }
}

export const partySocket = new PartyWebSocket();
EOF

echo ""
echo "✅ Step 7 Complete: API Routes created!"
echo ""
echo "📋 Created endpoints:"
echo "  - GET/POST /api/parties"
echo "  - POST /api/parties/join"
echo "  - GET /api/music/profiles"
echo "  - GET /api/auth/spotify/callback"
echo "  - GET /api/health"
echo ""
echo "🔧 Utilities:"
echo "  - API error handling"
echo "  - Auth helpers"
echo "  - WebSocket placeholder"
echo ""
echo "Ready for Step 8: React Components"
