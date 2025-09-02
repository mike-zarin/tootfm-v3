#!/bin/bash

# ============================================
# tootFM v3 - STEP 1: Base Setup
# Creates: structure, root configs, database schema
# ============================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🎵 tootFM v3 - Step 1: Base Setup${NC}"
echo "===================================="

# Create directories
echo -e "${YELLOW}Creating directories...${NC}"
mkdir -p apps/web/{app,components,lib,public,styles,hooks}
mkdir -p apps/web/app/{api,party}
mkdir -p apps/web/app/api/{auth,music,parties,pusher}
mkdir -p apps/web/app/api/parties/\[id\]/{tracks,status,regenerate,next}
mkdir -p apps/web/app/api/parties/\[id\]/tracks/\[trackId\]/{vote,reorder}
mkdir -p apps/web/app/api/music/{profiles,sync,disconnect}
mkdir -p apps/web/app/api/music/sync/\[service\]
mkdir -p apps/web/app/api/music/disconnect/\[service\]
mkdir -p apps/web/app/party/\[id\]
mkdir -p apps/web/components/{party,auth,ui}
mkdir -p apps/web/lib/hooks
mkdir -p packages/{database,auth,music-api,ui}/src
mkdir -p packages/database/{prisma,scripts}
mkdir -p packages/ui/src/components
mkdir -p .github/workflows
mkdir -p scripts

echo -e "${GREEN}✓ Directories created${NC}"

# Create root files
echo -e "${YELLOW}Creating root configuration...${NC}"

# 1. Root package.json
cat > package.json << 'EOF'
{
  "name": "tootfm-v3",
  "version": "0.1.0",
  "private": true,
  "workspaces": [
    "apps/*",
    "packages/*"
  ],
  "scripts": {
    "dev": "turbo dev",
    "build": "turbo build",
    "test": "turbo test",
    "lint": "turbo lint",
    "type-check": "turbo type-check",
    "db:push": "turbo db:push",
    "db:migrate": "turbo db:migrate",
    "db:studio": "turbo db:studio",
    "clean": "turbo clean && rm -rf node_modules",
    "format": "prettier --write \"**/*.{ts,tsx,md,json}\"",
    "prepare": "husky install"
  },
  "devDependencies": {
    "@types/node": "^20.11.0",
    "eslint": "^8.56.0",
    "husky": "^9.0.0",
    "lint-staged": "^15.2.0",
    "prettier": "^3.2.0",
    "turbo": "^1.12.0",
    "typescript": "^5.3.0"
  },
  "engines": {
    "node": ">=18.0.0",
    "npm": ">=9.0.0"
  },
  "packageManager": "npm@10.2.0"
}
EOF

# 2. turbo.json
cat > turbo.json << 'EOF'
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": ["**/.env.*local"],
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "!.next/cache/**", "dist/**"],
      "env": ["NODE_ENV", "NEXTAUTH_URL", "NEXTAUTH_SECRET", "DATABASE_URL"]
    },
    "dev": {
      "cache": false,
      "persistent": true,
      "dotEnv": [".env.local", ".env"]
    },
    "lint": { "outputs": [] },
    "type-check": { "outputs": [] },
    "db:push": { "cache": false, "env": ["DATABASE_URL"] },
    "db:migrate": { "cache": false, "env": ["DATABASE_URL"] },
    "db:studio": { "cache": false, "persistent": true, "env": ["DATABASE_URL"] }
  }
}
EOF

# 3. docker-compose.yml
cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    container_name: tootfm-db
    restart: unless-stopped
    ports:
      - "5432:5432"
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: tootfm_dev_password
      POSTGRES_DB: tootfm
      POSTGRES_HOST_AUTH_METHOD: trust
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  pgadmin:
    image: dpage/pgadmin4:latest
    container_name: tootfm-pgadmin
    restart: unless-stopped
    ports:
      - "5050:80"
    environment:
      PGADMIN_DEFAULT_EMAIL: admin@tootfm.local
      PGADMIN_DEFAULT_PASSWORD: admin
      PGADMIN_CONFIG_SERVER_MODE: 'False'
    depends_on:
      postgres:
        condition: service_healthy

  redis:
    image: redis:7-alpine
    container_name: tootfm-redis
    restart: unless-stopped
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  pgadmin_data:
  redis_data:
EOF

# 4. .env.example
cat > .env.example << 'EOF'
# Database
DATABASE_URL="postgresql://postgres:tootfm_dev_password@localhost:5432/tootfm"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="development-secret-change-in-production-min-32-chars"

# Google OAuth
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""

# Spotify API
SPOTIFY_CLIENT_ID=""
SPOTIFY_CLIENT_SECRET=""

# Pusher
PUSHER_APP_ID=""
PUSHER_KEY=""
PUSHER_SECRET=""
PUSHER_CLUSTER="eu"

# Feature flags
ENABLE_SPOTIFY="true"
ENABLE_APPLE_MUSIC="false"
ENABLE_LASTFM="false"

NODE_ENV="development"
EOF

# 5. Create .env.local from example
cp .env.example .env.local
echo -e "${GREEN}✓ Created .env.local (please add your API keys)${NC}"

# 6. .gitignore
cat > .gitignore << 'EOF'
# Dependencies
node_modules
.pnp
.pnp.js

# Testing
coverage
.nyc_output

# Next.js
.next/
out/
build

# Production
dist

# Misc
.DS_Store
*.pem
.vscode
.idea

# Debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Env files
.env
.env.local
.env.production.local
.env.development.local
.env.test.local

# Turbo
.turbo

# Vercel
.vercel

# TypeScript
*.tsbuildinfo

# Database
*.db
*.sqlite
postgres_data/
EOF

echo -e "${GREEN}✓ Step 1 Complete!${NC}"
echo ""
echo "Files created:"
echo "  ✓ package.json"
echo "  ✓ turbo.json"
echo "  ✓ docker-compose.yml"
echo "  ✓ .env.example"
echo "  ✓ .env.local"
echo "  ✓ .gitignore"
echo ""
echo -e "${YELLOW}Next: Run ./step2-database.sh${NC}"

# Create next step file
cat > step2-database.sh << 'NEXT_STEP'
#!/bin/bash
echo "Step 2 will create database schema and configs..."
echo "Run: chmod +x step2-database.sh && ./step2-database.sh"
NEXT_STEP
chmod +x step2-database.sh

