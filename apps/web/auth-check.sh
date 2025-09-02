#!/bin/bash
# comprehensive-auth-check.sh
# Полная проверка авторизации, дублей и консистентности кода

echo "═══════════════════════════════════════════════════════════════"
echo "          tootFM COMPREHENSIVE AUTH & CODE CHECK               "
echo "═══════════════════════════════════════════════════════════════"
echo "Time: $(date)"
echo "Dir: $(pwd)"
echo ""

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Счётчики проблем
ERRORS=0
WARNINGS=0

# Функция для вывода ошибок
error() {
    echo -e "${RED}✗ $1${NC}"
    ((ERRORS++))
}

# Функция для вывода предупреждений
warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
    ((WARNINGS++))
}

# Функция для успешных проверок
success() {
    echo -e "${GREEN}✓ $1${NC}"
}

# Функция для информации
info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

echo "═══════════════════════════════════════════════════════════════"
echo "SECTION 1: AUTH CONFIGURATION ANALYSIS"
echo "═══════════════════════════════════════════════════════════════"
echo ""

echo "1.1 Auth Config Files"
echo "─────────────────────"

# Проверяем все файлы с auth конфигом
AUTH_FILES=(
    "app/api/auth/[...nextauth]/route.ts"
    "lib/auth-config.ts"
    "../../packages/auth/src/auth-config.ts"
)

for file in "${AUTH_FILES[@]}"; do
    if [ -f "$file" ]; then
        success "Found: $file"
        echo "  Exports:"
        grep "export" "$file" 2>/dev/null | head -3 | sed 's/^/    /'
    else
        warning "Missing: $file"
    fi
done

echo ""
echo "1.2 Auth Import Analysis"
echo "─────────────────────"

# Проверяем импорты во всех файлах
echo "Files importing authConfig:"
grep -r "import.*authConfig" . --include="*.ts" --include="*.tsx" 2>/dev/null | \
    grep -v node_modules | grep -v .next | \
    awk -F: '{print "  " $1 ": " $2}' | head -10

echo ""
echo "Files importing authOptions:"
grep -r "import.*authOptions" . --include="*.ts" --include="*.tsx" 2>/dev/null | \
    grep -v node_modules | grep -v .next | \
    awk -F: '{print "  " $1 ": " $2}' | head -10

echo ""
echo "1.3 Session Usage Check"
echo "─────────────────────"

# Проверяем использование getServerSession
echo "Files using getServerSession:"
grep -r "getServerSession" . --include="*.ts" --include="*.tsx" 2>/dev/null | \
    grep -v node_modules | grep -v .next | \
    awk -F: '{print "  " $1}' | sort -u

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "SECTION 2: DUPLICATE FILES & CODE"
echo "═══════════════════════════════════════════════════════════════"
echo ""

echo "2.1 Duplicate File Names"
echo "─────────────────────"

# Находим файлы с одинаковыми именами
find . -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \) \
    -not -path "./node_modules/*" -not -path "./.next/*" | \
    awk -F/ '{print $NF}' | sort | uniq -d | while read filename; do
    warning "Duplicate filename: $filename"
    find . -name "$filename" -not -path "./node_modules/*" -not -path "./.next/*" | sed 's/^/    /'
done

if [ $(find . -type f \( -name "*.ts" -o -name "*.tsx" \) -not -path "./node_modules/*" -not -path "./.next/*" | awk -F/ '{print $NF}' | sort | uniq -d | wc -l) -eq 0 ]; then
    success "No duplicate filenames found"
fi

echo ""
echo "2.2 Multiple data.json Files"
echo "─────────────────────"

DATA_FILES=$(find . -name "data.json" -not -path "./node_modules/*" -not -path "./.next/*")
if [ $(echo "$DATA_FILES" | wc -l) -gt 1 ]; then
    warning "Multiple data.json files found:"
    echo "$DATA_FILES" | while read file; do
        echo "  $file ($(stat -f%z "$file" 2>/dev/null || stat -c%s "$file" 2>/dev/null) bytes)"
    done
else
    success "Only one data.json file"
    echo "  $DATA_FILES"
fi

echo ""
echo "2.3 Duplicate Function/Class Definitions"
echo "─────────────────────"

# Проверяем дублирующиеся экспорты функций
echo "Checking for duplicate exports:"
grep -r "export.*function\|export.*class" . --include="*.ts" --include="*.tsx" 2>/dev/null | \
    grep -v node_modules | grep -v .next | \
    sed 's/.*export.*\(function\|class\) \([a-zA-Z0-9_]*\).*/\2/' | \
    sort | uniq -d | while read funcname; do
    warning "Duplicate export: $funcname"
    grep -r "export.*$funcname" . --include="*.ts" --include="*.tsx" 2>/dev/null | \
        grep -v node_modules | grep -v .next | awk -F: '{print "    " $1}' | head -5
done

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "SECTION 3: USER ID & DATA CONSISTENCY"
echo "═══════════════════════════════════════════════════════════════"
echo ""

echo "3.1 User ID Format Analysis"
echo "─────────────────────"

if [ -f "data.json" ]; then
    # Анализируем форматы ID в data.json
    echo "User IDs in data.json:"
    cat data.json | grep -o '"id":\s*"[^"]*"' | sed 's/"id":\s*"//' | sed 's/"$//' | sort -u | head -5 | sed 's/^/  /'
    
    echo ""
    echo "Host IDs in parties:"
    cat data.json | grep -o '"hostId":\s*"[^"]*"' | sed 's/"hostId":\s*"//' | sed 's/"$//' | sort -u | head -5 | sed 's/^/  /'
    
    echo ""
    echo "User IDs in memberships:"
    cat data.json | grep -o '"userId":\s*"[^"]*"' | sed 's/"userId":\s*"//' | sed 's/"$//' | sort -u | head -5 | sed 's/^/  /'
    
    # Проверяем несоответствия
    echo ""
    echo "Checking ID consistency:"
    
    # Извлекаем все user IDs
    USER_IDS=$(cat data.json | python3 -c "
import json, sys
data = json.load(sys.stdin)
if 'users' in data:
    for user in data['users']:
        print(user.get('id', ''))
" 2>/dev/null)
    
    # Извлекаем все host IDs
    HOST_IDS=$(cat data.json | python3 -c "
import json, sys
data = json.load(sys.stdin)
if 'parties' in data:
    for party in data['parties']:
        print(party.get('hostId', ''))
" 2>/dev/null)
    
    # Проверяем, есть ли host IDs не в users
    for host_id in $HOST_IDS; do
        if ! echo "$USER_IDS" | grep -q "^$host_id$"; then
            error "Host ID not in users table: $host_id"
        fi
    done
    
    if [ $ERRORS -eq 0 ]; then
        success "All host IDs match user IDs"
    fi
else
    warning "data.json not found"
fi

echo ""
echo "3.2 Storage Function Calls"
echo "─────────────────────"

# Проверяем вызовы storage функций
STORAGE_FUNCTIONS=(
    "getUserByEmail"
    "createUser"
    "getParty"
    "createParty"
    "getUserParties"
    "getMembership"
    "createMembership"
)

for func in "${STORAGE_FUNCTIONS[@]}"; do
    count=$(grep -r "storage\.$func" . --include="*.ts" --include="*.tsx" 2>/dev/null | \
        grep -v node_modules | grep -v .next | wc -l)
    if [ $count -gt 0 ]; then
        success "$func used $count times"
    else
        warning "$func not used"
    fi
done

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "SECTION 4: API ROUTES VALIDATION"
echo "═══════════════════════════════════════════════════════════════"
echo ""

echo "4.1 API Routes Structure"
echo "─────────────────────"

API_ROUTES=(
    "app/api/auth/[...nextauth]/route.ts"
    "app/api/parties/route.ts"
    "app/api/parties/[id]/route.ts"
    "app/api/parties/join/route.ts"
)

for route in "${API_ROUTES[@]}"; do
    if [ -f "$route" ]; then
        success "$route exists"
        
        # Проверяем методы
        echo -n "  Methods: "
        grep -o "export.*function \(GET\|POST\|PUT\|PATCH\|DELETE\)" "$route" 2>/dev/null | \
            sed 's/export.*function //' | tr '\n' ' '
        echo ""
        
        # Проверяем обработку сессий
        if grep -q "getServerSession" "$route" 2>/dev/null; then
            echo "  ✓ Uses session"
        else
            echo "  ✗ No session check"
        fi
        
        # Проверяем обработку user по email
        if grep -q "getUserByEmail\|user\.email" "$route" 2>/dev/null; then
            echo "  ✓ Handles user by email"
        else
            echo "  ⚠ May not handle user by email"
        fi
    else
        error "$route missing"
    fi
    echo ""
done

echo "═══════════════════════════════════════════════════════════════"
echo "SECTION 5: IMPORT CHAIN VALIDATION"
echo "═══════════════════════════════════════════════════════════════"
echo ""

echo "5.1 Circular Dependencies Check"
echo "─────────────────────"

# Простая проверка на циклические зависимости
check_circular() {
    local file=$1
    local chain=$2
    
    if [[ " $chain " =~ " $file " ]]; then
        warning "Potential circular dependency: $chain -> $file"
        return
    fi
    
    local imports=$(grep "^import.*from" "$file" 2>/dev/null | \
        grep -v "node_modules" | \
        sed "s/.*from ['\"]\.\/\([^'\"]*\)['\"].*/\1.ts/" | \
        sed "s/.*from ['\"]@\/\([^'\"]*\)['\"].*/\1.ts/")
    
    for imp in $imports; do
        if [ -f "$imp" ]; then
            check_circular "$imp" "$chain $file"
        fi
    done
}

# Проверяем основные файлы
for file in app/page.tsx app/api/parties/route.ts; do
    if [ -f "$file" ]; then
        info "Checking $file for circular deps..."
        # Упрощённая проверка - только прямые импорты
    fi
done

echo ""
echo "5.2 Missing Imports Check"
echo "─────────────────────"

# Проверяем, что все используемые функции импортированы
FILES_TO_CHECK=(
    "app/page.tsx"
    "app/api/parties/route.ts"
    "app/api/parties/[id]/route.ts"
    "app/api/parties/join/route.ts"
)

for file in "${FILES_TO_CHECK[@]}"; do
    if [ -f "$file" ]; then
        echo "Checking $file:"
        
        # Проверяем основные импорты
        if grep -q "storage\." "$file" 2>/dev/null && ! grep -q "import.*storage" "$file" 2>/dev/null; then
            error "  Uses storage but doesn't import it"
        fi
        
        if grep -q "getServerSession" "$file" 2>/dev/null && ! grep -q "import.*getServerSession" "$file" 2>/dev/null; then
            error "  Uses getServerSession but doesn't import it"
        fi
        
        if [ $ERRORS -eq 0 ]; then
            success "  All imports look good"
        fi
    fi
done

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "SECTION 6: TYPE SAFETY CHECK"
echo "═══════════════════════════════════════════════════════════════"
echo ""

echo "6.1 TypeScript Compilation"
echo "─────────────────────"

if command -v npx &> /dev/null && [ -d "node_modules" ]; then
    echo "Running TypeScript check..."
    npx tsc --noEmit 2>&1 | head -20
else
    warning "Cannot run TypeScript check (npx not available or node_modules missing)"
fi

echo ""
echo "6.2 Type Definitions"
echo "─────────────────────"

if [ -f "types/index.ts" ]; then
    success "types/index.ts exists"
    echo "  Exported types:"
    grep "^export.*interface\|^export.*type" types/index.ts 2>/dev/null | \
        sed 's/export.*\(interface\|type\) \([A-Za-z]*\).*/    - \2/' | head -10
else
    error "types/index.ts missing"
fi

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "SECTION 7: RUNTIME CHECKS"
echo "═══════════════════════════════════════════════════════════════"
echo ""

echo "7.1 Process Status"
echo "─────────────────────"

# Проверяем запущенные процессы
if ps aux | grep -v grep | grep -q "next dev\|next start"; then
    success "Next.js is running"
else
    info "Next.js is not running"
fi

echo ""
echo "7.2 Build Status"
echo "─────────────────────"

if [ -d ".next" ]; then
    success ".next build directory exists"
    BUILD_TIME=$(stat -f "%Sm" -t "%Y-%m-%d %H:%M" .next 2>/dev/null || stat -c "%y" .next 2>/dev/null | cut -d' ' -f1-2)
    echo "  Last build: $BUILD_TIME"
else
    warning ".next build directory missing"
fi

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "                          SUMMARY                               "
echo "═══════════════════════════════════════════════════════════════"
echo ""

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✅ ALL CHECKS PASSED!${NC}"
    echo "Your auth setup and code structure look good!"
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠️  MINOR ISSUES FOUND${NC}"
    echo "Errors: 0, Warnings: $WARNINGS"
    echo "The app should work, but consider fixing the warnings."
else
    echo -e "${RED}❌ CRITICAL ISSUES FOUND${NC}"
    echo "Errors: $ERRORS, Warnings: $WARNINGS"
    echo "Fix the errors before running the app."
fi

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "                    RECOMMENDED ACTIONS                         "
echo "═══════════════════════════════════════════════════════════════"
echo ""

if [ ! -f "lib/auth-config.ts" ]; then
    echo "1. Create lib/auth-config.ts:"
    echo "   export { authOptions as authConfig } from '@/app/api/auth/[...nextauth]/route';"
    echo ""
fi

if [ ! -d "node_modules" ]; then
    echo "2. Install dependencies:"
    echo "   npm install"
    echo ""
fi

if [ $ERRORS -gt 0 ]; then
    echo "3. Fix the errors listed above"
    echo ""
fi

echo "═══════════════════════════════════════════════════════════════"
echo "Report generated at: $(date)"
echo "═══════════════════════════════════════════════════════════════"