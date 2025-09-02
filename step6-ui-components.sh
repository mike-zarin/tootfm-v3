#!/bin/bash

# step6-ui-components.sh - UI Components Package
# CTO: Базовые компоненты с TailwindCSS

set -e

echo "🎨 Step 6: Setting up UI Components"
echo "===================================="

# Create ui package structure
mkdir -p packages/ui/src/components

# 1. UI package.json
echo "📦 Creating ui package.json..."
cat > packages/ui/package.json << 'EOF'
{
  "name": "@tootfm/ui",
  "version": "0.1.0",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "clsx": "^2.1.0",
    "lucide-react": "^0.314.0",
    "tailwind-merge": "^2.2.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.47",
    "@types/react-dom": "^18.2.18",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "typescript": "^5.3.3"
  },
  "peerDependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  }
}
EOF

# 2. Button component
echo "🔘 Creating Button component..."
cat > packages/ui/src/components/button.tsx << 'EOF'
import * as React from "react";
import { cn } from "../utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    const variants = {
      default: "bg-purple-600 text-white hover:bg-purple-700",
      destructive: "bg-red-500 text-white hover:bg-red-600",
      outline: "border border-gray-600 hover:bg-gray-800",
      secondary: "bg-gray-800 text-white hover:bg-gray-700",
      ghost: "hover:bg-gray-800 hover:text-white",
      link: "text-purple-400 underline-offset-4 hover:underline",
    };

    const sizes = {
      default: "h-10 px-4 py-2",
      sm: "h-9 px-3",
      lg: "h-11 px-8",
      icon: "h-10 w-10",
    };

    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50",
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";

export { Button };
EOF

# 3. Card component
echo "🃏 Creating Card component..."
cat > packages/ui/src/components/card.tsx << 'EOF'
import * as React from "react";
import { cn } from "../utils";

const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-lg border border-gray-800 bg-gray-900/50 backdrop-blur",
        className
      )}
      {...props}
    />
  )
);
Card.displayName = "Card";

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex flex-col space-y-1.5 p-6", className)}
      {...props}
    />
  )
);
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn("text-2xl font-semibold leading-none tracking-tight text-white", className)}
      {...props}
    />
  )
);
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn("text-sm text-gray-400", className)}
      {...props}
    />
  )
);
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
  )
);
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex items-center p-6 pt-0", className)}
      {...props}
    />
  )
);
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };
EOF

# 4. Input component
echo "�� Creating Input component..."
cat > packages/ui/src/components/input.tsx << 'EOF'
import * as React from "react";
import { cn } from "../utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white",
          "placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
EOF

# 5. Badge component
echo "🏷️ Creating Badge component..."
cat > packages/ui/src/components/badge.tsx << 'EOF'
import * as React from "react";
import { cn } from "../utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    const variants = {
      default: "bg-purple-500/20 text-purple-400 border-purple-500/20",
      secondary: "bg-gray-700 text-gray-300 border-gray-600",
      destructive: "bg-red-500/20 text-red-400 border-red-500/20",
      outline: "text-gray-400 border-gray-600",
    };

    return (
      <div
        ref={ref}
        className={cn(
          "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors",
          variants[variant],
          className
        )}
        {...props}
      />
    );
  }
);
Badge.displayName = "Badge";

export { Badge };
EOF

# 6. Spinner component
echo "⏳ Creating Spinner component..."
cat > packages/ui/src/components/spinner.tsx << 'EOF'
import * as React from "react";
import { cn } from "../utils";

export interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg';
}

const Spinner = React.forwardRef<HTMLDivElement, SpinnerProps>(
  ({ className, size = 'md', ...props }, ref) => {
    const sizes = {
      sm: "h-4 w-4 border-2",
      md: "h-8 w-8 border-3",
      lg: "h-12 w-12 border-4",
    };

    return (
      <div
        ref={ref}
        className={cn(
          "animate-spin rounded-full border-gray-700 border-t-purple-500",
          sizes[size],
          className
        )}
        {...props}
      />
    );
  }
);
Spinner.displayName = "Spinner";

export { Spinner };
EOF

# 7. Utils file
echo "🔧 Creating utils.ts..."
cat > packages/ui/src/utils.ts << 'EOF'
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDuration(ms: number): string {
  if (!ms) return "0:00";
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

export function generateId(prefix: string = "id"): string {
  return `${prefix}_${Math.random().toString(36).substr(2, 9)}`;
}
EOF

# 8. Main index export
echo "📄 Creating index.ts..."
cat > packages/ui/src/index.ts << 'EOF'
// Components
export * from './components/button';
export * from './components/card';
export * from './components/input';
export * from './components/badge';
export * from './components/spinner';

// Utils
export * from './utils';
EOF

# 9. tsconfig for ui package
echo "⚙️ Creating ui tsconfig.json..."
cat > packages/ui/tsconfig.json << 'EOF'
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "jsx": "react-jsx",
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
EOF

# 10. Create global CSS file
echo "🎨 Creating global styles..."
cat > apps/web/app/globals.css << 'EOF'
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 0%;
    --foreground: 0 0% 100%;
  }

  * {
    @apply border-border;
  }

  body {
    @apply bg-black text-white;
  }
}

@layer components {
  .gradient-purple {
    @apply bg-gradient-to-r from-purple-600 to-pink-600;
  }
  
  .glass {
    @apply bg-gray-900/50 backdrop-blur-lg border border-gray-800;
  }
}
EOF

echo ""
echo "✅ Step 6 Complete: UI Components created!"
echo ""
echo "📋 Created components:"
echo "  - Button"
echo "  - Card (with sub-components)"
echo "  - Input"
echo "  - Badge"
echo "  - Spinner"
echo "  - Utils (cn, formatDuration)"
echo ""
echo "🎨 Features:"
echo "  - Dark theme optimized"
echo "  - TailwindCSS classes"
echo "  - TypeScript types"
echo "  - Forwardref support"
echo ""
echo "Ready for Step 7: API Routes"
