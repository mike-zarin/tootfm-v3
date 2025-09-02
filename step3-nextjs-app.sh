#!/bin/bash

# ============================================
# tootFM v3 - STEP 3: Next.js App
# Creates: Next.js config, main pages, styles
# ============================================

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🎵 tootFM v3 - Step 3: Next.js App${NC}"
echo "======================================"

# Web app package.json
echo -e "${YELLOW}Creating Next.js app package...${NC}"

cat > apps/web/package.json << 'EOF'
{
  "name": "@tootfm/web",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "@tootfm/database": "*",
    "@tootfm/auth": "*",
    "@tootfm/music-api": "*",
    "@tootfm/ui": "*",
    "@hookform/resolvers": "^3.3.4",
    "@radix-ui/react-dialog": "^1.0.5",
    "@radix-ui/react-dropdown-menu": "^2.0.6",
    "@radix-ui/react-label": "^2.0.2",
    "@radix-ui/react-select": "^2.0.0",
    "@radix-ui/react-slot": "^1.0.2",
    "@radix-ui/react-toast": "^1.1.5",
    "@radix-ui/react-slider": "^1.1.2",
    "@radix-ui/react-switch": "^1.0.3",
    "@tanstack/react-query": "^5.18.0",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.0",
    "date-fns": "^3.3.1",
    "lucide-react": "^0.314.0",
    "next": "14.2.5",
    "next-auth": "^4.24.5",
    "pusher-js": "^8.4.0-rc2",
    "pusher": "^5.2.0",
    "qrcode.react": "^3.1.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-hook-form": "^7.49.0",
    "tailwind-merge": "^2.2.0",
    "tailwindcss-animate": "^1.0.7",
    "zod": "^3.22.4",
    "zustand": "^4.5.0"
  },
  "devDependencies": {
    "@types/node": "^20.11.0",
    "@types/react": "^18.2.47",
    "@types/react-dom": "^18.2.18",
    "autoprefixer": "^10.4.17",
    "eslint": "^8.56.0",
    "eslint-config-next": "14.2.5",
    "postcss": "^8.4.33",
    "tailwindcss": "^3.4.1",
    "typescript": "^5.3.3"
  }
}
EOF

# next.config.js
cat > apps/web/next.config.js << 'EOF'
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'i.scdn.co',
      'is1-ssl.mzstatic.com',
      'lastfm.freetls.fastly.net',
      'lh3.googleusercontent.com',
    ],
  },
  env: {
    NEXT_PUBLIC_APP_URL: process.env.NEXTAUTH_URL || 'http://localhost:3000',
  },
  experimental: {
    serverActions: true,
  },
};

module.exports = nextConfig;
EOF

# tailwind.config.js
cat > apps/web/tailwind.config.js << 'EOF'
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
EOF

# postcss.config.js
cat > apps/web/postcss.config.js << 'EOF'
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
EOF

# tsconfig.json for web app
cat > apps/web/tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "es5",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./*"],
      "@/components/*": ["./components/*"],
      "@/lib/*": ["./lib/*"],
      "@/hooks/*": ["./hooks/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
EOF

# Global CSS
cat > apps/web/app/globals.css << 'EOF'
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --primary: 262.1 83.3% 57.8%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 262.1 83.3% 57.8%;
    --radius: 0.5rem;
  }
 
  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --primary: 262.1 83.3% 57.8%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 262.1 83.3% 57.8%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}
EOF

# Root layout
cat > apps/web/app/layout.tsx << 'EOF'
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'tootFM - Democratic DJ for Your Party',
  description: 'AI-powered music mixing for parties',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
EOF

# Simple home page
cat > apps/web/app/page.tsx << 'EOF'
import { Music } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900 via-black to-black text-white">
      <div className="container mx-auto px-4 py-20">
        <div className="text-center">
          <div className="flex justify-center mb-8">
            <Music className="w-20 h-20 text-purple-500" />
          </div>
          <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            tootFM
          </h1>
          <p className="text-2xl mb-8 text-gray-300">
            Democratic DJ for Your Party
          </p>
          <div className="space-y-4">
            <p className="text-gray-400">🚧 Setup in progress...</p>
            <p className="text-sm text-gray-500">Next: Configure authentication</p>
          </div>
        </div>
      </div>
    </div>
  );
}
EOF

# Root tsconfig
cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "es5",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true
  },
  "include": ["**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules"]
}
EOF

echo -e "${GREEN}✓ Step 3 Complete!${NC}"
echo ""
echo "Next.js app created with:"
echo "  ✓ package.json with all dependencies"
echo "  ✓ Next.js configuration"
echo "  ✓ Tailwind CSS setup"
echo "  ✓ TypeScript configuration"
echo "  ✓ Basic home page"
echo ""
echo -e "${YELLOW}Files created:${NC}"
ls -la apps/web/
echo ""
echo -e "${BLUE}Next: Run ./step4-auth-packages.sh${NC}"

# Create next step
cat > step4-auth-packages.sh << 'NEXT'
#!/bin/bash
echo "Step 4 will create auth and music packages..."
echo "Run: chmod +x step4-auth-packages.sh && ./step4-auth-packages.sh"
NEXT
chmod +x step4-auth-packages.sh

