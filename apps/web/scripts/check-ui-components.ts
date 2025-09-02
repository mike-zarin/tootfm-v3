// scripts/check-ui-components.ts
// Проверка и создание недостающих UI компонентов
// Запуск: npx tsx scripts/check-ui-components.ts

import { promises as fs } from 'fs';
import path from 'path';

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function checkComponents() {
  console.log('\n🔍 Checking UI Components...\n');
  
  const projectRoot = '/Users/mz/tootfm-v3/apps/web';
  const componentsDir = path.join(projectRoot, 'components/ui');
  
  // List of UI components that might be needed
  const requiredComponents = [
    'button.tsx',
    'card.tsx',
    'badge.tsx',
    'progress.tsx',
    'input.tsx',
    'label.tsx',
    'form.tsx',
    'dialog.tsx',
    'alert.tsx',
    'separator.tsx',
    'toast.tsx'
  ];
  
  const missing: string[] = [];
  const existing: string[] = [];
  
  for (const component of requiredComponents) {
    const componentPath = path.join(componentsDir, component);
    if (await fileExists(componentPath)) {
      existing.push(component);
      console.log(`${colors.green}✓${colors.reset} ${component}`);
    } else {
      missing.push(component);
      console.log(`${colors.red}✗${colors.reset} ${component} - MISSING`);
    }
  }
  
  // Check for icons components
  console.log('\n🎨 Checking Icon Components...\n');
  
  const iconsPath = path.join(projectRoot, 'components/icons');
  const iconsExist = await fileExists(iconsPath);
  
  if (!iconsExist) {
    console.log(`${colors.yellow}⚠${colors.reset} components/icons directory not found`);
    console.log('  Creating icons components...');
    
    // Create icons directory
    await fs.mkdir(iconsPath, { recursive: true });
    
    // Create SpotifyIcon and AppleMusicIcon
    const iconsContent = `// components/icons/index.tsx
import React from 'react';

export function SpotifyIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
    </svg>
  );
}

export function AppleMusicIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.994 6.124a9.23 9.23 0 00-.24-2.19c-.317-1.31-1.062-2.31-2.18-3.043a5.022 5.022 0 00-1.877-.726 10.496 10.496 0 00-1.564-.15c-.04-.003-.083-.01-.124-.013H5.99c-.152.01-.303.017-.455.026-.747.043-1.49.123-2.193.4-1.336.53-2.3 1.452-2.865 2.78-.192.448-.292.925-.363 1.408-.056.392-.088.785-.1 1.18 0 .032-.007.062-.01.093v12.223c.01.14.017.283.027.424.05.815.154 1.624.497 2.373.65 1.42 1.738 2.353 3.234 2.801.42.127.856.187 1.293.228.555.053 1.11.06 1.667.06h11.03a12.5 12.5 0 001.57-.1c.822-.078 1.596-.31 2.3-.81a4.097 4.097 0 001.518-1.705c.228-.448.349-.93.418-1.427.061-.434.09-.87.104-1.305.011-.04.014-.082.017-.124V6.124zm-5.965 9.31c0 .806-.186 1.557-.736 2.078-.532.502-1.263.73-1.997.73-.78 0-1.549-.256-2.105-.815-.584-.585-.855-1.385-.855-2.194 0-.893.303-1.665.954-2.164.622-.478 1.441-.623 2.229-.448v-4.16l-5.665 1.054v6.827c0 .807-.185 1.558-.735 2.08-.532.5-1.263.728-1.998.728-.78 0-1.548-.255-2.104-.814-.585-.585-.856-1.385-.856-2.194 0-.893.303-1.665.954-2.164.622-.478 1.44-.623 2.228-.448V6.838c0-.62.435-1.14 1.03-1.265l7.29-1.357c.658-.122 1.33.317 1.331 1.005v10.213z"/>
    </svg>
  );
}
`;
    
    await fs.writeFile(path.join(iconsPath, 'index.tsx'), iconsContent);
    console.log(`${colors.green}✓${colors.reset} Created components/icons/index.tsx`);
  } else {
    console.log(`${colors.green}✓${colors.reset} components/icons exists`);
  }
  
  // Summary
  console.log('\n📊 Summary:\n');
  console.log(`  Existing components: ${existing.length}`);
  console.log(`  Missing components: ${missing.length}`);
  
  if (missing.length > 0) {
    console.log(`\n${colors.yellow}To fix missing components:${colors.reset}`);
    console.log('1. Install shadcn/ui components:');
    console.log('   npx shadcn-ui@latest add button card badge progress input');
    console.log('\n2. Or use the simple versions created by this script');
  }
}

// Run check
checkComponents().catch(console.error);