#!/bin/bash

# TOOTFM REAL-TIME MONITOR
# Отслеживает изменения и автоматически проверяет код

PROJECT_ROOT="/Users/mz/tootfm-v3/apps/web"
cd "$PROJECT_ROOT"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'
CLEAR_LINE='\033[K'

# Terminal setup
trap cleanup EXIT
cleanup() {
    tput cnorm # Show cursor
    echo -e "\n${CYAN}Monitor stopped${NC}"
    kill $WATCH_PID 2>/dev/null
}

tput civis # Hide cursor

# Dashboard header
show_header() {
    clear
    echo -e "${CYAN}╔══════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║              TOOTFM REAL-TIME MONITOR v1.0              ║${NC}"
    echo -e "${CYAN}╚══════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

# Status line
status_line() {
    local row=$1
    local text=$2
    tput cup $row 0
    echo -e "${CLEAR_LINE}$text"
}

# Monitor function
monitor() {
    local last_check=""
    local check_count=0
    
    while true; do
        show_header
        
        # Time
        status_line 4 "${BLUE}🕐 Time:${NC} $(date +'%H:%M:%S')"
        
        # Server status
        if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 | grep -q "200"; then
            status_line 5 "${GREEN}🚀 Server:${NC} Running"
        else
            status_line 5 "${RED}🚀 Server:${NC} Not responding"
        fi
        
        # TypeScript status
        TS_ERRORS=$(npx tsc --noEmit 2>&1 | grep -c "error TS" || echo "0")
        if [ "$TS_ERRORS" -eq "0" ]; then
            status_line 6 "${GREEN}📝 TypeScript:${NC} No errors"
        else
            status_line 6 "${YELLOW}📝 TypeScript:${NC} $TS_ERRORS errors"
        fi
        
        # Database stats
        if [ -f "data.json" ]; then
            USERS=$(cat data.json | jq '.users | length' 2>/dev/null || echo "0")
            PARTIES=$(cat data.json | jq '.parties | length' 2>/dev/null || echo "0")
            TRACKS=$(cat data.json | jq '.tracks | length' 2>/dev/null || echo "0")
            SPOTIFY=$(cat data.json | jq '.spotifyProfiles | length' 2>/dev/null || echo "0")
            
            status_line 8 "${CYAN}📊 Database:${NC}"
            status_line 9 "   Users: $USERS | Parties: $PARTIES | Tracks: $TRACKS | Spotify: $SPOTIFY"
        fi
        
        # File changes
        CHANGED_FILES=$(find . -name "*.ts" -o -name "*.tsx" -newer /tmp/monitor_timestamp 2>/dev/null | wc -l || echo "0")
        if [ "$CHANGED_FILES" -gt "0" ]; then
            status_line 11 "${YELLOW}📝 Changes detected:${NC} $CHANGED_FILES files modified"
            touch /tmp/monitor_timestamp
            
            # Auto-check on change
            status_line 12 "${CYAN}🔄 Running checks...${NC}"
            
            # Quick TypeScript check
            npx tsc --noEmit 2>/tmp/tsc_quick.txt
            if [ $? -eq 0 ]; then
                status_line 13 "  ${GREEN}✓${NC} TypeScript OK"
            else
                ERROR_COUNT=$(grep -c "error TS" /tmp/tsc_quick.txt)
                status_line 13 "  ${RED}✗${NC} TypeScript: $ERROR_COUNT errors"
            fi
            
            # Check for common issues
            if grep -r "console.log" app lib --include="*.ts" --include="*.tsx" > /dev/null; then
                CONSOLE_COUNT=$(grep -r "console.log" app lib --include="*.ts" --include="*.tsx" | wc -l)
                status_line 14 "  ${YELLOW}⚠${NC} Found $CONSOLE_COUNT console.log statements"
            fi
        else
            status_line 11 "${GREEN}✓ No recent changes${NC}"
        fi
        
        # API health check
        status_line 16 "${CYAN}🔌 API Endpoints:${NC}"
        
        # Quick endpoint checks
        ENDPOINTS=(
            "/api/parties"
            "/api/auth/session"
            "/api/auth/spotify/login"
        )
        
        ROW=17
        for endpoint in "${ENDPOINTS[@]}"; do
            RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000$endpoint")
            if [ "$RESPONSE" = "200" ] || [ "$RESPONSE" = "302" ] || [ "$RESPONSE" = "307" ]; then
                status_line $ROW "  ${GREEN}✓${NC} $endpoint → $RESPONSE"
            else
                status_line $ROW "  ${RED}✗${NC} $endpoint → $RESPONSE"
            fi
            ((ROW++))
        done
        
        # Memory usage
        if command -v node &> /dev/null; then
            NODE_MEM=$(ps aux | grep "node" | grep -v grep | awk '{sum += $6} END {printf "%.1f", sum/1024}')
            status_line 21 "${BLUE}💾 Memory:${NC} ${NODE_MEM}MB"
        fi
        
        # Last successful build
        if [ -d ".next" ]; then
            BUILD_TIME=$(stat -f "%Sm" -t "%H:%M" .next 2>/dev/null || echo "Unknown")
            status_line 22 "${GREEN}🏗️ Last build:${NC} $BUILD_TIME"
        fi
        
        # Controls
        status_line 24 "${CYAN}Commands:${NC}"
        status_line 25 "  [r] Restart server | [t] Run tests | [c] Clear cache | [q] Quit"
        
        # Check for input (non-blocking)
        read -t 1 -n 1 key
        case $key in
            r)
                status_line 27 "${YELLOW}Restarting server...${NC}"
                pkill -f "next dev"
                npm run dev &
                ;;
            t)
                status_line 27 "${YELLOW}Running tests...${NC}"
                npm test 2>&1 | tail -3
                ;;
            c)
                status_line 27 "${YELLOW}Clearing cache...${NC}"
                rm -rf .next
                ;;
            q)
                break
                ;;
        esac
        
        ((check_count++))
        
        # Update every second
        sleep 1
    done
}

# Initialize timestamp
touch /tmp/monitor_timestamp

# Start monitoring
monitor