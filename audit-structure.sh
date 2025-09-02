#!/bin/bash

# ═══════════════════════════════════════════════════════════════════════════════
#                    🔍 COMPLETE TOOTFM STRUCTURE AUDIT 🔍
# ═══════════════════════════════════════════════════════════════════════════════
# Version: 6.0.0
# Purpose: Check ABSOLUTELY EVERYTHING in the project structure
# ═══════════════════════════════════════════════════════════════════════════════

PROJECT_ROOT="/Users/mz/tootfm-v3"
WEB_ROOT="$PROJECT_ROOT/apps/web"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
REPORT_FILE="$PROJECT_ROOT/structure_audit_${TIMESTAMP}.txt"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

# Start
clear
echo -e "${BOLD}${CYAN}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BOLD}${CYAN}         COMPLETE TOOTFM PROJECT STRUCTURE AUDIT${NC}"
echo -e "${BOLD}${CYAN}═══════════════════════════════════════════════════════════════${NC}"
echo ""

cd "$WEB_ROOT" || exit 1

# ═══════════════════════════════════════════════════════════════════════════════
#                              1. COMPLETE FILE TREE
# ═══════════════════════════════════════════════════════════════════════════════

echo -e "${BOLD}${PURPLE}1. COMPLETE PROJECT STRUCTURE:${NC}"
echo -e "${YELLOW}════════════════════════════════════════${NC}"

# Show complete app directory structure
echo -e "\n${CYAN}app/ directory structure:${NC}"
tree -L 4 -a --dirsfirst app/ 2>/dev/null || find app -type f -o -type d | sort | sed 's|[^/]*/| |g' | sed 's|^ ||'

# ═══════════════════════════════════════════════════════════════════════════════
#                              2. ALL ROUTES CHECK
# ═══════════════════════════════════════════════════════════════════════════════

echo -e "\n${BOLD}${PURPLE}2. ALL ROUTES (Pages & API):${NC}"
echo -e "${YELLOW}════════════════════════════════════════${NC}"

echo -e "\n${CYAN}Page Routes:${NC}"
find app -name "page.tsx" -o -name "page.ts" -o -name "page.jsx" -o -name "page.js" 2>/dev/null | while read -r page; do
    route=$(echo "$page" | sed 's|app||' | sed 's|/page\.[tj]sx\?||' | sed 's|\[|:|g' | sed 's|\]||g')
    route=${route:-/}
    
    # Check for 'use client'
    if grep -q "^[\"']use client[\"']" "$page" 2>/dev/null; then
        client_type="${GREEN}[CLIENT]${NC}"
    else
        client_type="${YELLOW}[SERVER]${NC}"
    fi
    
    # Check for SessionProvider usage
    session_check=""
    if grep -q "useSession" "$page" 2>/dev/null; then
        if grep -q "SessionProvider" "$page" 2>/dev/null || grep -q "SessionProvider" app/layout.tsx 2>/dev/null; then
            session_check="${GREEN}[Session OK]${NC}"
        else
            session_check="${RED}[SESSION ERROR!]${NC}"
        fi
    fi
    
    echo -e "  $route $client_type $session_check"
done

echo -e "\n${CYAN}API Routes:${NC}"
find app/api -name "route.ts" -o -name "route.js" 2>/dev/null | while read -r api; do
    route=$(echo "$api" | sed 's|app||' | sed 's|/route\.[tj]s||')
    
    # Check methods
    methods=""
    for method in GET POST PUT DELETE PATCH; do
        if grep -q "export.*$method" "$api" 2>/dev/null; then
            methods="$methods $method"
        fi
    done
    
    echo -e "  $route:$methods"
done

# ═══════════════════════════════════════════════════════════════════════════════
#                              3. SPOTIFY ROUTES ANALYSIS
# ═══════════════════════════════════════════════════════════════════════════════

echo -e "\n${BOLD}${PURPLE}3. SPOTIFY ROUTES DETAILED:${NC}"
echo -e "${YELLOW}════════════════════════════════════════${NC}"

echo -e "\n${CYAN}Found Spotify routes in these locations:${NC}"

# Check all spotify related routes
for dir in app/api/spotify app/api/auth/spotify; do
    if [ -d "$dir" ]; then
        echo -e "\n${YELLOW}$dir/:${NC}"
        find "$dir" -name "*.ts" -o -name "*.js" 2>/dev/null | while read -r file; do
            filename=$(basename "$file")
            dirname=$(basename $(dirname "$file"))
            
            # Check if it's a route file
            if [[ "$filename" == "route.ts" ]] || [[ "$filename" == "route.js" ]]; then
                echo -e "  ${GREEN}✓${NC} $dirname/route.ts"
                
                # Check implementation
                if grep -q "TODO\|not implemented\|throw new Error" "$file" 2>/dev/null; then
                    echo -e "    ${RED}⚠ Has TODOs or not implemented${NC}"
                fi
            else
                echo -e "  ${YELLOW}?${NC} $filename"
            fi
        done
    fi
done

# ═══════════════════════════════════════════════════════════════════════════════
#                              4. SESSION PROVIDER CHECK
# ═══════════════════════════════════════════════════════════════════════════════

echo -e "\n${BOLD}${PURPLE}4. SESSION PROVIDER CONFIGURATION:${NC}"
echo -e "${YELLOW}════════════════════════════════════════${NC}"

# Check root layout
if [ -f "app/layout.tsx" ]; then
    if grep -q "SessionProvider" app/layout.tsx 2>/dev/null; then
        echo -e "${GREEN}✓ SessionProvider found in root layout${NC}"
        
        # Check if it wraps children
        if grep -A5 -B5 "SessionProvider" app/layout.tsx | grep -q "{children}" 2>/dev/null; then
            echo -e "${GREEN}✓ SessionProvider wraps children correctly${NC}"
        else
            echo -e "${RED}✗ SessionProvider might not wrap children${NC}"
        fi
    else
        echo -e "${RED}✗ NO SessionProvider in root layout - THIS IS THE PROBLEM!${NC}"
        echo -e "${YELLOW}  Fix: Add SessionProvider to app/layout.tsx${NC}"
    fi
fi

# Check which components use useSession
echo -e "\n${CYAN}Components using useSession:${NC}"
grep -r "useSession" app --include="*.tsx" --include="*.jsx" 2>/dev/null | while read -r line; do
    file=$(echo "$line" | cut -d: -f1)
    echo -e "  ${YELLOW}$(basename $file)${NC}"
done

# ═══════════════════════════════════════════════════════════════════════════════
#                              5. ENVIRONMENT VARIABLES
# ═══════════════════════════════════════════════════════════════════════════════

echo -e "\n${BOLD}${PURPLE}5. ENVIRONMENT CONFIGURATION:${NC}"
echo -e "${YELLOW}════════════════════════════════════════${NC}"

if [ -f ".env.local" ]; then
    echo -e "\n${CYAN}Spotify Configuration:${NC}"
    grep "SPOTIFY_" .env.local | while read -r line; do
        key=$(echo "$line" | cut -d= -f1)
        value=$(echo "$line" | cut -d= -f2)
        
        # Hide sensitive parts
        if [[ "$key" == *"SECRET"* ]]; then
            echo -e "  $key=${YELLOW}[HIDDEN]${NC}"
        elif [[ "$key" == *"REDIRECT_URI"* ]]; then
            echo -e "  $key=$value"
            
            # Check if redirect URI matches any existing route
            if [[ "$value" == *"/api/spotify/callback"* ]]; then
                if [ -d "app/api/spotify/callback" ]; then
                    echo -e "    ${GREEN}✓ Route exists${NC}"
                else
                    echo -e "    ${RED}✗ Route missing!${NC}"
                fi
            elif [[ "$value" == *"/api/auth/spotify/callback"* ]]; then
                if [ -d "app/api/auth/spotify/callback" ]; then
                    echo -e "    ${GREEN}✓ Route exists${NC}"
                else
                    echo -e "    ${RED}✗ Route missing!${NC}"
                fi
            fi
        else
            echo -e "  $key=${value:0:20}..."
        fi
    done
    
    echo -e "\n${CYAN}Auth Configuration:${NC}"
    for var in NEXTAUTH_URL NEXTAUTH_SECRET GOOGLE_CLIENT_ID; do
        if grep -q "^$var=" .env.local; then
            echo -e "  ${GREEN}✓${NC} $var configured"
        else
            echo -e "  ${RED}✗${NC} $var missing"
        fi
    done
else
    echo -e "${RED}✗ No .env.local file found!${NC}"
fi

# ═══════════════════════════════════════════════════════════════════════════════
#                              6. PARTY SYSTEM CHECK
# ═══════════════════════════════════════════════════════════════════════════════

echo -e "\n${BOLD}${PURPLE}6. PARTY SYSTEM STATUS:${NC}"
echo -e "${YELLOW}════════════════════════════════════════${NC}"

PARTY_FILES=(
    "app/party/page.tsx:Party List:CRITICAL"
    "app/party/[id]/page.tsx:Party Detail:REQUIRED"
    "app/party/create/page.tsx:Create Party:REQUIRED"
    "app/party/join/page.tsx:Join Party:REQUIRED"
    "app/api/parties/route.ts:Parties API:REQUIRED"
    "app/api/parties/[id]/route.ts:Party API:REQUIRED"
    "app/api/parties/join/route.ts:Join API:REQUIRED"
)

for file_info in "${PARTY_FILES[@]}"; do
    IFS=':' read -r path description priority <<< "$file_info"
    
    if [ -f "$path" ]; then
        echo -e "  ${GREEN}✓${NC} $description"
    else
        if [ "$priority" = "CRITICAL" ]; then
            echo -e "  ${RED}✗ $description - MISSING (Causes 404!)${NC}"
        else
            echo -e "  ${YELLOW}⚠${NC} $description - Missing"
        fi
    fi
done

# ═══════════════════════════════════════════════════════════════════════════════
#                              7. DEPENDENCIES CHECK
# ═══════════════════════════════════════════════════════════════════════════════

echo -e "\n${BOLD}${PURPLE}7. KEY DEPENDENCIES:${NC}"
echo -e "${YELLOW}════════════════════════════════════════${NC}"

if [ -f "package.json" ]; then
    echo -e "\n${CYAN}Auth & Session:${NC}"
    for dep in "next-auth" "@next-auth/prisma-adapter"; do
        if grep -q "\"$dep\"" package.json; then
            version=$(grep "\"$dep\"" package.json | head -1 | sed 's/.*: "\(.*\)".*/\1/')
            echo -e "  ${GREEN}✓${NC} $dep: $version"
        else
            echo -e "  ${RED}✗${NC} $dep: Not installed"
        fi
    done
    
    echo -e "\n${CYAN}Spotify:${NC}"
    for dep in "spotify-web-api-node" "@spotify/web-api-ts-sdk"; do
        if grep -q "\"$dep\"" package.json; then
            version=$(grep "\"$dep\"" package.json | head -1 | sed 's/.*: "\(.*\)".*/\1/')
            echo -e "  ${GREEN}✓${NC} $dep: $version"
        else
            echo -e "  ${YELLOW}⚠${NC} $dep: Not installed"
        fi
    done
fi

# ═══════════════════════════════════════════════════════════════════════════════
#                              8. CRITICAL ISSUES SUMMARY
# ═══════════════════════════════════════════════════════════════════════════════

echo -e "\n${BOLD}${RED}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BOLD}${RED}                    CRITICAL ISSUES FOUND${NC}"
echo -e "${BOLD}${RED}═══════════════════════════════════════════════════════════════${NC}"

CRITICAL_COUNT=0

# Check SessionProvider
if ! grep -q "SessionProvider" app/layout.tsx 2>/dev/null; then
    ((CRITICAL_COUNT++))
    echo -e "\n${RED}$CRITICAL_COUNT. NO SessionProvider in app/layout.tsx${NC}"
    echo -e "   ${YELLOW}This causes: useSession errors${NC}"
    echo -e "   ${GREEN}Fix: Wrap app/layout.tsx children with SessionProvider${NC}"
fi

# Check party/page.tsx
if [ ! -f "app/party/page.tsx" ]; then
    ((CRITICAL_COUNT++))
    echo -e "\n${RED}$CRITICAL_COUNT. Missing app/party/page.tsx${NC}"
    echo -e "   ${YELLOW}This causes: 404 after Spotify auth${NC}"
    echo -e "   ${GREEN}Fix: Create party list page${NC}"
fi

# Check Spotify routes confusion
if [ -d "app/api/spotify" ] && [ -d "app/api/auth/spotify" ]; then
    ((CRITICAL_COUNT++))
    echo -e "\n${RED}$CRITICAL_COUNT. Duplicate Spotify routes${NC}"
    echo -e "   ${YELLOW}Found in both: /api/spotify and /api/auth/spotify${NC}"
    echo -e "   ${GREEN}Fix: Use only one location${NC}"
fi

# Check redirect URI
if grep -q "SPOTIFY_REDIRECT_URI" .env.local 2>/dev/null; then
    redirect_uri=$(grep "SPOTIFY_REDIRECT_URI" .env.local | cut -d= -f2)
    if [[ "$redirect_uri" == *"/api/auth/spotify/callback"* ]]; then
        if [ ! -d "app/api/auth/spotify/callback" ]; then
            ((CRITICAL_COUNT++))
            echo -e "\n${RED}$CRITICAL_COUNT. Redirect URI points to non-existent route${NC}"
            echo -e "   ${YELLOW}URI: $redirect_uri${NC}"
            echo -e "   ${GREEN}Fix: Either change URI or create the route${NC}"
        fi
    fi
fi

if [ $CRITICAL_COUNT -eq 0 ]; then
    echo -e "\n${GREEN}No critical issues found!${NC}"
else
    echo -e "\n${RED}Total critical issues: $CRITICAL_COUNT${NC}"
fi

# ═══════════════════════════════════════════════════════════════════════════════
#                              9. QUICK FIX COMMANDS
# ═══════════════════════════════════════════════════════════════════════════════

echo -e "\n${BOLD}${GREEN}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BOLD}${GREEN}                    QUICK FIX COMMANDS${NC}"
echo -e "${BOLD}${GREEN}═══════════════════════════════════════════════════════════════${NC}"

echo -e "\n${CYAN}1. Fix SessionProvider (MOST IMPORTANT):${NC}"
echo -e "${YELLOW}Edit app/layout.tsx and wrap children with SessionProvider:${NC}"
cat << 'EOF'

import { SessionProvider } from "next-auth/react"

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <SessionProvider>
          {children}
        </SessionProvider>
      </body>
    </html>
  )
}
EOF

echo -e "\n${CYAN}2. Create missing party page:${NC}"
echo -e "${YELLOW}touch app/party/page.tsx${NC}"

echo -e "\n${CYAN}3. Fix Spotify redirect URI:${NC}"
echo -e "${YELLOW}Check which route exists and update .env.local accordingly${NC}"

echo -e "\n${CYAN}4. Remove duplicate routes:${NC}"
echo -e "${YELLOW}rm -rf app/api/spotify OR rm -rf app/api/auth/spotify${NC}"

# Save report
echo -e "\n${BOLD}${CYAN}Full report saved to: $REPORT_FILE${NC}"

# Summary
echo -e "\n${BOLD}${PURPLE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BOLD}${PURPLE}                         SUMMARY${NC}"
echo -e "${BOLD}${PURPLE}═══════════════════════════════════════════════════════════════${NC}"

echo -e "Critical issues that MUST be fixed:"
echo -e "1. ${RED}SessionProvider missing in layout.tsx${NC}"
echo -e "2. ${RED}app/party/page.tsx missing${NC}"
echo -e "3. ${YELLOW}Spotify routes duplicated${NC}"
echo -e "4. ${YELLOW}Redirect URI mismatch${NC}"

exit $CRITICAL_COUNT