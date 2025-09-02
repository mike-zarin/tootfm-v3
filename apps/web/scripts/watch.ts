// scripts/watch.ts
// Автоматическая проверка при изменении файлов
// Запуск: npx tsx scripts/watch.ts

import { watch } from 'fs';
import { promises as fs } from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  dim: '\x1b[2m'
};

const log = {
  change: (file: string) => console.log(`${colors.yellow}📝${colors.reset} Changed: ${file}`),
  checking: (what: string) => console.log(`${colors.blue}🔍${colors.reset} Checking ${what}...`),
  success: (msg: string) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg: string) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  info: (msg: string) => console.log(`${colors.dim}${msg}${colors.reset}`)
};

// Конфигурация наблюдения
const WATCH_DIRS = [
  'app',
  'components', 
  'lib',
  'types'
];

const IGNORE_PATTERNS = [
  'node_modules',
  '.next',
  '.git',
  'dist'
];

// Кэш для предотвращения множественных проверок
const checkCache = new Map<string, number>();
const DEBOUNCE_MS = 1000;

// Типы проверок для разных файлов
interface FileCheck {
  pattern: RegExp;
  checks: string[];
}

const FILE_CHECKS: FileCheck[] = [
  {
    pattern: /storage\.ts$/,
    checks: ['storage-methods', 'data-integrity']
  },
  {
    pattern: /\/api\/.+\/route\.ts$/,
    checks: ['api-endpoint', 'typescript']
  },
  {
    pattern: /\/components\/.+\.tsx$/,
    checks: ['component-imports', 'typescript']
  },
  {
    pattern: /page\.tsx$/,
    checks: ['page-structure', 'ui-flow']
  },
  {
    pattern: /auth.*\.ts$/,
    checks: ['auth-flow', 'env-vars']
  }
];

// Проверка файла
async function checkFile(filePath: string) {
  const relativePath = path.relative(process.cwd(), filePath);
  
  // Проверка debounce
  const lastCheck = checkCache.get(relativePath);
  const now = Date.now();
  
  if (lastCheck && now - lastCheck < DEBOUNCE_MS) {
    return;
  }
  
  checkCache.set(relativePath, now);
  
  log.change(relativePath);
  
  // Определяем какие проверки нужны
  const checks = new Set<string>();
  
  for (const fileCheck of FILE_CHECKS) {
    if (fileCheck.pattern.test(relativePath)) {
      fileCheck.checks.forEach(check => checks.add(check));
    }
  }
  
  // Выполняем проверки
  for (const check of checks) {
    await runCheck(check, relativePath);
  }
}

// Запуск конкретной проверки
async function runCheck(checkType: string, filePath: string) {
  log.checking(checkType);
  
  try {
    switch (checkType) {
      case 'typescript':
        await execAsync(`npx tsc --noEmit ${filePath}`);
        log.success('TypeScript OK');
        break;
        
      case 'storage-methods':
        const content = await fs.readFile(filePath, 'utf-8');
        const methods = content.match(/async\s+(\w+)\s*\(/g) || [];
        log.info(`Found ${methods.length} methods`);
        break;
        
      case 'api-endpoint':
        const apiContent = await fs.readFile(filePath, 'utf-8');
        const hasGET = apiContent.includes('export async function GET');
        const hasPOST = apiContent.includes('export async function POST');
        
        if (hasGET) log.info('Has GET handler');
        if (hasPOST) log.info('Has POST handler');
        
        if (!hasGET && !hasPOST) {
          log.error('No HTTP handlers found!');
        }
        break;
        
      case 'component-imports':
        const compContent = await fs.readFile(filePath, 'utf-8');
        
        // Проверка импортов
        if (compContent.includes("from 'react'") || compContent.includes('from "react"')) {
          log.success('React imported');
        }
        
        // Проверка хуков
        const hooks = compContent.match(/use[A-Z]\w+/g) || [];
        if (hooks.length > 0) {
          log.info(`Uses hooks: ${hooks.join(', ')}`);
        }
        break;
        
      case 'auth-flow':
        log.info('Checking auth configuration...');
        // Здесь можно добавить специфичные проверки для auth
        break;
        
      case 'data-integrity':
        // Проверка что storage методы не ломают data.json
        log.info('Checking data integrity...');
        
        try {
          const dataPath = path.join(process.cwd(), 'data.json');
          const data = await fs.readFile(dataPath, 'utf-8');
          JSON.parse(data); // Проверка валидности JSON
          log.success('data.json is valid');
        } catch {
          log.error('data.json is corrupted!');
        }
        break;
        
      case 'ui-flow':
        log.info('UI flow check requires manual review');
        break;
        
      case 'page-structure':
        const pageContent = await fs.readFile(filePath, 'utf-8');
        
        // Проверка основных элементов страницы
        if (pageContent.includes('export default')) {
          log.success('Has default export');
        } else {
          log.error('Missing default export');
        }
        
        if (pageContent.includes('return')) {
          log.success('Has return statement');
        }
        break;
        
      case 'env-vars':
        // Проверка использования env переменных
        const envContent = await fs.readFile(filePath, 'utf-8');
        const envVars = envContent.match(/process\.env\.(\w+)/g) || [];
        
        if (envVars.length > 0) {
          log.info(`Uses env vars: ${envVars.join(', ')}`);
          
          // Проверяем что они определены
          const envPath = path.join(process.cwd(), '.env.local');
          try {
            const envFile = await fs.readFile(envPath, 'utf-8');
            
            for (const envVar of envVars) {
              const varName = envVar.replace('process.env.', '');
              if (!envFile.includes(`${varName}=`)) {
                log.error(`Missing env var: ${varName}`);
              }
            }
          } catch {
            log.error('.env.local not found');
          }
        }
        break;
    }
  } catch (error) {
    log.error(`Check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Рекурсивное наблюдение за директорией
async function watchDirectory(dir: string) {
  const watcher = watch(dir, { recursive: true }, async (eventType, filename) => {
    if (!filename) return;
    
    // Игнорируем некоторые файлы
    if (IGNORE_PATTERNS.some(pattern => filename.includes(pattern))) {
      return;
    }
    
    // Проверяем только TS/TSX файлы
    if (!filename.endsWith('.ts') && !filename.endsWith('.tsx')) {
      return;
    }
    
    const fullPath = path.join(dir, filename);
    
    try {
      const stats = await fs.stat(fullPath);
      if (stats.isFile()) {
        await checkFile(fullPath);
      }
    } catch {
      // Файл был удален
    }
  });
  
  return watcher;
}

// Главная функция
async function main() {
  console.log(`${colors.cyan}╔════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.cyan}║     tootFM Watch Mode Activated       ║${colors.reset}`);
  console.log(`${colors.cyan}╚════════════════════════════════════════╝${colors.reset}\n`);
  
  log.info('Watching for changes in:');
  WATCH_DIRS.forEach(dir => log.info(`  • ${dir}/`));
  
  console.log('\n' + colors.dim + 'Press Ctrl+C to stop' + colors.reset + '\n');
  console.log('─'.repeat(50) + '\n');
  
  // Запускаем наблюдение
  const watchers = [];
  
  for (const dir of WATCH_DIRS) {
    const fullPath = path.join(process.cwd(), dir);
    
    try {
      await fs.access(fullPath);
      const watcher = await watchDirectory(fullPath);
      watchers.push(watcher);
    } catch {
      log.error(`Directory not found: ${dir}`);
    }
  }
  
  // Обработка выхода
  process.on('SIGINT', () => {
    console.log('\n\n' + colors.yellow + 'Stopping watch mode...' + colors.reset);
    
    watchers.forEach(w => w.close());
    
    console.log(colors.green + 'Watch mode stopped' + colors.reset);
    process.exit(0);
  });
  
  // Держим процесс активным
  await new Promise(() => {});
}

// Запуск
if (require.main === module) {
  main().catch(console.error);
}