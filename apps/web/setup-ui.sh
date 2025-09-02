#!/bin/bash

# apps/web/setup-ui.sh
# Скрипт для установки всех необходимых UI компонентов

echo "═══════════════════════════════════════════════════════════════"
echo "            TOOTFM UI COMPONENTS SETUP                          "
echo "═══════════════════════════════════════════════════════════════"

# Проверяем что мы в правильной директории
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found"
    echo "Please run this script from apps/web directory"
    exit 1
fi

echo "📦 Installing shadcn/ui..."

# Создаем components.json если его нет
if [ ! -f "components.json" ]; then
    echo "Creating components.json..."
    cat > components.json << 'EOF'
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "app/globals.css",
    "baseColor": "slate",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils"
  }
}
EOF
fi

# Создаем lib/utils.ts если его нет
if [ ! -f "lib/utils.ts" ]; then
    echo "Creating lib/utils.ts..."
    mkdir -p lib
    cat > lib/utils.ts << 'EOF'
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
EOF
fi

# Устанавливаем необходимые зависимости
echo "Installing dependencies..."
npm install clsx tailwind-merge class-variance-authority

# Создаем директорию для компонентов
mkdir -p components/ui

# Устанавливаем компоненты через npx
echo "Installing UI components..."

# Базовые компоненты
npx shadcn@latest add button --yes
npx shadcn@latest add input --yes
npx shadcn@latest add card --yes
npx shadcn@latest add dialog --yes
npx shadcn@latest add form --yes
npx shadcn@latest add label --yes
npx shadcn@latest add select --yes
npx shadcn@latest add toast --yes

# Дополнительные компоненты для музыкального плеера
npx shadcn@latest add slider --yes
npx shadcn@latest add switch --yes
npx shadcn@latest add dropdown-menu --yes
npx shadcn@latest add avatar --yes
npx shadcn@latest add badge --yes
npx shadcn@latest add skeleton --yes
npx shadcn@latest add scroll-area --yes
npx shadcn@latest add separator --yes

echo ""
echo "✅ UI Components installation complete!"
echo ""
echo "📁 Created components in:"
echo "   components/ui/"
echo ""
echo "Next steps:"
echo "1. Run 'npm run dev' to start the development server"
echo "2. Check that all imports are working correctly"
echo ""

# Проверяем установленные компоненты
echo "📋 Installed components:"
ls -la components/ui/ 2>/dev/null | grep -E "\.tsx$" | awk '{print "   ✓", $NF}'

echo "═══════════════════════════════════════════════════════════════"
