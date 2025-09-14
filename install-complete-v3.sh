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

# We are inside tootfm-v3
PROJECT_ROOT="$(pwd)"
WEB_ROOT="$PROJECT_ROOT/apps/web"

echo -e "${GREEN}✅ Project root: $PROJECT_ROOT${NC}"
echo -e "${GREEN}✅ Web app: $WEB_ROOT${NC}"
echo ""

# Check if apps/web exists
if [ ! -d "$WEB_ROOT" ]; then
    echo -e "${RED}❌ Error: apps/web directory not found${NC}"
    exit 1
fi

echo "Ready to install missing components."
echo "This script will:"
echo "  1. Create missing Spotify disconnect route"
echo "  2. Create EnhancedMusicPortrait component"
echo "  3. Create Smart Mixing algorithm"
echo "  4. Fix TypeScript async/await issues"
echo ""

read -p "Continue? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Installation cancelled"
    exit 0
fi

echo ""
echo -e "${CYAN}Starting installation...${NC}"
echo ""

# Will continue in next step...
echo -e "${GREEN}✅ Script created successfully${NC}"
echo "Run './install-complete-v3.sh' to continue"
