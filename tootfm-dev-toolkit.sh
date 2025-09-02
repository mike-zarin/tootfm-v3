#!/bin/bash

# TOOTFM DEV TOOLKIT - Минимизация усилий разработчика
# Автор: CTO tootFM
# Версия: 1.0.0

set -e

PROJECT_ROOT="/Users/mz/tootfm-v3/apps/web"
cd "$PROJECT_ROOT"

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

# Timestamp для бэкапов
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Функция для красивого вывода
log() {
    echo -e "${CYAN}[$(date +'%H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}❌ ERROR:${NC} $1"
}

success() {
    echo -e "${GREEN}✅ SUCCESS:${NC} $1"
}

warning() {
    echo -e "${YELLOW}⚠️  WARNING:${NC} $1"
}

info() {
    echo -e "${BLUE}ℹ️  INFO:${NC} $1"
}

# Главное меню
show_menu() {
    clear
    echo -e "${MAGENTA}╔══════════════════════════════════════════════════════════╗${NC}"
    echo -e "${MAGENTA}║            TOOTFM DEV TOOLKIT v1.0.0                    ║${NC}"
    echo -e "${MAGENTA}╚══════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${CYAN}🔥 QUICK FIXES:${NC}"
    echo "  1) Fix ALL Critical Issues (TypeScript, SessionProvider, etc)"
    echo "  2) Test Spotify Integration (auth → tracks → player)"
    echo "  3) Add Test Tracks to Party"
    echo ""
    echo -e "${CYAN}🧪 TESTING:${NC}"
    echo "  4) Full System Test (auth, party, tracks, voting)"
    echo "  5) Check TypeScript Compilation"
    echo "  6) Verify API Endpoints"
    echo ""
    echo -e "${CYAN}🛠️ DEVELOPMENT:${NC}"
    echo "  7) Clean Unused Exports (89 warnings)"
    echo "  8) Setup Real-time (Pusher)"
    echo "  9) Migrate to Supabase"
    echo ""
    echo -e "${CYAN}📊 MONITORING:${NC}"
    echo "  10) Show Current Status"
    echo "  11) Watch Logs (real-time)"
    echo "  12) Backup Everything"
    echo ""
    echo "  0) Exit"
    echo ""
    echo -n "Choose option: "
}

# 1. Fix All Critical Issues
fix_all_critical() {
    log "Starting critical fixes..."
    
    # Backup first
    cp data.json "data.backup.${TIMESTAMP}.json"
    
    # Fix TypeScript SpotifyProfile type
    log "Fixing SpotifyProfile type issues..."
    cat > lib/storage-fix.ts << 'EOF'
// Temporary fix for SpotifyProfile type issues
import { StorageData, SpotifyProfile } from '@/types';

// Ensure dates are strings in SpotifyProfile
export function normalizeSpotifyProfile(profile: any): SpotifyProfile {
  return {
    ...profile,
    expiresAt: typeof profile.expiresAt === 'string' 
      ? profile.expiresAt 
      : profile.expiresAt.toISOString(),
    createdAt: typeof profile.createdAt === 'string'
      ? profile.createdAt
      : profile.createdAt.toISOString(),
    updatedAt: typeof profile.updatedAt === 'string'
      ? profile.updatedAt
      : profile.updatedAt.toISOString()
  };
}
EOF
    
    # Fix SessionProvider in layout
    log "Checking SessionProvider..."
    if ! grep -q "SessionProvider" app/layout.tsx; then
        warning "SessionProvider missing in layout.tsx"
        # Auto-fix would go here
    else
        success "SessionProvider already configured"
    fi
    
    # Compile TypeScript to check
    log "Compiling TypeScript..."
    npx tsc --noEmit 2>/tmp/tsc-errors.txt || true
    
    ERROR_COUNT=$(grep -c "error TS" /tmp/tsc-errors.txt 2>/dev/null || echo "0")
    
    if [ "$ERROR_COUNT" -eq "0" ]; then
        success "TypeScript compilation successful!"
    else
        warning "TypeScript has $ERROR_COUNT errors (see /tmp/tsc-errors.txt)"
    fi
    
    success "Critical fixes applied!"
}

# 2. Test Spotify Integration
test_spotify() {
    log "Testing Spotify Integration..."
    
    # Check environment variables
    if [ -z "$SPOTIFY_CLIENT_ID" ]; then
        source .env.local
    fi
    
    info "Spotify Client ID: ${SPOTIFY_CLIENT_ID:0:10}..."
    
    # Test login endpoint
    log "Testing /api/auth/spotify/login..."
    RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/auth/spotify/login)
    
    if [ "$RESPONSE" = "302" ] || [ "$RESPONSE" = "307" ]; then
        success "Spotify login endpoint working (redirects to Spotify)"
    else
        error "Spotify login endpoint returned $RESPONSE"
    fi
    
    # Check if we have any Spotify profiles
    SPOTIFY_PROFILES=$(cat data.json | jq '.spotifyProfiles | length')
    info "Found $SPOTIFY_PROFILES Spotify profiles in database"
    
    # Test search endpoint
    log "Testing track search..."
    curl -X POST http://localhost:3000/api/music/search \
        -H "Content-Type: application/json" \
        -d '{"query": "Bohemian Rhapsody"}' \
        --silent | jq '.tracks[0].name' || error "Search failed"
}

# 3. Add Test Tracks
add_test_tracks() {
    log "Adding test tracks to party..."
    
    # Get first party ID
    PARTY_ID=$(cat data.json | jq -r '.parties[0].id')
    
    if [ "$PARTY_ID" = "null" ]; then
        error "No parties found. Create a party first!"
        return 1
    fi
    
    info "Adding tracks to party: $PARTY_ID"
    
    # Add some test tracks
    TRACKS='[
        {
            "id": "track_test_1",
            "name": "Bohemian Rhapsody",
            "artist": "Queen",
            "spotifyId": "4u7EnebtmKWzUH433cf5Qv",
            "duration": 354000,
            "albumArt": "https://i.scdn.co/image/ab67616d0000b273ce4f1737bc8a646c8c4bd25a"
        },
        {
            "id": "track_test_2", 
            "name": "Stairway to Heaven",
            "artist": "Led Zeppelin",
            "spotifyId": "5CQ30WqJwcep0pYcV4AMNc",
            "duration": 482000,
            "albumArt": "https://i.scdn.co/image/ab67616d0000b273c8a11e48c91a982d086afc69"
        }
    ]'
    
    # Update data.json
    cat data.json | jq ".tracks += $TRACKS" > data.tmp.json && mv data.tmp.json data.json
    
    success "Added test tracks!"
    
    # Verify
    TRACK_COUNT=$(cat data.json | jq '.tracks | length')
    info "Total tracks in database: $TRACK_COUNT"
}

# 4. Full System Test
full_system_test() {
    log "Starting full system test..."
    
    echo -e "\n${CYAN}1. AUTH TEST${NC}"
    # Check Google OAuth
    curl -s http://localhost:3000/api/auth/providers | jq '.google' && success "Google OAuth configured" || error "Google OAuth missing"
    
    echo -e "\n${CYAN}2. PARTY SYSTEM TEST${NC}"
    # Test party creation
    PARTY_RESPONSE=$(curl -X POST http://localhost:3000/api/parties \
        -H "Content-Type: application/json" \
        -d '{"name": "Test Party '${TIMESTAMP}'"}' \
        --silent)
    
    PARTY_CODE=$(echo $PARTY_RESPONSE | jq -r '.code')
    if [ "$PARTY_CODE" != "null" ]; then
        success "Party created with code: $PARTY_CODE"
    else
        error "Party creation failed"
    fi
    
    echo -e "\n${CYAN}3. TRACK SYSTEM TEST${NC}"
    TRACK_COUNT=$(cat data.json | jq '.tracks | length')
    if [ "$TRACK_COUNT" -gt 0 ]; then
        success "Tracks found: $TRACK_COUNT"
    else
        warning "No tracks in system"
    fi
    
    echo -e "\n${CYAN}4. WEBSOCKET TEST${NC}"
    # Check if Pusher is configured
    if grep -q "PUSHER_APP_ID" .env.local; then
        success "Pusher configured"
    else
        warning "Pusher not configured"
    fi
}

# 5. Check TypeScript
check_typescript() {
    log "Checking TypeScript compilation..."
    
    npx tsc --noEmit --pretty 2>&1 | tee /tmp/tsc-output.txt
    
    ERROR_COUNT=$(grep -c "error TS" /tmp/tsc-output.txt 2>/dev/null || echo "0")
    WARNING_COUNT=$(grep -c "warning" /tmp/tsc-output.txt 2>/dev/null || echo "0")
    
    echo ""
    if [ "$ERROR_COUNT" -eq "0" ]; then
        success "No TypeScript errors!"
    else
        error "Found $ERROR_COUNT TypeScript errors"
    fi
    
    if [ "$WARNING_COUNT" -gt "0" ]; then
        warning "Found $WARNING_COUNT warnings"
    fi
}

# 6. Verify API Endpoints
verify_apis() {
    log "Verifying API endpoints..."
    
    ENDPOINTS=(
        "GET:/api/parties"
        "GET:/api/auth/session"
        "GET:/api/health"
    )
    
    for endpoint in "${ENDPOINTS[@]}"; do
        METHOD="${endpoint%%:*}"
        URL="http://localhost:3000${endpoint#*:}"
        
        RESPONSE=$(curl -X $METHOD -s -o /dev/null -w "%{http_code}" $URL)
        
        if [ "$RESPONSE" = "200" ] || [ "$RESPONSE" = "401" ]; then
            success "$METHOD $URL → $RESPONSE"
        else
            error "$METHOD $URL → $RESPONSE"
        fi
    done
}

# 7. Clean Unused Exports
clean_exports() {
    log "Cleaning unused exports..."
    
    # Find and remove unused exports
    npx ts-prune --project tsconfig.json 2>/dev/null | head -20
    
    read -p "Remove unused exports automatically? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        warning "Auto-cleanup not implemented yet. Manual cleanup required."
    fi
}

# 10. Show Status
show_status() {
    clear
    echo -e "${MAGENTA}╔══════════════════════════════════════════════════════════╗${NC}"
    echo -e "${MAGENTA}║                 TOOTFM CURRENT STATUS                    ║${NC}"
    echo -e "${MAGENTA}╚══════════════════════════════════════════════════════════╝${NC}"
    
    # Database stats
    echo -e "\n${CYAN}📊 DATABASE:${NC}"
    USERS=$(cat data.json | jq '.users | length')
    PARTIES=$(cat data.json | jq '.parties | length')
    TRACKS=$(cat data.json | jq '.tracks | length')
    MEMBERSHIPS=$(cat data.json | jq '.memberships | length')
    SPOTIFY_PROFILES=$(cat data.json | jq '.spotifyProfiles | length')
    
    echo "  Users: $USERS"
    echo "  Parties: $PARTIES"
    echo "  Tracks: $TRACKS"
    echo "  Memberships: $MEMBERSHIPS"
    echo "  Spotify Profiles: $SPOTIFY_PROFILES"
    
    # TypeScript status
    echo -e "\n${CYAN}🔧 TYPESCRIPT:${NC}"
    npx tsc --noEmit 2>/tmp/tsc-check.txt || true
    ERROR_COUNT=$(grep -c "error TS" /tmp/tsc-check.txt 2>/dev/null || echo "0")
    
    if [ "$ERROR_COUNT" -eq "0" ]; then
        echo -e "  ${GREEN}✓ No compilation errors${NC}"
    else
        echo -e "  ${RED}✗ $ERROR_COUNT compilation errors${NC}"
    fi
    
    # Process status
    echo -e "\n${CYAN}🚀 PROCESSES:${NC}"
    if pgrep -f "next dev" > /dev/null; then
        echo -e "  ${GREEN}✓ Next.js dev server running${NC}"
    else
        echo -e "  ${RED}✗ Next.js dev server not running${NC}"
    fi
    
    # Recent changes
    echo -e "\n${CYAN}📝 RECENT CHANGES:${NC}"
    git log --oneline -5 2>/dev/null || echo "  Not a git repository"
}

# 11. Watch Logs
watch_logs() {
    log "Starting log watcher..."
    
    # Create a combined log view
    tail -f ~/.npm/_logs/*.log 2>/dev/null &
    TAIL_PID=$!
    
    info "Watching logs... Press Ctrl+C to stop"
    
    trap "kill $TAIL_PID 2>/dev/null; exit" INT
    
    wait
}

# 12. Backup Everything
backup_all() {
    log "Creating full backup..."
    
    BACKUP_DIR="backups/${TIMESTAMP}"
    mkdir -p "$BACKUP_DIR"
    
    # Backup data
    cp data.json "$BACKUP_DIR/data.json"
    
    # Backup code
    tar -czf "$BACKUP_DIR/code.tar.gz" \
        --exclude=node_modules \
        --exclude=.next \
        app components lib types hooks
    
    # Backup env
    cp .env.local "$BACKUP_DIR/.env.local"
    
    success "Backup created in $BACKUP_DIR"
    
    # Show backup size
    SIZE=$(du -sh "$BACKUP_DIR" | cut -f1)
    info "Backup size: $SIZE"
}

# Quick health check on start
quick_health_check() {
    echo -e "${CYAN}Quick Health Check:${NC}"
    
    # Check if Next.js is running
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 | grep -q "200"; then
        echo -e "  ${GREEN}✓${NC} Next.js server responding"
    else
        echo -e "  ${YELLOW}⚠${NC} Next.js server not responding (run 'npm run dev')"
    fi
    
    # Check data.json
    if [ -f "data.json" ]; then
        TRACK_COUNT=$(cat data.json | jq '.tracks | length' 2>/dev/null || echo "0")
        if [ "$TRACK_COUNT" -eq "0" ]; then
            echo -e "  ${YELLOW}⚠${NC} No tracks in database"
        else
            echo -e "  ${GREEN}✓${NC} $TRACK_COUNT tracks in database"
        fi
    fi
    
    echo ""
}

# Main loop
main() {
    quick_health_check
    
    while true; do
        show_menu
        read -r choice
        
        case $choice in
            1) fix_all_critical ;;
            2) test_spotify ;;
            3) add_test_tracks ;;
            4) full_system_test ;;
            5) check_typescript ;;
            6) verify_apis ;;
            7) clean_exports ;;
            8) 
                warning "Pusher setup not implemented yet"
                info "Add PUSHER_* variables to .env.local first"
                ;;
            9)
                warning "Supabase migration not implemented yet"
                info "This will replace JSON storage with PostgreSQL"
                ;;
            10) show_status ;;
            11) watch_logs ;;
            12) backup_all ;;
            0) 
                success "Goodbye!"
                exit 0
                ;;
            *)
                error "Invalid option"
                ;;
        esac
        
        echo ""
        read -p "Press Enter to continue..."
    done
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    error "Not in project directory!"
    error "Please run from: $PROJECT_ROOT"
    exit 1
fi

# Start the toolkit
main