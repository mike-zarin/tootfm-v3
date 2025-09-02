#!/bin/bash
# check-auth-location.sh

echo "🔍 Checking auth config location..."
echo "════════════════════════════════════════"

# Проверяем где находится authConfig
echo "📁 Looking for authConfig in project:"
echo ""

# Ищем файлы с authConfig
echo "Files containing 'authConfig':"
grep -r "export.*authConfig" . --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v node_modules | grep -v .next

echo ""
echo "════════════════════════════════════════"
echo "Files containing 'authOptions':"
grep -r "export.*authOptions" . --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v node_modules | grep -v .next

echo ""
echo "════════════════════════════════════════"
echo "📁 Structure of auth-related files:"
echo ""

# Проверяем структуру
if [ -f "app/api/auth/[...nextauth]/route.ts" ]; then
    echo "✓ Found: app/api/auth/[...nextauth]/route.ts"
    echo "  Exports:"
    grep "export" app/api/auth/[...nextauth]/route.ts | head -5
fi

if [ -f "lib/auth-config.ts" ]; then
    echo "✓ Found: lib/auth-config.ts"
    echo "  Exports:"
    grep "export" lib/auth-config.ts | head -5
fi

if [ -d "../../packages/auth" ]; then
    echo "✓ Found: packages/auth directory"
    if [ -f "../../packages/auth/src/auth-config.ts" ]; then
        echo "  ✓ packages/auth/src/auth-config.ts exists"
        grep "export" ../../packages/auth/src/auth-config.ts | head -5
    fi
fi

echo ""
echo "════════════════════════════════════════"
echo "📝 Current imports in API routes:"
echo ""

echo "In app/api/parties/route.ts:"
grep "import.*auth" app/api/parties/route.ts 2>/dev/null || echo "  File not found"

echo ""
echo "In app/api/parties/[id]/route.ts:"
grep "import.*auth" app/api/parties/[id]/route.ts 2>/dev/null || echo "  File not found"

echo ""
echo "In app/api/parties/join/route.ts:"
grep "import.*auth" app/api/parties/join/route.ts 2>/dev/null || echo "  File not found"