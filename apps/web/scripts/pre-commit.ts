// scripts/pre-commit.ts
// Git pre-commit hook для автоматической проверки перед коммитом
// Установка: npx tsx scripts/setup-hooks.ts

import { execSync } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

const log = {
  success: (msg: string) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg: string) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  warning: (msg: string) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  info: (msg: string) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`)
};

// Проверки перед коммитом
async function preCommitChecks(): Promise<boolean> {
  console.log('\n🔍 Running pre-commit checks...\n');
  
  let hasErrors = false;
  
  // 1. Проверка TypeScript компиляции
  try {
    log.info('Checking TypeScript...');
    execSync('npx tsc --noEmit', { stdio: 'pipe' });
    log.success('TypeScript compilation passed');
  } catch (error) {
    log.error('TypeScript compilation failed');
    hasErrors = true;
  }
  
  // 2. Проверка что нет "temporary" в data.json
  try {
    const dataPath = path.join(process.cwd(), 'data.json');
    const data = await fs.readFile(dataPath, 'utf-8');
    
    if (data.includes('"temporary"')) {
      log.warning('Found "temporary" tokens in data.json');
      log.info('Consider cleaning data before commit');
    }
  } catch {
    // data.json может не существовать
  }
  
  // 3. Проверка конфликтов в маршрутах
  const routes = [
    'app/api/auth/callback/spotify', // NextAuth
    'app/api/auth/spotify/callback'   // Custom
  ];
  
  let routeConflict = false;
  for (const route of routes) {
    const routePath = path.join(process.cwd(), route, 'route.ts');
    try {
      await fs.access(routePath);
      if (!routeConflict) {
        log.warning('Potential route conflict detected');
        routeConflict = true;
      }
    } catch {
      // Route doesn't exist - good
    }
  }
  
  // 4. Проверка критических файлов
  const criticalFiles = [
    'lib/storage.ts',
    'app/api/auth/[...nextauth]/route.ts',
    'app/page.tsx'
  ];
  
  for (const file of criticalFiles) {
    try {
      await fs.access(path.join(process.cwd(), file));
    } catch {
      log.error(`Critical file missing: ${file}`);
      hasErrors = true;
    }
  }
  
  // 5. Проверка измененных файлов
  try {
    const changed = execSync('git diff --cached --name-only', { encoding: 'utf-8' });
    const files = changed.trim().split('\n').filter(Boolean);
    
    log.info(`Checking ${files.length} changed files...`);
    
    for (const file of files) {
      // Проверка что нет console.log в продакшн коде
      if (file.endsWith('.ts') || file.endsWith('.tsx')) {
        const content = await fs.readFile(file, 'utf-8');
        
        if (content.includes('console.log') && !file.includes('scripts/')) {
          log.warning(`console.log found in ${file}`);
        }
        
        // Проверка TODO комментариев
        if (content.includes('TODO') || content.includes('FIXME')) {
          log.warning(`TODO/FIXME found in ${file}`);
        }
      }
    }
  } catch {
    // No staged files
  }
  
  if (hasErrors) {
    log.error('\n❌ Pre-commit checks failed');
    log.info('Fix the issues above and try again');
    return false;
  }
  
  log.success('\n✅ All pre-commit checks passed');
  return true;
}

// Запуск
if (require.main === module) {
  preCommitChecks().then(success => {
    process.exit(success ? 0 : 1);
  });
}