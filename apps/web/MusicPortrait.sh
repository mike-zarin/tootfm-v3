#!/bin/bash

# Music Portrait Progress Analysis Script for tootFM
# CTO Deep Dive into Music Portrait Implementation

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

PROJECT_ROOT="/Users/mz/tootfm-v3"
WEB_ROOT="$PROJECT_ROOT/apps/web"

echo -e "${CYAN}════════════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}        MUSIC PORTRAIT DEEP ANALYSIS - tootFM CTO AUDIT          ${NC}"
echo -e "${CYAN}════════════════════════════════════════════════════════════════${NC}"
echo ""

# 1. Type Definitions Analysis
echo -e "${MAGENTA}═══ 1. MUSIC PORTRAIT TYPE DEFINITIONS ═══${NC}"
echo ""

echo -e "${CYAN}Checking type definitions:${NC}"
if [ -f "$WEB_ROOT/types/music.ts" ]; then
    echo -e "${GREEN}✅ types/music.ts exists${NC}"
    
    # Check for critical types
    grep -q "MusicPortrait" "$WEB_ROOT/types/music.ts" && \
        echo -e "${GREEN}   ✓ MusicPortrait type defined${NC}" || \
        echo -e "${RED}   ✗ MusicPortrait type missing${NC}"
    
    grep -q "UnifiedTrack" "$WEB_ROOT/types/music.ts" && \
        echo -e "${GREEN}   ✓ UnifiedTrack type defined${NC}" || \
        echo -e "${RED}   ✗ UnifiedTrack type missing${NC}"
    
    grep -q "AudioFeatures" "$WEB_ROOT/types/music.ts" && \
        echo -e "${GREEN}   ✓ AudioFeatures type defined${NC}" || \
        echo -e "${RED}   ✗ AudioFeatures type missing${NC}"
    
    grep -q "Artist" "$WEB_ROOT/types/music.ts" && \
        echo -e "${GREEN}   ✓ Artist type defined${NC}" || \
        echo -e "${RED}   ✗ Artist type missing${NC}"
    
    echo ""
    echo -e "${CYAN}MusicPortrait structure:${NC}"
    grep -A 15 "interface MusicPortrait\|type MusicPortrait" "$WEB_ROOT/types/music.ts" 2>/dev/null | head -20 || echo "Not found"
else
    echo -e "${RED}❌ types/music.ts missing${NC}"
fi
echo ""

# 2. API Endpoints for Music Portrait
echo -e "${MAGENTA}═══ 2. MUSIC PORTRAIT API ENDPOINTS ═══${NC}"
echo ""

ENDPOINTS=(
    "app/api/music/portrait/route.ts:GET Music Portrait"
    "app/api/music/portrait/generate/route.ts:Generate Portrait"
    "app/api/music/portrait/compare/route.ts:Compare Portraits"
    "app/api/music/sync/route.ts:Sync Music Data"
    "app/api/music/analyze/route.ts:Analyze Music Taste"
)

for endpoint in "${ENDPOINTS[@]}"; do
    IFS=':' read -r path description <<< "$endpoint"
    if [ -f "$WEB_ROOT/$path" ]; then
        echo -e "${GREEN}✅ $description${NC}"
        echo -e "   Path: $path"
    else
        echo -e "${RED}❌ $description - Missing${NC}"
        echo -e "   Expected at: $path"
    fi
done
echo ""

# 3. Data Collection Methods
echo -e "${MAGENTA}═══ 3. DATA COLLECTION METHODS ═══${NC}"
echo ""

echo -e "${CYAN}Spotify Data Collection:${NC}"
grep -r "getTopTracks\|getTopArtists\|getRecentlyPlayed" "$WEB_ROOT/lib" 2>/dev/null | while IFS= read -r line; do
    echo "   ${line#$WEB_ROOT/}"
done | head -10
echo ""

echo -e "${CYAN}Apple Music Data Collection:${NC}"
grep -r "fetchHeavyRotation\|fetchLibraryTopSongs\|getTopSongs" "$WEB_ROOT/lib" 2>/dev/null | while IFS= read -r line; do
    echo "   ${line#$WEB_ROOT/}"
done | head -10
echo ""

echo -e "${CYAN}Last.fm Data Collection:${NC}"
grep -r "getTopTracks.*lastfm\|getTopArtists.*lastfm\|scrobbles" "$WEB_ROOT/lib" 2>/dev/null | while IFS= read -r line; do
    echo "   ${line#$WEB_ROOT/}"
done | head -10
echo ""

# 4. Portrait Generation Logic
echo -e "${MAGENTA}═══ 4. PORTRAIT GENERATION LOGIC ═══${NC}"
echo ""

echo -e "${CYAN}Checking for portrait generation components:${NC}"

# Check for genre analysis
grep -rq "analyzeGenres\|extractGenres\|genreAnalysis" "$WEB_ROOT" 2>/dev/null && \
    echo -e "${GREEN}✅ Genre analysis logic found${NC}" || \
    echo -e "${YELLOW}⚠️ Genre analysis not implemented${NC}"

# Check for energy curve
grep -rq "energyCurve\|calculateEnergy\|energyAnalysis" "$WEB_ROOT" 2>/dev/null && \
    echo -e "${GREEN}✅ Energy curve calculation found${NC}" || \
    echo -e "${YELLOW}⚠️ Energy curve not implemented${NC}"

# Check for mood analysis
grep -rq "moodAnalysis\|valence.*analysis\|emotionalProfile" "$WEB_ROOT" 2>/dev/null && \
    echo -e "${GREEN}✅ Mood analysis found${NC}" || \
    echo -e "${YELLOW}⚠️ Mood analysis not implemented${NC}"

# Check for diversity metrics
grep -rq "diversityScore\|mainstreamScore\|uniqueness" "$WEB_ROOT" 2>/dev/null && \
    echo -e "${GREEN}✅ Diversity metrics found${NC}" || \
    echo -e "${YELLOW}⚠️ Diversity metrics not implemented${NC}"
echo ""

# 5. UI Components for Music Portrait
echo -e "${MAGENTA}═══ 5. MUSIC PORTRAIT UI COMPONENTS ═══${NC}"
echo ""

UI_COMPONENTS=(
    "components/music/MusicPortrait.tsx:Portrait Display"
    "components/music/PortraitVisualization.tsx:Portrait Visualization"
    "components/music/GenreChart.tsx:Genre Chart"
    "components/music/EnergyGraph.tsx:Energy Graph"
    "components/music/TopArtists.tsx:Top Artists Display"
    "components/music/TopTracks.tsx:Top Tracks Display"
    "components/music/PortraitComparison.tsx:Portrait Comparison"
)

for component in "${UI_COMPONENTS[@]}"; do
    IFS=':' read -r path description <<< "$component"
    if [ -f "$WEB_ROOT/$path" ]; then
        echo -e "${GREEN}✅ $description${NC}"
    else
        echo -e "${RED}❌ $description - Not implemented${NC}"
    fi
done
echo ""

# 6. Data Storage for Portraits
echo -e "${MAGENTA}═══ 6. PORTRAIT DATA STORAGE ═══${NC}"
echo ""

echo -e "${CYAN}Storage implementation:${NC}"
if grep -q "musicPortraits\|MusicPortrait\[\]" "$WEB_ROOT/lib/storage.ts" 2>/dev/null; then
    echo -e "${GREEN}✅ Music Portraits array in storage${NC}"
else
    echo -e "${RED}❌ Music Portraits not in storage structure${NC}"
fi

if grep -q "saveMusicPortrait\|updateMusicPortrait" "$WEB_ROOT/lib/storage.ts" 2>/dev/null; then
    echo -e "${GREEN}✅ Portrait save/update methods exist${NC}"
else
    echo -e "${RED}❌ Portrait save/update methods missing${NC}"
fi

if grep -q "getMusicPortrait\|getUserPortrait" "$WEB_ROOT/lib/storage.ts" 2>/dev/null; then
    echo -e "${GREEN}✅ Portrait retrieval methods exist${NC}"
else
    echo -e "${RED}❌ Portrait retrieval methods missing${NC}"
fi
echo ""

# 7. Algorithm Implementation Status
echo -e "${MAGENTA}═══ 7. PORTRAIT ALGORITHMS STATUS ═══${NC}"
echo ""

ALGORITHMS=(
    "Genre Extraction:extractGenres|analyzeGenres|genreFromTracks"
    "Energy Analysis:calculateEnergy|audioFeatures.*energy|energyScore"
    "Mood Profiling:moodProfile|valenceAnalysis|emotionalTone"
    "Time Patterns:timeAnalysis|listeningPatterns|temporalAnalysis"
    "Diversity Score:diversityScore|varietyMetric|eclecticScore"
    "Mainstream Index:mainstreamScore|popularityIndex|undergroundScore"
)

for algo in "${ALGORITHMS[@]}"; do
    IFS=':' read -r name patterns <<< "$algo"
    if grep -rqE "$patterns" "$WEB_ROOT" 2>/dev/null; then
        echo -e "${GREEN}✅ $name implemented${NC}"
    else
        echo -e "${RED}❌ $name not implemented${NC}"
    fi
done
echo ""

# 8. Integration Points
echo -e "${MAGENTA}═══ 8. INTEGRATION POINTS ═══${NC}"
echo ""

echo -e "${CYAN}Service Integration Status:${NC}"

# Spotify integration
if grep -q "spotify.*portrait\|portrait.*spotify" "$WEB_ROOT/lib" 2>/dev/null; then
    echo -e "${GREEN}✅ Spotify → Portrait integration${NC}"
else
    echo -e "${YELLOW}⚠️ Spotify → Portrait integration incomplete${NC}"
fi

# Apple Music integration
if grep -q "apple.*portrait\|portrait.*apple" "$WEB_ROOT/lib" 2>/dev/null; then
    echo -e "${GREEN}✅ Apple Music → Portrait integration${NC}"
else
    echo -e "${RED}❌ Apple Music → Portrait integration missing${NC}"
fi

# Last.fm integration
if grep -q "lastfm.*portrait\|portrait.*lastfm" "$WEB_ROOT/lib" 2>/dev/null; then
    echo -e "${GREEN}✅ Last.fm → Portrait integration${NC}"
else
    echo -e "${RED}❌ Last.fm → Portrait integration missing${NC}"
fi
echo ""

# 9. Calculate Portrait Readiness Score
echo -e "${MAGENTA}═══ 9. MUSIC PORTRAIT READINESS ═══${NC}"
echo ""

PORTRAIT_SCORE=0
PORTRAIT_MAX=15

# Check critical components
[ -f "$WEB_ROOT/types/music.ts" ] && grep -q "MusicPortrait" "$WEB_ROOT/types/music.ts" && ((PORTRAIT_SCORE++))
[ -f "$WEB_ROOT/types/music.ts" ] && grep -q "UnifiedTrack" "$WEB_ROOT/types/music.ts" && ((PORTRAIT_SCORE++))
[ -f "$WEB_ROOT/app/api/music/portrait/route.ts" ] && ((PORTRAIT_SCORE++))
[ -f "$WEB_ROOT/app/api/music/sync/route.ts" ] && ((PORTRAIT_SCORE++))
grep -rq "getTopTracks" "$WEB_ROOT/lib" 2>/dev/null && ((PORTRAIT_SCORE++))
grep -rq "getTopArtists" "$WEB_ROOT/lib" 2>/dev/null && ((PORTRAIT_SCORE++))
grep -rq "analyzeGenres\|extractGenres" "$WEB_ROOT" 2>/dev/null && ((PORTRAIT_SCORE++))
grep -rq "energyCurve\|calculateEnergy" "$WEB_ROOT" 2>/dev/null && ((PORTRAIT_SCORE++))
grep -rq "musicPortraits" "$WEB_ROOT/lib/storage.ts" 2>/dev/null && ((PORTRAIT_SCORE++))
grep -rq "saveMusicPortrait" "$WEB_ROOT/lib/storage.ts" 2>/dev/null && ((PORTRAIT_SCORE++))
[ -f "$WEB_ROOT/components/music/MusicPortrait.tsx" ] && ((PORTRAIT_SCORE++))
grep -rq "spotify.*portrait" "$WEB_ROOT/lib" 2>/dev/null && ((PORTRAIT_SCORE++))
grep -rq "apple.*portrait" "$WEB_ROOT/lib" 2>/dev/null && ((PORTRAIT_SCORE++))
grep -rq "diversityScore\|mainstreamScore" "$WEB_ROOT" 2>/dev/null && ((PORTRAIT_SCORE++))
grep -rq "comparePortraits\|similarity" "$WEB_ROOT" 2>/dev/null && ((PORTRAIT_SCORE++))

PORTRAIT_PERCENTAGE=$((PORTRAIT_SCORE * 100 / PORTRAIT_MAX))

echo -e "${CYAN}Music Portrait Implementation Score: ${PORTRAIT_SCORE}/${PORTRAIT_MAX} (${PORTRAIT_PERCENTAGE}%)${NC}"
echo ""

if [ $PORTRAIT_PERCENTAGE -ge 80 ]; then
    echo -e "${GREEN}✅ Music Portrait is mostly implemented${NC}"
elif [ $PORTRAIT_PERCENTAGE -ge 50 ]; then
    echo -e "${YELLOW}⚠️ Music Portrait partially implemented${NC}"
elif [ $PORTRAIT_PERCENTAGE -ge 20 ]; then
    echo -e "${YELLOW}⚠️ Music Portrait has basic structure${NC}"
else
    echo -e "${RED}❌ Music Portrait needs significant implementation${NC}"
fi
echo ""

# 10. Next Steps Recommendations
echo -e "${MAGENTA}═══ 10. CTO RECOMMENDATIONS ═══${NC}"
echo ""

echo -e "${CYAN}Critical Missing Pieces:${NC}"
[ ! -f "$WEB_ROOT/app/api/music/portrait/route.ts" ] && echo "1. Create /api/music/portrait endpoint"
grep -q "musicPortraits" "$WEB_ROOT/lib/storage.ts" 2>/dev/null || echo "2. Add musicPortraits to storage structure"
[ ! -f "$WEB_ROOT/components/music/MusicPortrait.tsx" ] && echo "3. Create MusicPortrait UI component"
grep -rq "analyzeGenres" "$WEB_ROOT" 2>/dev/null || echo "4. Implement genre analysis algorithm"
grep -rq "energyCurve" "$WEB_ROOT" 2>/dev/null || echo "5. Implement energy curve calculation"
grep -rq "comparePortraits" "$WEB_ROOT" 2>/dev/null || echo "6. Implement portrait comparison logic"
echo ""

echo -e "${CYAN}Implementation Priority:${NC}"
if [ $PORTRAIT_PERCENTAGE -lt 30 ]; then
    echo "Priority: HIGH - Music Portrait is core feature"
    echo "Estimated time: 3-5 days for full implementation"
    echo ""
    echo "Suggested approach:"
    echo "Day 1: Complete type definitions and storage structure"
    echo "Day 2: Implement data collection from Spotify"
    echo "Day 3: Build analysis algorithms (genres, energy, mood)"
    echo "Day 4: Create UI components and visualization"
    echo "Day 5: Testing and refinement"
else
    echo "Priority: MEDIUM - Continue building on existing foundation"
    echo "Estimated time: 2-3 days to complete"
fi
echo ""

# Summary
echo -e "${CYAN}════════════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}                     PORTRAIT ANALYSIS COMPLETE                   ${NC}"
echo -e "${CYAN}════════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "Music Portrait: ${PORTRAIT_PERCENTAGE}% complete"
echo -e "Types Defined: $( grep -q 'MusicPortrait' '$WEB_ROOT/types/music.ts' 2>/dev/null && echo 'YES' || echo 'NO' )"
echo -e "API Ready: $( [ -f '$WEB_ROOT/app/api/music/portrait/route.ts' ] && echo 'YES' || echo 'NO' )"
echo -e "UI Ready: $( [ -f '$WEB_ROOT/components/music/MusicPortrait.tsx' ] && echo 'YES' || echo 'NO' )"
echo ""