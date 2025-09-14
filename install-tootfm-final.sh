#!/bin/bash

# TootFM v3 - Complete Installation Script
# Version: 3.0 FINAL

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

echo "=================================================="
echo -e "${CYAN}🚀 TootFM v3 - Complete Installation${NC}"
echo "=================================================="
echo ""

# Setup paths
PROJECT_ROOT="$(pwd)"
WEB_ROOT="$PROJECT_ROOT/apps/web"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="$PROJECT_ROOT/backups/$TIMESTAMP"

echo -e "${GREEN}✅ Project root: $PROJECT_ROOT${NC}"
echo -e "${GREEN}✅ Web app: $WEB_ROOT${NC}"
echo ""

# Check structure
if [ ! -d "$WEB_ROOT" ]; then
    echo -e "${RED}❌ Error: apps/web directory not found${NC}"
    exit 1
fi

# Create backup directory
mkdir -p "$BACKUP_DIR"
echo -e "${CYAN}📁 Backup directory: $BACKUP_DIR${NC}"
echo ""

# Function to check file existence
check_file() {
    local file=$1
    local desc=$2
    if [ -f "$WEB_ROOT/$file" ]; then
        echo -e "${GREEN}  ✅ $desc${NC}"
        return 0
    else
        echo -e "${RED}  ❌ $desc (MISSING)${NC}"
        return 1
    fi
}

# Function to create backup
backup_file() {
    local file=$1
    if [ -f "$file" ]; then
        cp "$file" "$BACKUP_DIR/$(basename $file).backup"
        echo -e "${CYAN}  📁 Backed up: $(basename $file)${NC}"
    fi
}

echo -e "${YELLOW}📊 Checking current status...${NC}"
echo ""

echo "Spotify Routes:"
check_file "app/api/auth/spotify/connect/route.ts" "Connect route"
check_file "app/api/auth/spotify/callback/route.ts" "Callback route"
check_file "app/api/auth/spotify/disconnect/route.ts" "Disconnect route"

echo ""
echo "Components:"
check_file "components/music/EnhancedMusicPortrait.tsx" "Enhanced Portrait"

echo ""
echo "Algorithms:"
check_file "lib/smart-mixing.ts" "Smart Mixing"

echo ""
read -p "Ready to install missing components? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 0
fi

echo ""
echo -e "${CYAN}Installation complete!${NC}"
echo "Next: We'll add the actual file contents"
