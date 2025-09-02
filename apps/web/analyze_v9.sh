#!/bin/bash

# ═══════════════════════════════════════════════════════════════════════════════
#                    🎵 TOOTFM COMPLETE ANALYSIS v9.0 🎵
# ═══════════════════════════════════════════════════════════════════════════════
# Purpose: Generate complete context for new chat session
# Focus: Music functionality implementation status
# ═══════════════════════════════════════════════════════════════════════════════

PROJECT_ROOT="/Users/mz/tootfm-v3"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
REPORT_DIR="$PROJECT_ROOT/audit-reports"
CONTEXT_FILE="$REPORT_DIR/context_for_new_chat_${TIMESTAMP}.md"
ANALYSIS_FILE="$REPORT_DIR/analysis_${TIMESTAMP}.txt"

# Create reports directory
mkdir -p "$REPORT_DIR"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

# ═══════════════════════════════════════════════════════════════════════════════
#                              START ANALYSIS
# ═══════════════════════════════════════════════════════════════════════════════

clear
echo -e "${BOLD}${CYAN}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BOLD}${CYAN}         TOOTFM PROJECT CONTEXT GENERATOR v9.0${NC}"
echo -e "${BOLD}${CYAN}═══════════════════════════════════════════════════════════════${NC}"
echo "Generating context for new chat session..."
echo ""

cd "$PROJECT_ROOT" || exit 1

# ═══════════════════════════════════════════════════════════════════════════════
#                        GENERATE CONTEXT FOR NEW CHAT
# ═══════════════════════════════════════════════════════════════════════════════

cat > "$CONTEXT_FILE" << 'CONTEXT_EOF'
# TootFM Project Context - Music Implementation Phase

## 🎯 Project Overview
TootFM is a democratic party DJ app where guests vote on music in real-time. Built with Next.js 14.2.5, TypeScript, and Spotify Web API.

## ✅ What's Working
1. **Authentication**: Google OAuth via NextAuth
2. **Party Management**: Create, join parties with unique codes
3. **Spotify OAuth**: Connect/disconnect flow working
4. **Data Storage**: JSON-based storage system
5. **UI Components**: Tailwind + shadcn/ui components

## 🏗️ Current Architecture

### Tech Stack
- **Frontend**: Next.js 14.2.5 (App Router), React 18, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui
- **Auth**: NextAuth.js with Google & Spotify providers
- **Storage**: JSON file (data.json) - no database
- **APIs**: Spotify Web API

### Project Structure
```
apps/web/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   ├── [...nextauth]/route.ts
│   │   │   └── spotify/
│   │   │       ├── connect/route.ts ✅
│   │   │       ├── callback/route.ts ✅
│   │   │       └── refresh/route.ts ✅
│   │   ├── parties/
│   │   │   ├── route.ts (GET, POST) ✅
│   │   │   ├── [id]/route.ts ✅
│   │   │   └── join/route.ts ✅
│   │   └── music/ (TO IMPLEMENT)
│   ├── party/
│   │   ├── page.tsx (list) ✅
│   │   ├── [id]/page.tsx (detail) ✅
│   │   ├── create/page.tsx ✅
│   │   └── join/page.tsx ✅
│   └── layout.tsx ✅
├── components/
│   ├── spotify/
│   │   └── SpotifyConnect.tsx ✅
│   └── tracks/ (TO CREATE)
├── lib/
│   ├── storage.ts ✅
│   ├── spotify.ts (helpers) ⚠️
│   └── auth-options.ts ✅
├── types/index.ts ✅
└── data.json ✅
```

### Data Structure (data.json)
```json
{
  "users": [],        // Google auth users
  "parties": [],      // Created parties
  "tracks": [],       // Queue tracks (TO IMPLEMENT)
  "memberships": [],  // Party members
  "votes": [],        // Track votes (TO IMPLEMENT)
  "spotifyProfiles": [] // Connected Spotify accounts with tokens
}
```

## 🎵 Music Features to Implement

### Phase 1: Track Search & Queue (PRIORITY)
- [ ] Track search component
- [ ] Search API endpoint using Spotify Web API
- [ ] Add tracks to party queue
- [ ] Display queue with album art

### Phase 2: Voting System
- [ ] Upvote/downvote UI
- [ ] Vote API endpoints
- [ ] Real-time vote updates
- [ ] Queue sorting by votes

### Phase 3: Playback Control
- [ ] Spotify Web Playback SDK integration
- [ ] Play/pause/skip controls
- [ ] Now playing display
- [ ] Sync between users

### Phase 4: Smart Features
- [ ] Auto-queue based on party vibe
- [ ] Skip track by vote threshold
- [ ] Party statistics
- [ ] Music taste profiles

## 🐛 Known Issues to Fix
1. **Duplicate parties**: Fixed membership creation duplication
2. **Member count**: Shows correct count now
3. **Spotify status**: Connected status persists correctly

## 🔑 Key Spotify Implementation Details

### Available Spotify Data
```javascript
// In spotifyProfiles:
{
  "id": "spotify_[userId]",
  "userId": "[googleUserId]",
  "accessToken": "...",  // Valid for 1 hour
  "refreshToken": "...",  // Use to get new access token
  "expiresAt": "2025-08-31T16:39:10.945Z",
  "spotifyId": "username",
  "displayName": "User Name",
  "product": "premium"  // Important for playback
}
```

### Spotify Scopes Configured
- user-read-private, user-read-email
- user-top-read, user-read-recently-played
- playlist-read-private
- streaming, user-modify-playback-state

## 📝 Implementation Priority

### Immediate (Today):
1. Create TrackSearch component
2. Implement /api/music/search endpoint
3. Create /api/parties/[id]/tracks POST endpoint
4. Display tracks in queue

### Next Steps:
1. Voting functionality
2. Real-time updates with Pusher/WebSockets
3. Spotify Web Playback SDK
4. Party statistics dashboard

## 🛠️ Helper Code Snippets

### Search Tracks (Spotify API)
```typescript
// lib/spotify.ts
export async function searchTracks(query: string, accessToken: string) {
  const response = await fetch(
    `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=10`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    }
  );
  
  if (response.status === 401) {
    // Token expired, need refresh
    throw new Error('TOKEN_EXPIRED');
  }
  
  return response.json();
}
```

### Add Track to Queue
```typescript
// In storage.ts
async createTrack(track: Track): Promise<Track> {
  const data = await this.read();
  if (!data.tracks) data.tracks = [];
  data.tracks.push(track);
  await this.write(data);
  return track;
}
```

## 🚀 Quick Start Commands
```bash
cd /Users/mz/tootfm-v3/apps/web
npm run dev  # Start dev server
npx tsc --noEmit  # Check TypeScript
```

## 📋 Environment Variables Set
- ✅ NEXTAUTH_URL, NEXTAUTH_SECRET
- ✅ GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET  
- ✅ SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET
- ✅ SPOTIFY_REDIRECT_URI

## 💡 Important Notes
- JSON storage is temporary, plan migration to Supabase later
- Spotify Premium required for playback SDK
- Consider rate limits on Spotify API
- Implement token refresh middleware

## 🎯 Success Criteria
- Users can search and add tracks
- Real-time voting updates queue order
- Music plays through host's Spotify
- Smooth UX with loading states

---
Ready to implement music features! Start with track search.
CONTEXT_EOF

# ═══════════════════════════════════════════════════════════════════════════════
#                        ADDITIONAL ANALYSIS
# ═══════════════════════════════════════════════════════════════════════════════

echo -e "${GREEN}✅ Context file generated: $CONTEXT_FILE${NC}"
echo ""
echo -e "${CYAN}Performing additional checks...${NC}"

# Check current Spotify integration status
echo -e "\n${BOLD}Spotify Integration Status:${NC}" >> "$ANALYSIS_FILE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━" >> "$ANALYSIS_FILE"

# Check for music-related files
if [ -f "apps/web/app/api/music/search/route.ts" ]; then
    echo "✅ Music search endpoint exists" >> "$ANALYSIS_FILE"
else
    echo "❌ Music search endpoint MISSING" >> "$ANALYSIS_FILE"
fi

if [ -f "apps/web/components/tracks/TrackSearch.tsx" ]; then
    echo "✅ TrackSearch component exists" >> "$ANALYSIS_FILE"
else
    echo "❌ TrackSearch component MISSING" >> "$ANALYSIS_FILE"
fi

# Check data.json for tracks
if [ -f "apps/web/data.json" ]; then
    track_count=$(python3 -c "import json; print(len(json.load(open('apps/web/data.json')).get('tracks', [])))" 2>/dev/null || echo "0")
    echo "📊 Tracks in database: $track_count" >> "$ANALYSIS_FILE"
fi

# Check for TypeScript errors
echo -e "\n${BOLD}TypeScript Status:${NC}" >> "$ANALYSIS_FILE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━" >> "$ANALYSIS_FILE"
cd apps/web 2>/dev/null
error_count=$(npx tsc --noEmit 2>&1 | grep -c "error TS" || echo "0")
if [ "$error_count" -eq 0 ]; then
    echo "✅ No TypeScript errors" >> "$ANALYSIS_FILE"
else
    echo "⚠️  $error_count TypeScript errors found" >> "$ANALYSIS_FILE"
fi
cd - > /dev/null

# Generate implementation checklist
echo -e "\n${BOLD}Implementation Checklist:${NC}" >> "$ANALYSIS_FILE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━" >> "$ANALYSIS_FILE"
echo "□ Create TrackSearch.tsx component" >> "$ANALYSIS_FILE"
echo "□ Create TrackQueue.tsx component" >> "$ANALYSIS_FILE"
echo "□ Implement /api/music/search route" >> "$ANALYSIS_FILE"
echo "□ Implement /api/parties/[id]/tracks route" >> "$ANALYSIS_FILE"
echo "□ Add track type to types/index.ts" >> "$ANALYSIS_FILE"
echo "□ Update storage.ts with track methods" >> "$ANALYSIS_FILE"
echo "□ Add voting UI to tracks" >> "$ANALYSIS_FILE"
echo "□ Implement vote endpoints" >> "$ANALYSIS_FILE"
echo "□ Add Spotify Web Playback SDK" >> "$ANALYSIS_FILE"
echo "□ Create SpotifyPlayer component" >> "$ANALYSIS_FILE"

# ═══════════════════════════════════════════════════════════════════════════════
#                        FINAL OUTPUT
# ═══════════════════════════════════════════════════════════════════════════════

echo ""
echo -e "${BOLD}${GREEN}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BOLD}${GREEN}                    CONTEXT GENERATION COMPLETE${NC}"
echo -e "${BOLD}${GREEN}═══════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${CYAN}📄 Files Generated:${NC}"
echo -e "   • Context: ${GREEN}$CONTEXT_FILE${NC}"
echo -e "   • Analysis: ${GREEN}$ANALYSIS_FILE${NC}"
echo ""
echo -e "${YELLOW}📋 Next Steps:${NC}"
echo -e "   1. Copy the context file content"
echo -e "   2. Start a new chat with Claude"
echo -e "   3. Paste the context"
echo -e "   4. Begin implementing music features"
echo ""
echo -e "${CYAN}💡 Quick Copy Command:${NC}"
echo -e "   cat $CONTEXT_FILE | pbcopy"
echo ""
echo -e "${GREEN}✅ Ready for music implementation!${NC}"
echo "═══════════════════════════════════════════════════════════════"