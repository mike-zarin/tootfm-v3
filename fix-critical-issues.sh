#!/bin/bash
# fix-critical-issues.sh
# Скрипт для исправления критических проблем перед деплоем

set -e

echo "🔧 TootFM v3 - Critical Issues Fix Script"
echo "=========================================="

# 1. Создать .env.local если не существует
if [ ! -f "apps/web/.env.local" ]; then
    echo "📝 Creating .env.local from template..."
    cp apps/web/env.example apps/web/.env.local
    echo "⚠️  Please edit apps/web/.env.local with your actual values!"
    echo "   Required: NEXTAUTH_SECRET, GOOGLE_*, SPOTIFY_*, PUSHER_*"
else
    echo "✅ .env.local already exists"
fi

# 2. Исправить TypeScript ошибки в music-api
echo "🔧 Fixing TypeScript errors in music-api..."

# Исправить previewUrl типы
sed -i.bak 's/previewUrl: item\.preview_url/previewUrl: item.preview_url || undefined/g' packages/music-api/src/spotify.service.ts

# 3. Проверить сборку
echo "🔨 Testing build..."
cd apps/web

# Проверить TypeScript
echo "Running type-check..."
if npm run type-check; then
    echo "✅ TypeScript check passed"
else
    echo "❌ TypeScript check failed - manual fixes needed"
fi

# Проверить сборку
echo "Running build..."
if npm run build; then
    echo "✅ Build successful"
else
    echo "❌ Build failed - manual fixes needed"
fi

cd ..

# 4. Проверить права на data.json
echo "📁 Checking data.json permissions..."
if [ -f "apps/web/data.json" ]; then
    chmod 644 apps/web/data.json
    echo "✅ data.json permissions set"
else
    echo "❌ data.json not found!"
fi

# 5. Установить зависимости если нужно
echo "📦 Checking dependencies..."
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# 6. Запустить диагностику
echo "🔍 Running pre-deploy check..."
if [ -f "apps/web/scripts/pre-deploy-check.ts" ]; then
    cd apps/web
    npx tsx scripts/pre-deploy-check.ts
    cd ..
else
    echo "⚠️  Pre-deploy check script not found"
fi

echo ""
echo "🎯 NEXT STEPS:"
echo "1. Edit apps/web/.env.local with your actual credentials"
echo "2. Fix any remaining TypeScript errors manually"
echo "3. Test the application: npm run dev"
echo "4. Run full pre-deploy check: npx tsx apps/web/scripts/pre-deploy-check.ts"
echo ""
echo "✅ Critical fixes completed!"
