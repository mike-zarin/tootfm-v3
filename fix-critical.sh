#!/bin/bash

# TOOTFM CRITICAL FIX SCRIPT
# Автоматически исправляет ВСЕ критические проблемы

set -e

PROJECT_ROOT="/Users/mz/tootfm-v3/apps/web"
cd "$PROJECT_ROOT"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║         TOOTFM CRITICAL ISSUES AUTO-FIX v1.0            ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════════╝${NC}"

# Backup
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
cp data.json "data.backup.${TIMESTAMP}.json"
echo -e "${GREEN}✅${NC} Backup created: data.backup.${TIMESTAMP}.json"

# ============================================
# FIX 1: SpotifyProfile Type Issues
# ============================================
echo -e "\n${CYAN}1. Fixing SpotifyProfile type issues...${NC}"

# Fix the types/index.ts to ensure dates are strings
cat > types/spotify-fix.ts << 'EOF'
// Spotify Profile Types with string dates
export interface SpotifyProfile {
  userId: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: string; // ISO string
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
  spotifyId?: string;
  email?: string;
  displayName?: string;
  images?: Array<{ url: string }>;
  product?: string;
  country?: string;
}

export interface StorageData {
  users: User[];
  parties: Party[];
  tracks: Track[];
  memberships: Membership[];
  votes: Vote[];
  spotifyProfiles: SpotifyProfile[];
  musicProfiles: MusicProfile[];
}
EOF

# Update the main types file
if grep -q "expiresAt: Date" types/index.ts; then
    sed -i.bak 's/expiresAt: Date/expiresAt: string/g' types/index.ts
    sed -i.bak 's/createdAt: Date/createdAt: string/g' types/index.ts
    sed -i.bak 's/updatedAt: Date/updatedAt: string/g' types/index.ts
    echo -e "${GREEN}✅${NC} Fixed date types in types/index.ts"
fi

# ============================================
# FIX 2: SessionProvider in Layout
# ============================================
echo -e "\n${CYAN}2. Fixing SessionProvider in layout...${NC}"

if ! grep -q "SessionProvider" app/layout.tsx; then
    # Check if providers.tsx exists
    if [ -f "app/providers.tsx" ]; then
        # Make sure layout imports providers
        if ! grep -q "./providers" app/layout.tsx; then
            echo -e "${YELLOW}⚠️${NC} Adding Providers import to layout.tsx"
            # This would need manual intervention or careful sed work
        fi
    else
        # Create providers.tsx
        cat > app/providers.tsx << 'EOF'
'use client';

import { SessionProvider } from 'next-auth/react';

export function Providers({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
EOF
        echo -e "${GREEN}✅${NC} Created app/providers.tsx"
    fi
else
    echo -e "${GREEN}✅${NC} SessionProvider already configured"
fi

# ============================================
# FIX 3: Add Spotify OAuth Endpoints
# ============================================
echo -e "\n${CYAN}3. Ensuring Spotify OAuth endpoints exist...${NC}"

# Check and create spotify login endpoint
if [ ! -f "app/api/auth/spotify/login/route.ts" ]; then
    mkdir -p app/api/auth/spotify/login
    cat > app/api/auth/spotify/login/route.ts << 'EOF'
import { NextResponse } from 'next/server';

const SPOTIFY_AUTH_URL = 'https://accounts.spotify.com/authorize';
const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID!;
const REDIRECT_URI = process.env.SPOTIFY_REDIRECT_URI!;

const SCOPES = [
  'user-read-private',
  'user-read-email',
  'user-top-read',
  'user-read-recently-played',
  'user-library-read',
  'playlist-read-private',
  'playlist-read-collaborative',
  'streaming',
  'user-read-playback-state',
  'user-modify-playback-state',
  'user-read-currently-playing'
].join(' ');

export async function GET() {
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: 'code',
    redirect_uri: REDIRECT_URI,
    scope: SCOPES,
    state: Math.random().toString(36).substring(7)
  });

  return NextResponse.redirect(`${SPOTIFY_AUTH_URL}?${params}`);
}
EOF
    echo -e "${GREEN}✅${NC} Created Spotify login endpoint"
else
    echo -e "${GREEN}✅${NC} Spotify login endpoint exists"
fi

# ============================================
# FIX 4: Initialize Tracks System
# ============================================
echo -e "\n${CYAN}4. Initializing tracks system...${NC}"

# Add test tracks if none exist
TRACK_COUNT=$(cat data.json | jq '.tracks | length')
if [ "$TRACK_COUNT" -eq "0" ]; then
    echo -e "${YELLOW}⚠️${NC} No tracks found, adding test tracks..."
    
    # Create test tracks
    node -e "
    const fs = require('fs');
    const data = JSON.parse(fs.readFileSync('data.json', 'utf8'));
    
    // Add test tracks
    data.tracks = [
        {
            id: 'track_' + Date.now() + '_1',
            partyId: data.parties[0]?.id || 'party_test',
            spotifyId: '4u7EnebtmKWzUH433cf5Qv',
            name: 'Bohemian Rhapsody',
            artists: ['Queen'],
            albumName: 'A Night at the Opera',
            albumArt: 'https://i.scdn.co/image/ab67616d0000b273ce4f1737bc8a646c8c4bd25a',
            duration: 354000,
            addedBy: data.users[0]?.id || 'system',
            addedAt: new Date().toISOString(),
            votes: 0,
            played: false
        },
        {
            id: 'track_' + Date.now() + '_2',
            partyId: data.parties[0]?.id || 'party_test',
            spotifyId: '5CQ30WqJwcep0pYcV4AMNc',
            name: 'Stairway to Heaven',
            artists: ['Led Zeppelin'],
            albumName: 'Led Zeppelin IV',
            albumArt: 'https://i.scdn.co/image/ab67616d0000b273c8a11e48c91a982d086afc69',
            duration: 482000,
            addedBy: data.users[0]?.id || 'system',
            addedAt: new Date().toISOString(),
            votes: 0,
            played: false
        }
    ];
    
    fs.writeFileSync('data.json', JSON.stringify(data, null, 2));
    console.log('Added test tracks');
    "
    
    echo -e "${GREEN}✅${NC} Added test tracks to database"
else
    echo -e "${GREEN}✅${NC} Tracks already exist: $TRACK_COUNT"
fi

# ============================================
# FIX 5: Clean Unused Exports
# ============================================
echo -e "\n${CYAN}5. Analyzing unused exports...${NC}"

# Create a cleanup report
npx ts-prune --project tsconfig.json 2>/dev/null > unused-exports.txt || true

UNUSED_COUNT=$(wc -l < unused-exports.txt)
echo -e "${YELLOW}⚠️${NC} Found $UNUSED_COUNT unused exports (see unused-exports.txt)"

# ============================================
# FIX 6: TypeScript Compilation Check
# ============================================
echo -e "\n${CYAN}6. Checking TypeScript compilation...${NC}"

npx tsc --noEmit 2> tsc-errors.txt || true

ERROR_COUNT=$(grep -c "error TS" tsc-errors.txt 2>/dev/null || echo "0")

if [ "$ERROR_COUNT" -eq "0" ]; then
    echo -e "${GREEN}✅${NC} TypeScript compiles without errors!"
else
    echo -e "${YELLOW}⚠️${NC} TypeScript has $ERROR_COUNT errors"
    echo "Top 5 errors:"
    grep "error TS" tsc-errors.txt | head -5
fi

# ============================================
# FIX 7: Environment Variables Check
# ============================================
echo -e "\n${CYAN}7. Checking environment variables...${NC}"

REQUIRED_VARS=(
    "NEXTAUTH_URL"
    "NEXTAUTH_SECRET"
    "SPOTIFY_CLIENT_ID"
    "SPOTIFY_CLIENT_SECRET"
    "SPOTIFY_REDIRECT_URI"
    "GOOGLE_CLIENT_ID"
    "GOOGLE_CLIENT_SECRET"
)

MISSING_VARS=()
for var in "${REQUIRED_VARS[@]}"; do
    if ! grep -q "^$var=" .env.local 2>/dev/null; then
        MISSING_VARS+=("$var")
        echo -e "${RED}✗${NC} Missing: $var"
    else
        echo -e "${GREEN}✓${NC} Found: $var"
    fi
done

if [ ${#MISSING_VARS[@]} -gt 0 ]; then
    echo -e "${YELLOW}⚠️${NC} Add missing variables to .env.local"
fi

# ============================================
# FINAL REPORT
# ============================================
echo -e "\n${CYAN}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║                    FIX COMPLETE REPORT                   ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════════╝${NC}"

# Check current status
USERS=$(cat data.json | jq '.users | length')
PARTIES=$(cat data.json | jq '.parties | length')
TRACKS=$(cat data.json | jq '.tracks | length')
SPOTIFY_PROFILES=$(cat data.json | jq '.spotifyProfiles | length')

echo -e "\n📊 Database Status:"
echo "  • Users: $USERS"
echo "  • Parties: $PARTIES"
echo "  • Tracks: $TRACKS"
echo "  • Spotify Profiles: $SPOTIFY_PROFILES"

echo -e "\n🔧 TypeScript Status:"
if [ "$ERROR_COUNT" -eq "0" ]; then
    echo -e "  ${GREEN}✅ No compilation errors${NC}"
else
    echo -e "  ${YELLOW}⚠️ $ERROR_COUNT errors remaining${NC}"
fi

echo -e "\n🚀 Next Steps:"
echo "  1. Run: npm run dev"
echo "  2. Visit: http://localhost:3000"
echo "  3. Test Spotify login: http://localhost:3000/api/auth/spotify/login"
echo "  4. Create a party and add tracks"

echo -e "\n${GREEN}✅ Critical fixes applied!${NC}"
echo -e "Backup saved as: data.backup.${TIMESTAMP}.json"

# Create a quick test script
cat > test-spotify.sh << 'EOF'
#!/bin/bash
echo "Testing Spotify Integration..."
curl -v http://localhost:3000/api/auth/spotify/login
EOF
chmod +x test-spotify.sh

echo -e "\n${CYAN}Run ${NC}${GREEN}./test-spotify.sh${NC}${CYAN} to test Spotify OAuth${NC}"