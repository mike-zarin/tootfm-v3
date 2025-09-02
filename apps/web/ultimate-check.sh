#!/bin/bash

# tootFM Ultimate Diagnostic Script v3.0
# Проверяет КАЖДЫЙ аспект проекта и находит ВСЕ проблемы

echo "═══════════════════════════════════════════════════════════════"
echo "         tootFM ULTIMATE DIAGNOSTIC & FIX v3.0                  "
echo "═══════════════════════════════════════════════════════════════"
echo "Time: $(date)"
echo "Dir: $(pwd)"
echo ""

# Цвета
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Массивы для отчета
declare -a CRITICAL_ERRORS=()
declare -a ERRORS=()
declare -a WARNINGS=()
declare -a INFO=()
declare -a FIXES=()

echo "═══════════════════════════════════════════════════════════════"
echo "SECTION 1: FILE STRUCTURE & DEPENDENCIES"
echo "═══════════════════════════════════════════════════════════════"

echo -e "\n${BLUE}1.1 Core Files Check${NC}"
echo "─────────────────────"

FILES_TO_CHECK=(
    "package.json"
    "next.config.js"
    "tsconfig.json"
    "tailwind.config.ts"
    ".env.local"
    "data.json"
    "lib/storage.ts"
    "lib/utils.ts"
    "types/index.ts"
)

for file in "${FILES_TO_CHECK[@]}"; do
    if [ -f "$file" ]; then
        size=$(wc -c < "$file")
        echo -e "  ${GREEN}✓${NC} $file (${size} bytes)"
    else
        echo -e "  ${RED}✗${NC} $file - MISSING"
        CRITICAL_ERRORS+=("Missing core file: $file")
    fi
done

echo -e "\n${BLUE}1.2 Node Modules & Build${NC}"
echo "─────────────────────"
if [ -d "node_modules" ]; then
    count=$(ls node_modules | wc -l)
    echo -e "  ${GREEN}✓${NC} node_modules exists ($count packages)"
else
    echo -e "  ${RED}✗${NC} node_modules missing"
    ERRORS+=("node_modules missing - run npm install")
fi

if [ -d ".next" ]; then
    echo -e "  ${GREEN}✓${NC} .next build cache exists"
else
    echo -e "  ${YELLOW}!${NC} .next missing (will be created on npm run dev)"
fi

echo "═══════════════════════════════════════════════════════════════"
echo "SECTION 2: CLIENT/SERVER ARCHITECTURE ANALYSIS"
echo "═══════════════════════════════════════════════════════════════"

echo -e "\n${BLUE}2.1 Page Components Analysis${NC}"
echo "─────────────────────"

# Check pages that MUST be Server Components
echo -e "\n  ${YELLOW}Server Components (using fs/storage):${NC}"
SERVER_PAGES=(
    "app/page.tsx"
    "app/party/[id]/page.tsx"
)

for page in "${SERVER_PAGES[@]}"; do
    if [ -f "$page" ]; then
        has_use_client=$(head -1 "$page" | grep -c '"use client"' || true)
        uses_storage=$(grep -c "storage\." "$page" || true)
        
        if [ $has_use_client -gt 0 ]; then
            echo -e "    ${RED}✗${NC} $page has 'use client' but uses storage!"
            CRITICAL_ERRORS+=("$page is incorrectly a Client Component but uses server-only storage")
        else
            echo -e "    ${GREEN}✓${NC} $page (uses storage: $uses_storage times)"
        fi
    fi
done

# Check pages that MUST be Client Components
echo -e "\n  ${YELLOW}Client Components (using hooks):${NC}"
CLIENT_PAGES=(
    "app/party/create/page.tsx"
    "app/party/join/page.tsx"
    "app/auth/signin/page.tsx"
    "app/auth/error/page.tsx"
)

for page in "${CLIENT_PAGES[@]}"; do
    if [ -f "$page" ]; then
        has_use_client=$(head -1 "$page" | grep -c '"use client"' || true)
        uses_hooks=$(grep -c "useState\|useEffect\|useRouter\|useSearchParams" "$page" || true)
        
        if [ $uses_hooks -gt 0 ] && [ $has_use_client -eq 0 ]; then
            echo -e "    ${RED}✗${NC} $page uses hooks but missing 'use client'!"
            CRITICAL_ERRORS+=("$page uses React hooks but missing 'use client' directive")
        else
            echo -e "    ${GREEN}✓${NC} $page (hooks: $uses_hooks)"
        fi
    fi
done

echo -e "\n${BLUE}2.2 Component Props Analysis${NC}"
echo "─────────────────────"

# Check for function props passed from Server to Client
echo -e "\n  ${YELLOW}Checking for invalid Server->Client props:${NC}"

if [ -f "app/party/[id]/page.tsx" ]; then
    # Check for function props
    if grep -q "onTrackAdded={\|onClick={\|onChange={" "app/party/[id]/page.tsx"; then
        echo -e "    ${RED}✗${NC} app/party/[id]/page.tsx passes functions to Client Components:"
        grep -n "onTrackAdded={\|onClick={\|onChange={" "app/party/[id]/page.tsx" | head -3
        CRITICAL_ERRORS+=("Server Component passes function props to Client Components")
    else
        echo -e "    ${GREEN}✓${NC} No function props found in Server Components"
    fi
fi

echo "═══════════════════════════════════════════════════════════════"
echo "SECTION 3: USER ID & AUTHENTICATION CONSISTENCY"
echo "═══════════════════════════════════════════════════════════════"

echo -e "\n${BLUE}3.1 User ID Analysis${NC}"
echo "─────────────────────"

if [ -f "data.json" ]; then
    echo -e "\n  ${YELLOW}Data structure analysis:${NC}"
    
    # Analyze user IDs and party ownership
    python3 << 'PYTHON_END' 2>/dev/null || echo "    Python analysis failed"
import json

with open('data.json', 'r') as f:
    data = json.load(f)

# Get all unique user IDs
user_ids = set([u['id'] for u in data.get('users', [])])
print(f"    Found {len(user_ids)} users:")
for uid in user_ids:
    user = next((u for u in data['users'] if u['id'] == uid), None)
    if user:
        print(f"      - {uid} ({user.get('email', 'no email')})")

# Get all unique host IDs
host_ids = set([p['hostId'] for p in data.get('parties', [])])
print(f"\n    Found {len(host_ids)} unique host IDs:")
for hid in list(host_ids)[:3]:  # Show first 3
    count = len([p for p in data['parties'] if p['hostId'] == hid])
    print(f"      - {hid} (hosts {count} parties)")

# Check for ID mismatches
mismatched_hosts = host_ids - user_ids
if mismatched_hosts:
    print(f"\n    ${chr(27)}[31m✗${chr(27)}[0m ID MISMATCH DETECTED!")
    print(f"      Host IDs not in users table: {mismatched_hosts}")
else:
    print(f"\n    ${chr(27)}[32m✓${chr(27)}[0m All host IDs match user IDs")

# Check memberships
membership_user_ids = set([m['userId'] for m in data.get('memberships', [])])
mismatched_members = membership_user_ids - user_ids
if mismatched_members:
    print(f"    ${chr(27)}[31m✗${chr(27)}[0m Membership IDs not in users: {mismatched_members}")
PYTHON_END

    # Check if we have ID mismatch
    if python3 -c "import json; d=json.load(open('data.json')); uids=set([u['id'] for u in d['users']]); hids=set([p['hostId'] for p in d['parties']]); exit(0 if hids.issubset(uids) else 1)" 2>/dev/null; then
        echo -e "    ${GREEN}✓${NC} User IDs are consistent"
    else
        echo -e "    ${RED}✗${NC} User ID mismatch detected!"
        CRITICAL_ERRORS+=("User ID mismatch: hostId in parties doesn't match user IDs")
        FIXES+=("Fix user ID mismatch in data.json")
    fi
fi

echo "═══════════════════════════════════════════════════════════════"
echo "SECTION 4: API ROUTES & STORAGE FUNCTIONS"
echo "═══════════════════════════════════════════════════════════════"

echo -e "\n${BLUE}4.1 API Routes Check${NC}"
echo "─────────────────────"

API_ROUTES=(
    "app/api/parties/route.ts"
    "app/api/parties/[id]/route.ts"
    "app/api/parties/join/route.ts"
    "app/api/auth/[...nextauth]/route.ts"
    "app/api/music/search/route.ts"
)

for route in "${API_ROUTES[@]}"; do
    if [ -f "$route" ]; then
        echo -e "  ${GREEN}✓${NC} $(basename $route)"
        
        # Check for specific issues
        if [[ "$route" == *"parties/route.ts" ]]; then
            # Check how hostId is set
            if grep -q "hostId: session.user.id" "$route"; then
                echo -e "    ${YELLOW}!${NC} Uses session.user.id as hostId (might be Google ID)"
                WARNINGS+=("parties/route.ts uses session.user.id which might be Google ID")
            fi
        fi
    else
        echo -e "  ${RED}✗${NC} $(basename $route) - MISSING"
        ERRORS+=("Missing API route: $route")
    fi
done

echo -e "\n${BLUE}4.2 Storage Functions Check${NC}"
echo "─────────────────────"

if [ -f "lib/storage.ts" ]; then
    REQUIRED_FUNCTIONS=(
        "getParty"
        "createParty"
        "getPartyMembers"
        "getUserByEmail"
        "createUser"
        "generateUniquePartyCode"
    )
    
    for func in "${REQUIRED_FUNCTIONS[@]}"; do
        if grep -q "async $func\|function $func\|const $func" "lib/storage.ts"; then
            echo -e "  ${GREEN}✓${NC} $func"
        else
            echo -e "  ${RED}✗${NC} $func - NOT FOUND"
            ERRORS+=("Missing storage function: $func")
        fi
    done
fi

echo "═══════════════════════════════════════════════════════════════"
echo "SECTION 5: UI COMPONENTS & IMPORTS"
echo "═══════════════════════════════════════════════════════════════"

echo -e "\n${BLUE}5.1 UI Components 'use client' Check${NC}"
echo "─────────────────────"

ui_missing_directive=0
for component in components/ui/*.tsx; do
    if [ -f "$component" ]; then
        if ! head -1 "$component" | grep -q '"use client"'; then
            echo -e "  ${YELLOW}!${NC} $(basename $component) - missing 'use client'"
            ((ui_missing_directive++))
        fi
    fi
done

if [ $ui_missing_directive -eq 0 ]; then
    echo -e "  ${GREEN}✓${NC} All UI components have 'use client'"
else
    echo -e "  ${YELLOW}!${NC} $ui_missing_directive UI components missing 'use client'"
    WARNINGS+=("$ui_missing_directive UI components missing 'use client' directive")
fi

echo -e "\n${BLUE}5.2 Import Analysis${NC}"
echo "─────────────────────"

# Check for incorrect imports
if grep -r "@tootfm/ui" components/ 2>/dev/null | grep -v Binary > /dev/null; then
    echo -e "  ${RED}✗${NC} Found incorrect @tootfm/ui imports:"
    grep -r "@tootfm/ui" components/ 2>/dev/null | grep -v Binary | head -3
    ERRORS+=("Components have incorrect @tootfm/ui imports")
else
    echo -e "  ${GREEN}✓${NC} No @tootfm/ui imports found"
fi

echo "═══════════════════════════════════════════════════════════════"
echo "SECTION 6: TYPESCRIPT & COMPILATION"
echo "═══════════════════════════════════════════════════════════════"

echo -e "\n${BLUE}6.1 TypeScript Compilation Check${NC}"
echo "─────────────────────"

if command -v npx &> /dev/null && [ -d "node_modules" ]; then
    echo "  Running TypeScript check..."
    if npx tsc --noEmit 2>&1 | grep -q "error"; then
        echo -e "  ${RED}✗${NC} TypeScript compilation errors:"
        npx tsc --noEmit 2>&1 | grep "error" | head -5
        ERRORS+=("TypeScript compilation errors detected")
    else
        echo -e "  ${GREEN}✓${NC} TypeScript compiles without errors"
    fi
else
    echo -e "  ${YELLOW}!${NC} Cannot check TypeScript (npx not available or node_modules missing)"
fi

echo "═══════════════════════════════════════════════════════════════"
echo "SECTION 7: RUNTIME ISSUES"
echo "═══════════════════════════════════════════════════════════════"

echo -e "\n${BLUE}7.1 Known Runtime Issues${NC}"
echo "─────────────────────"

# Check for CopyCodeButton
if [ -f "components/party/CopyCodeButton.tsx" ]; then
    if head -1 "components/party/CopyCodeButton.tsx" | grep -q '"use client"'; then
        echo -e "  ${GREEN}✓${NC} CopyCodeButton is Client Component"
    else
        echo -e "  ${RED}✗${NC} CopyCodeButton missing 'use client'"
        CRITICAL_ERRORS+=("CopyCodeButton needs 'use client' for onClick handler")
    fi
else
    echo -e "  ${YELLOW}!${NC} CopyCodeButton.tsx not found"
fi

# Check for onTrackAdded issue
if [ -f "app/party/[id]/page.tsx" ]; then
    if grep -q "onTrackAdded" "app/party/[id]/page.tsx"; then
        echo -e "  ${RED}✗${NC} TrackSearch receives onTrackAdded callback (invalid)"
        CRITICAL_ERRORS+=("TrackSearch receives function prop from Server Component")
    else
        echo -e "  ${GREEN}✓${NC} No onTrackAdded prop found"
    fi
fi

echo "═══════════════════════════════════════════════════════════════"
echo "                          FINAL REPORT                          "
echo "═══════════════════════════════════════════════════════════════"

echo -e "\n${RED}CRITICAL ERRORS (${#CRITICAL_ERRORS[@]}):${NC}"
if [ ${#CRITICAL_ERRORS[@]} -eq 0 ]; then
    echo "  None"
else
    for error in "${CRITICAL_ERRORS[@]}"; do
        echo "  ✗ $error"
    done
fi

echo -e "\n${YELLOW}ERRORS (${#ERRORS[@]}):${NC}"
if [ ${#ERRORS[@]} -eq 0 ]; then
    echo "  None"
else
    for error in "${ERRORS[@]}"; do
        echo "  • $error"
    done
fi

echo -e "\n${BLUE}WARNINGS (${#WARNINGS[@]}):${NC}"
if [ ${#WARNINGS[@]} -eq 0 ]; then
    echo "  None"
else
    for warning in "${WARNINGS[@]}"; do
        echo "  ⚠ $warning"
    done
fi

echo -e "\n${GREEN}RECOMMENDED FIXES:${NC}"
echo "─────────────────────"

if [ ${#CRITICAL_ERRORS[@]} -gt 0 ] || [ ${#ERRORS[@]} -gt 0 ]; then
    echo "1. Fix User ID mismatch:"
    echo "   - Update hostId in parties to use storage user IDs"
    echo "   - Fix app/api/parties/route.ts to use correct user ID"
    echo ""
    echo "2. Fix Server/Client architecture:"
    echo "   - Remove 'use client' from pages using storage"
    echo "   - Add 'use client' to pages using hooks"
    echo "   - Remove onTrackAdded prop from TrackSearch"
    echo ""
    echo "3. Fix imports:"
    echo "   - Replace @tootfm/ui with @/components/ui/*"
    echo ""
    echo "4. Install dependencies if missing:"
    echo "   npm install"
else
    echo "  No critical issues found!"
fi

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "Status: $([ ${#CRITICAL_ERRORS[@]} -eq 0 ] && echo "READY TO RUN" || echo "NEEDS FIXES")"
echo "Critical: ${#CRITICAL_ERRORS[@]}, Errors: ${#ERRORS[@]}, Warnings: ${#WARNINGS[@]}"
echo "═══════════════════════════════════════════════════════════════"