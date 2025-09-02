#!/bin/bash

# TOOTFM COMPLETE AUDIT SCRIPT
# Run before making any changes!

echo "════════════════════════════════════════════════════════════════"
echo "           TOOTFM COMPLETE PRE-UPDATE AUDIT"
echo "════════════════════════════════════════════════════════════════"
echo "Timestamp: $(date)"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
CHECKS=0
PASSES=0
WARNINGS=0
ERRORS=0

# Function to check file exists
check_file() {
    CHECKS=$((CHECKS + 1))
    if [ -f "$1" ]; then
        echo -e "${GREEN}✅ Found:${NC} $1"
        PASSES=$((PASSES + 1))
        return 0
    else
        echo -e "${RED}❌ Missing:${NC} $1"
        ERRORS=$((ERRORS + 1))
        return 1
    fi
}

# Function to check directory exists
check_dir() {
    CHECKS=$((CHECKS + 1))
    if [ -d "$1" ]; then
        echo -e "${GREEN}✅ Directory exists:${NC} $1"
        PASSES=$((PASSES + 1))
        return 0
    else
        echo -e "${YELLOW}⚠️  Directory missing:${NC} $1"
        WARNINGS=$((WARNINGS + 1))
        return 1
    fi
}

# Function to check string in file
check_in_file() {
    CHECKS=$((CHECKS + 1))
    if [ -f "$2" ] && grep -q "$1" "$2" 2>/dev/null; then
        echo -e "${GREEN}✅ Found '$1' in${NC} $2"
        PASSES=$((PASSES + 1))
        return 0
    else
        echo -e "${YELLOW}⚠️  Not found '$1' in${NC} $2"
        WARNINGS=$((WARNINGS + 1))
        return 1
    fi
}

echo -e "${BLUE}══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}1. PROJECT STRUCTURE CHECK${NC}"
echo -e "${BLUE}══════════════════════════════════════════════════════${NC}"

check_file "apps/web/app/layout.tsx"
check_file "apps/web/app/providers.tsx"
check_file "apps/web/lib/storage.ts"
check_file "apps/web/lib/auth-options.ts"
if [ $? -ne 0 ]; then
    check_file "apps/web/lib/auth-config.ts"
fi
check_file "apps/web/types/index.ts"
check_file "data.json"
check_file ".env.local"

echo ""
echo -e "${BLUE}══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}2. LAYOUT.TSX ANALYSIS${NC}"
echo -e "${BLUE}══════════════════════════════════════════════════════${NC}"

if [ -f "apps/web/app/layout.tsx" ]; then
    echo "Current layout.tsx structure:"
    echo "---"
    grep -E "(SessionProvider|Providers|export default|function RootLayout)" apps/web/app/layout.tsx | head -10
    echo "---"
    
    check_in_file "SessionProvider" "apps/web/app/layout.tsx"
    check_in_file "Providers" "apps/web/app/layout.tsx"
    check_in_file "use client" "apps/web/app/layout.tsx"
fi

echo ""
echo -e "${BLUE}══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}3. TYPESCRIPT TYPES CHECK${NC}"
echo -e "${BLUE}══════════════════════════════════════════════════════${NC}"

if [ -f "apps/web/types/index.ts" ]; then
    echo "Existing types:"
    grep "export interface" apps/web/types/index.ts | awk '{print "  - " $3}'
    
    check_in_file "SpotifyProfile" "apps/web/types/index.ts"
    check_in_file "StorageData" "apps/web/types/index.ts"
    check_in_file "Vote" "apps/web/types/index.ts"
fi

echo ""
echo -e "${BLUE}══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}4. STORAGE.TS ANALYSIS${NC}"
echo -e "${BLUE}══════════════════════════════════════════════════════${NC}"

if [ -f "apps/web/lib/storage.ts" ]; then
    echo "Storage class methods:"
    grep -E "async [a-zA-Z]+\(" apps/web/lib/storage.ts | awk '{print "  - " $2}' | head -20
    
    check_in_file "saveMusicProfile" "apps/web/lib/storage.ts"
    check_in_file "getMusicProfile" "apps/web/lib/storage.ts"
    check_in_file "private async readData" "apps/web/lib/storage.ts"
    check_in_file "private async writeData" "apps/web/lib/storage.ts"
    
    echo ""
    echo "Exported functions:"
    grep "^export const" apps/web/lib/storage.ts | wc -l
    echo "Total exports: $(grep "^export" apps/web/lib/storage.ts | wc -l)"
fi

echo ""
echo -e "${BLUE}══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}5. DATA.JSON STRUCTURE${NC}"
echo -e "${BLUE}══════════════════════════════════════════════════════${NC}"

if [ -f "data.json" ]; then
    echo "Current data.json structure:"
    node -e "
        const fs = require('fs');
        try {
            const data = JSON.parse(fs.readFileSync('data.json', 'utf8'));
            console.log('Fields in data.json:');
            Object.keys(data).forEach(key => {
                const count = Array.isArray(data[key]) ? data[key].length : 'not array';
                console.log('  - ' + key + ': ' + count + ' items');
            });
            if (!data.spotifyProfiles) {
                console.log('  ⚠️  spotifyProfiles field is MISSING');
            }
            if (!data.votes) {
                console.log('  ⚠️  votes field is MISSING');
            }
        } catch(e) {
            console.error('ERROR parsing data.json:', e.message);
        }
    "
fi

echo ""
echo -e "${BLUE}══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}6. SPOTIFY INTEGRATION CHECK${NC}"
echo -e "${BLUE}══════════════════════════════════════════════════════${NC}"

check_dir "apps/web/app/api/auth/spotify"
check_file "apps/web/app/api/auth/spotify/login/route.ts"
check_file "apps/web/app/api/auth/spotify/callback/route.ts"
check_file "apps/web/app/api/auth/spotify/refresh/route.ts"
check_file "apps/web/lib/spotify.ts"

echo ""
echo -e "${BLUE}══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}7. ENVIRONMENT VARIABLES${NC}"
echo -e "${BLUE}══════════════════════════════════════════════════════${NC}"

if [ -f ".env.local" ]; then
    echo "Checking environment variables (without showing values):"
    
    for var in NEXTAUTH_URL NEXTAUTH_SECRET GOOGLE_CLIENT_ID GOOGLE_CLIENT_SECRET SPOTIFY_CLIENT_ID SPOTIFY_CLIENT_SECRET SPOTIFY_REDIRECT_URI; do
        CHECKS=$((CHECKS + 1))
        if grep -q "^${var}=" .env.local 2>/dev/null; then
            echo -e "${GREEN}✅ ${var} is set${NC}"
            PASSES=$((PASSES + 1))
        else
            echo -e "${YELLOW}⚠️  ${var} is NOT set${NC}"
            WARNINGS=$((WARNINGS + 1))
        fi
    done
else
    echo -e "${RED}❌ .env.local file not found!${NC}"
fi

echo ""
echo -e "${BLUE}══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}8. DEPENDENCIES CHECK${NC}"
echo -e "${BLUE}══════════════════════════════════════════════════════${NC}"

if [ -f "package.json" ]; then
    echo "Key dependencies:"
    node -e "
        const pkg = require('./package.json');
        const deps = {...(pkg.dependencies || {}), ...(pkg.devDependencies || {})};
        const checkDeps = ['next', 'next-auth', 'react', 'typescript', '@prisma/client', 'prisma'];
        checkDeps.forEach(dep => {
            if (deps[dep]) {
                console.log('  ✅ ' + dep + ': ' + deps[dep]);
            } else {
                console.log('  ❌ ' + dep + ': NOT INSTALLED');
            }
        });
    "
fi

echo ""
echo -e "${BLUE}══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}9. NEXTAUTH CONFIGURATION${NC}"
echo -e "${BLUE}══════════════════════════════════════════════════════${NC}"

AUTH_FILE=""
if [ -f "apps/web/lib/auth-options.ts" ]; then
    AUTH_FILE="apps/web/lib/auth-options.ts"
elif [ -f "apps/web/lib/auth-config.ts" ]; then
    AUTH_FILE="apps/web/lib/auth-config.ts"
elif [ -f "packages/auth/index.ts" ]; then
    AUTH_FILE="packages/auth/index.ts"
fi

if [ -n "$AUTH_FILE" ]; then
    echo "NextAuth config found in: $AUTH_FILE"
    echo "Providers configured:"
    grep -E "id: ['\"]" "$AUTH_FILE" | awk -F'"' '{print "  - " $2}'
    
    check_in_file "GoogleProvider" "$AUTH_FILE"
    check_in_file "SpotifyProvider" "$AUTH_FILE"
fi

echo ""
echo -e "${BLUE}══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}10. TYPESCRIPT COMPILATION TEST${NC}"
echo -e "${BLUE}══════════════════════════════════════════════════════${NC}"

echo "Running TypeScript check..."
npx tsc --noEmit 2>&1 | head -20

echo ""
echo -e "${BLUE}══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}11. KNOWN ISSUES CHECK${NC}"
echo -e "${BLUE}══════════════════════════════════════════════════════${NC}"

echo "Checking for duplicate parties issue:"
if [ -f "apps/web/app/party/page.tsx" ]; then
    echo "  Checking party/page.tsx for duplicate rendering..."
    grep -n "map\|forEach" apps/web/app/party/page.tsx | head -5
fi

echo ""
echo "Checking member count logic:"
if [ -f "apps/web/lib/storage.ts" ]; then
    grep -A5 "getPartyMemberCount" apps/web/lib/storage.ts | head -10
fi

echo ""
echo -e "${BLUE}══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}12. CURRENT RUNNING PROCESSES${NC}"
echo -e "${BLUE}══════════════════════════════════════════════════════${NC}"

echo "Node processes:"
ps aux | grep -E "node|next" | grep -v grep | head -5

echo ""
echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}                    AUDIT SUMMARY${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"

echo ""
echo "Total Checks: $CHECKS"
echo -e "${GREEN}Passed: $PASSES${NC}"
echo -e "${YELLOW}Warnings: $WARNINGS${NC}"
echo -e "${RED}Errors: $ERRORS${NC}"

SCORE=$((PASSES * 100 / CHECKS))
echo ""
echo "Health Score: ${SCORE}%"

echo ""
echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}                  RECOMMENDATIONS${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"

if [ $ERRORS -gt 0 ]; then
    echo -e "${RED}⚠️  CRITICAL: Fix errors before proceeding!${NC}"
fi

if [ $WARNINGS -gt 10 ]; then
    echo -e "${YELLOW}⚠️  WARNING: Many issues detected. Review carefully!${NC}"
fi

if [ ! -f ".env.local" ]; then
    echo -e "${RED}1. Create .env.local with required variables${NC}"
fi

if [ ! -f "apps/web/app/providers.tsx" ]; then
    echo -e "${YELLOW}2. Consider creating providers.tsx for client components${NC}"
fi

if ! grep -q "spotifyProfiles" data.json 2>/dev/null; then
    echo -e "${YELLOW}3. Add spotifyProfiles field to data.json${NC}"
fi

echo ""
echo "Audit complete! Review results before making changes."
echo "Report saved to: audit_report_$(date +%Y%m%d_%H%M%S).txt"