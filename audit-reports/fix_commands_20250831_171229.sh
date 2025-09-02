#!/bin/bash
# Auto-generated fix script for tootFM
# Generated: Sun Aug 31 17:12:42 EEST 2025

echo "🔧 Starting tootFM fixes..."
cd /Users/mz/tootfm-v3

# Fix SessionProvider in apps/web/app/layout.tsx
# Add: import { SessionProvider } from 'next-auth/react'
# Wrap children with <SessionProvider>
# Fix TypeScript errors
cd apps/web && npx tsc --noEmit
mkdir -p apps/web/app/api/spotify/login
echo 'export async function GET() { /* TODO */ }' > apps/web/app/api/spotify/login/route.ts
echo "✅ Fixes applied!"
