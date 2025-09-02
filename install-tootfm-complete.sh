#!/bin/bash

# ============================================
# tootFM v3 - Complete Auto Installer
# CTO: Полная автоматическая установка проекта
# ============================================

set -e

# Цвета
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🎵 tootFM v3 - Complete Installation${NC}"
echo "======================================"
echo ""

# ============================================
# ЧАСТЬ 1: СОЗДАНИЕ СТРУКТУРЫ
# ============================================

echo -e "${YELLOW}📁 Creating directory structure...${NC}"

# Основные директории
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

# Packages
mkdir -p packages/{database,auth,music-api,ui}/src
mkdir -p packages/database/{prisma,scripts}
mkdir -p packages/ui/src/components

# Другие директории
mkdir -p .github/workflows
mkdir -p scripts

echo -e "${GREEN}✓ Directory structure created${NC}"

# ============================================
# ЧАСТЬ 2: СОЗДАНИЕ ВСЕХ ФАЙЛОВ
# ============================================

echo -e "${YELLOW}📝 Creating all project files...${NC}"

# Счетчик файлов
TOTAL_FILES=0
create_file() {
    echo -n "  Creating: $1"
    cat > "$1"
    ((TOTAL_FILES++))
    echo -e " ${GREEN}✓${NC}"
}

echo ""
echo "Creating configuration files..."

