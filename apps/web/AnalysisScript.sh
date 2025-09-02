#!/bin/bash

# Spotify Integration Deep Analysis Script for tootFM
# CTO Comprehensive Audit Tool - FIXED VERSION

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

PROJECT_ROOT="/Users/mz/tootfm-v3"
WEB_ROOT="$PROJECT_ROOT/apps/web"

echo -e "${CYAN}════════════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}        SPOTIFY INTEGRATION DEEP ANALYSIS - tootFM CTO AUDIT       ${NC}"
echo -e "${CYAN}════════════════════════════════════════════════════════════════${NC}"
echo ""

# Function to check file existence and content
check_file() {
    local file=$1
    local description=$2
    if [ -f "$file" ]; then
        echo -e "${GREEN}✅ Found:${NC} $description"
        echo -e "   Path: $file"
        echo -e "   Size: $(wc -c < "$file") bytes | Lines: $(wc -l < "$file")"
        return 0
    else
        echo -e "${RED}❌ Missing:${NC} $description"
        echo -e "   Expected at: $file"
        return 1
    fi
}

# 1. Spotify OAuth Flow Analysis
echo -e "${MAGENTA}═══ 1. SPOTIFY OAUTH FLOW ANALYSIS ═══${NC}"
echo ""

echo -e "${CYAN}Checking OAuth endpoints:${NC}"
check_file "$WEB_ROOT/app/api/auth/spotify/login/route.ts" "Spotify Login Endpoint"
check_file "$WEB_ROOT/app/api/auth/spotify/callback/route.ts" "Spotify Callback Endpoint"
check_file "$WEB_ROOT/app/api/auth/spotify/refresh/route.ts" "Token Refresh Endpoint"
check_file "$WEB_ROOT/app/api/auth/spotify/logout/route.ts" "Spotify Logout Endpoint"
echo ""

echo -e "${CYAN}OAuth Configuration:${NC}"
if [ -f "$WEB_ROOT/.env.local" ]; then
    echo -e "${GREEN}✅ .env.local exists${NC}"
    if grep -q "SPOTIFY_CLIENT_ID" "$WEB_ROOT/.env.local" 2>/dev/null; then
        echo -e "${GREEN}   ✓ SPOTIFY_CLIENT_ID configured${NC}"
    else
        echo -e "${RED}   ✗ SPOTIFY_CLIENT_ID missing${NC}"
    fi
    if grep -q "SPOTIFY_CLIENT_SECRET" "$WEB_ROOT/.env.local" 2>/dev/null; then
        echo -e "${GREEN}   ✓ SPOTIFY_CLIENT_SECRET configured${NC}"
    else
        echo -e "${RED}   ✗ SPOTIFY_CLIENT_SECRET missing${NC}"
    fi
    if grep -q "SPOTIFY_REDIRECT_URI" "$WEB_ROOT/.env.local" 2>/dev/null; then
        echo -e "${GREEN}   ✓ SPOTIFY_REDIRECT_URI configured${NC}"
    else
        echo -e "${RED}   ✗ SPOTIFY_REDIRECT_URI missing${NC}"
    fi
else
    echo -e "${RED}❌ .env.local missing${NC}"
fi
echo ""

# 2. Spotify Service Implementation
echo -e "${MAGENTA}═══ 2. SPOTIFY SERVICE IMPLEMENTATION ═══${NC}"
echo ""

check_file "$WEB_ROOT/lib/spotify.ts" "Spotify Service Library"
check_file "$WEB_ROOT/lib/spotify-client.ts" "Spotify Client"
check_file "$WEB_ROOT/lib/spotify-web-api.ts" "Spotify Web API Wrapper"
echo ""

echo -e "${CYAN}Spotify API Methods:${NC}"
# Check for methods in lib/spotify.ts
if [ -f "$WEB_ROOT/lib/spotify.ts" ]; then
    grep -q "getTopTracks" "$WEB_ROOT/lib/spotify.ts" 2>/dev/null && \
        echo -e "${GREEN}   ✓ getTopTracks method${NC}" || \
        echo -e "${YELLOW}   ⚠ getTopTracks not found${NC}"
    
    grep -q "getTopArtists" "$WEB_ROOT/lib/spotify.ts" 2>/dev/null && \
        echo -e "${GREEN}   ✓ getTopArtists method${NC}" || \
        echo -e "${YELLOW}   ⚠ getTopArtists not found${NC}"
    
    grep -q "getAudioFeatures" "$WEB_ROOT/lib/spotify.ts" 2>/dev/null && \
        echo -e "${GREEN}   ✓ getAudioFeatures method${NC}" || \
        echo -e "${YELLOW}   ⚠ getAudioFeatures not found${NC}"
    
    grep -q "searchTracks" "$WEB_ROOT/lib/spotify.ts" 2>/dev/null && \
        echo -e "${GREEN}   ✓ searchTracks method${NC}" || \
        echo -e "${YELLOW}   ⚠ searchTracks not found${NC}"
    
    grep -q "getRecommendations" "$WEB_ROOT/lib/spotify.ts" 2>/dev/null && \
        echo -e "${GREEN}   ✓ getRecommendations method${NC}" || \
        echo -e "${YELLOW}   ⚠ getRecommendations not found${NC}"
fi
echo ""

# 3. Spotify Data Storage
echo -e "${MAGENTA}═══ 3. SPOTIFY DATA STORAGE ═══${NC}"
echo ""

echo -e "${CYAN}Storage Integration:${NC}"
if [ -f "$WEB_ROOT/lib/storage.ts" ]; then
    grep -q "spotifyProfiles" "$WEB_ROOT/lib/storage.ts" 2>/dev/null && \
        echo -e "${GREEN}✅ spotifyProfiles in storage${NC}" || \
        echo -e "${RED}❌ spotifyProfiles NOT in storage${NC}"
    
    grep -q "saveSpotifyProfile" "$WEB_ROOT/lib/storage.ts" 2>/dev/null && \
        echo -e "${GREEN}✅ saveSpotifyProfile method${NC}" || \
        echo -e "${RED}❌ saveSpotifyProfile method missing${NC}"
    
    grep -q "updateSpotifyTokens" "$WEB_ROOT/lib/storage.ts" 2>/dev/null && \
        echo -e "${GREEN}✅ updateSpotifyTokens method${NC}" || \
        echo -e "${RED}❌ updateSpotifyTokens method missing${NC}"
fi

if [ -f "$WEB_ROOT/types/index.ts" ]; then
    grep -q "SpotifyProfile" "$WEB_ROOT/types/index.ts" 2>/dev/null && \
        echo -e "${GREEN}✅ SpotifyProfile type defined${NC}" || \
        echo -e "${RED}❌ SpotifyProfile type missing${NC}"
fi
echo ""

# 4. Spotify UI Components
echo -e "${MAGENTA}═══ 4. SPOTIFY UI COMPONENTS ═══${NC}"
echo ""

check_file "$WEB_ROOT/components/spotify/SpotifyConnect.tsx" "Spotify Connect Component"
check_file "$WEB_ROOT/components/spotify/SpotifyPlayer.tsx" "Spotify Player Component"
check_file "$WEB_ROOT/components/spotify/SpotifyLogin.tsx" "Spotify Login Button"
check_file "$WEB_ROOT/components/music/TrackSearch.tsx" "Track Search Component"
echo ""

# 5. Spotify Scopes Analysis
echo -e "${MAGENTA}═══ 5. SPOTIFY SCOPES ANALYSIS ═══${NC}"
echo ""

echo -e "${CYAN}Configured Scopes:${NC}"
if [ -f "$WEB_ROOT/app/api/auth/spotify/login/route.ts" ]; then
    echo "Checking for essential scopes:"
    grep -q "user-top-read" "$WEB_ROOT/app/api/auth/spotify/login/route.ts" 2>/dev/null && \
        echo -e "${GREEN}   ✓ user-top-read (for Music Portrait)${NC}" || \
        echo -e "${RED}   ✗ user-top-read missing${NC}"
    
    grep -q "streaming" "$WEB_ROOT/app/api/auth/spotify/login/route.ts" 2>/dev/null && \
        echo -e "${GREEN}   ✓ streaming (for playback)${NC}" || \
        echo -e "${RED}   ✗ streaming missing${NC}"
    
    grep -q "user-library-read" "$WEB_ROOT/app/api/auth/spotify/login/route.ts" 2>/dev/null && \
        echo -e "${GREEN}   ✓ user-library-read${NC}" || \
        echo -e "${YELLOW}   ⚠ user-library-read missing${NC}"
    
    grep -q "user-read-recently-played" "$WEB_ROOT/app/api/auth/spotify/login/route.ts" 2>/dev/null && \
        echo -e "${GREEN}   ✓ user-read-recently-played${NC}" || \
        echo -e "${YELLOW}   ⚠ user-read-recently-played missing${NC}"
fi
echo ""

# 6. Check actual data.json for Spotify profiles
echo -e "${MAGENTA}═══ 6. ACTUAL DATA CHECK ═══${NC}"
echo ""

if [ -f "$WEB_ROOT/data.json" ]; then
    echo -e "${CYAN}Checking data.json:${NC}"
    
    # Count Spotify profiles
    SPOTIFY_PROFILES=$(grep -o '"spotifyProfiles"' "$WEB_ROOT/data.json" | wc -l)
    if [ $SPOTIFY_PROFILES -gt 0 ]; then
        echo -e "${GREEN}✅ spotifyProfiles array exists in data.json${NC}"
        # Try to count actual profiles (basic check)
        PROFILE_COUNT=$(grep -o '"spotifyId"' "$WEB_ROOT/data.json" | wc -l)
        echo -e "   Found $PROFILE_COUNT Spotify profile(s)"
    else
        echo -e "${YELLOW}⚠️ No spotifyProfiles in data.json${NC}"
    fi
fi
echo ""

# 7. Integration Status Score
echo -e "${MAGENTA}═══ 7. INTEGRATION STATUS CHECK ═══${NC}"
echo ""

SPOTIFY_SCORE=0
SPOTIFY_MAX=15

# Check critical files and features
[ -f "$WEB_ROOT/app/api/auth/spotify/login/route.ts" ] && ((SPOTIFY_SCORE++))
[ -f "$WEB_ROOT/app/api/auth/spotify/callback/route.ts" ] && ((SPOTIFY_SCORE++))
[ -f "$WEB_ROOT/app/api/auth/spotify/refresh/route.ts" ] && ((SPOTIFY_SCORE++))
[ -f "$WEB_ROOT/lib/spotify.ts" ] && ((SPOTIFY_SCORE++))
[ -f "$WEB_ROOT/.env.local" ] && grep -q "SPOTIFY_CLIENT_ID" "$WEB_ROOT/.env.local" 2>/dev/null && ((SPOTIFY_SCORE++))
[ -f "$WEB_ROOT/.env.local" ] && grep -q "SPOTIFY_CLIENT_SECRET" "$WEB_ROOT/.env.local" 2>/dev/null && ((SPOTIFY_SCORE++))
[ -f "$WEB_ROOT/lib/storage.ts" ] && grep -q "spotifyProfiles" "$WEB_ROOT/lib/storage.ts" 2>/dev/null && ((SPOTIFY_SCORE++))
[ -f "$WEB_ROOT/types/index.ts" ] && grep -q "SpotifyProfile" "$WEB_ROOT/types/index.ts" 2>/dev/null && ((SPOTIFY_SCORE++))
[ -f "$WEB_ROOT/components/spotify/SpotifyConnect.tsx" ] && ((SPOTIFY_SCORE++))
[ -f "$WEB_ROOT/app/api/auth/spotify/login/route.ts" ] && grep -q "user-top-read" "$WEB_ROOT/app/api/auth/spotify/login/route.ts" 2>/dev/null && ((SPOTIFY_SCORE++))
[ -f "$WEB_ROOT/app/api/auth/spotify/login/route.ts" ] && grep -q "streaming" "$WEB_ROOT/app/api/auth/spotify/login/route.ts" 2>/dev/null && ((SPOTIFY_SCORE++))
[ -f "$WEB_ROOT/lib/spotify.ts" ] && grep -q "getTopTracks" "$WEB_ROOT/lib/spotify.ts" 2>/dev/null && ((SPOTIFY_SCORE++))
[ -f "$WEB_ROOT/lib/spotify.ts" ] && grep -q "refreshAccessToken" "$WEB_ROOT/lib/spotify.ts" 2>/dev/null && ((SPOTIFY_SCORE++))
[ -f "$WEB_ROOT/lib/storage.ts" ] && grep -q "saveSpotifyProfile" "$WEB_ROOT/lib/storage.ts" 2>/dev/null && ((SPOTIFY_SCORE++))
[ -f "$WEB_ROOT/lib/storage.ts" ] && grep -q "updateSpotifyTokens" "$WEB_ROOT/lib/storage.ts" 2>/dev/null && ((SPOTIFY_SCORE++))

SPOTIFY_PERCENTAGE=$((SPOTIFY_SCORE * 100 / SPOTIFY_MAX))

echo -e "${CYAN}Spotify Integration Score: ${SPOTIFY_SCORE}/${SPOTIFY_MAX} (${SPOTIFY_PERCENTAGE}%)${NC}"
echo ""

if [ $SPOTIFY_PERCENTAGE -ge 80 ]; then
    echo -e "${GREEN}✅ Spotify integration is mostly complete${NC}"
elif [ $SPOTIFY_PERCENTAGE -ge 60 ]; then
    echo -e "${YELLOW}⚠️ Spotify integration is functional but needs improvements${NC}"
elif [ $SPOTIFY_PERCENTAGE -ge 40 ]; then
    echo -e "${YELLOW}⚠️ Spotify integration partially implemented${NC}"
else
    echo -e "${RED}❌ Spotify integration needs significant work${NC}"
fi
echo ""

# 8. Known Issues
echo -e "${MAGENTA}═══ 8. KNOWN ISSUES & MISSING PIECES ═══${NC}"
echo ""

echo -e "${CYAN}Checking for common issues:${NC}"

# Token refresh
if [ -f "$WEB_ROOT/lib/spotify.ts" ] && grep -q "refreshAccessToken\|refreshToken" "$WEB_ROOT/lib/spotify.ts" 2>/dev/null; then
    echo -e "${GREEN}✅ Token refresh logic found${NC}"
else
    echo -e "${RED}❌ Token refresh logic missing${NC}"
fi

# Error handling
if [ -f "$WEB_ROOT/lib/spotify.ts" ] && grep -q "try.*catch\|\.catch" "$WEB_ROOT/lib/spotify.ts" 2>/dev/null; then
    echo -e "${GREEN}✅ Error handling present${NC}"
else
    echo -e "${YELLOW}⚠️ Limited error handling${NC}"
fi

# Rate limiting
if [ -f "$WEB_ROOT/lib/spotify.ts" ] && grep -q "rate.*limit\|429\|retry" "$WEB_ROOT/lib/spotify.ts" 2>/dev/null; then
    echo -e "${GREEN}✅ Rate limiting considered${NC}"
else
    echo -e "${YELLOW}⚠️ No rate limiting logic${NC}"
fi

# Caching
if [ -f "$WEB_ROOT/lib/spotify.ts" ] && grep -q "cache\|Cache" "$WEB_ROOT/lib/spotify.ts" 2>/dev/null; then
    echo -e "${GREEN}✅ Caching implemented${NC}"
else
    echo -e "${YELLOW}⚠️ No caching strategy${NC}"
fi
echo ""

# 9. API Sync Endpoint Check
echo -e "${MAGENTA}═══ 9. MUSIC SYNC ENDPOINT ═══${NC}"
echo ""

if [ -f "$WEB_ROOT/app/api/music/sync/route.ts" ]; then
    echo -e "${GREEN}✅ /api/music/sync endpoint exists${NC}"
    grep -q "spotify" "$WEB_ROOT/app/api/music/sync/route.ts" 2>/dev/null && \
        echo -e "${GREEN}   ✓ Spotify sync implemented${NC}" || \
        echo -e "${YELLOW}   ⚠ Spotify sync not implemented${NC}"
else
    echo -e "${RED}❌ /api/music/sync endpoint missing${NC}"
fi
echo ""

# 10. CTO Recommendations
echo -e "${MAGENTA}═══ 10. CTO RECOMMENDATIONS ═══${NC}"
echo ""

echo -e "${CYAN}Priority Actions:${NC}"

RECOMMENDATIONS=()

# Check what's missing and add recommendations
[ ! -f "$WEB_ROOT/app/api/auth/spotify/logout/route.ts" ] && RECOMMENDATIONS+=("1. Create Spotify logout endpoint")
[ -f "$WEB_ROOT/lib/storage.ts" ] && ! grep -q "spotifyProfiles" "$WEB_ROOT/lib/storage.ts" 2>/dev/null && RECOMMENDATIONS+=("2. Add spotifyProfiles to storage structure")
[ -f "$WEB_ROOT/lib/spotify.ts" ] && ! grep -q "cache" "$WEB_ROOT/lib/spotify.ts" 2>/dev/null && RECOMMENDATIONS+=("3. Implement caching strategy for API calls")
[ -f "$WEB_ROOT/lib/spotify.ts" ] && ! grep -q "rate.*limit" "$WEB_ROOT/lib/spotify.ts" 2>/dev/null && RECOMMENDATIONS+=("4. Add rate limiting logic")
[ ! -f "$WEB_ROOT/app/api/music/sync/route.ts" ] && RECOMMENDATIONS+=("5. Create /api/music/sync endpoint")
[ ! -f "$WEB_ROOT/components/spotify/SpotifyConnect.tsx" ] && RECOMMENDATIONS+=("6. Create SpotifyConnect UI component")

if [ ${#RECOMMENDATIONS[@]} -eq 0 ]; then
    echo -e "${GREEN}No critical issues found!${NC}"
else
    for rec in "${RECOMMENDATIONS[@]}"; do
        echo "$rec"
    done
fi
echo ""

# Summary
echo -e "${CYAN}════════════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}                        ANALYSIS COMPLETE                         ${NC}"
echo -e "${CYAN}════════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "Spotify Integration: ${SPOTIFY_PERCENTAGE}% complete"
echo -e "Ready for Music Portrait: $( [ $SPOTIFY_PERCENTAGE -ge 60 ] && echo 'YES with minor fixes' || echo 'NO - needs work' )"
echo -e "Critical Issues: ${#RECOMMENDATIONS[@]}"
echo ""
echo -e "Run the Music Portrait analysis script next to check portrait readiness."