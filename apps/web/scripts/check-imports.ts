// scripts/check-imports.ts
// Запуск: npx tsx scripts/check-imports.ts
// Проверяет правильность импортов в проекте

import { promises as fs } from 'fs';
import path from 'path';

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

const log = {
  success: (msg: string) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg: string) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  warning: (msg: string) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  info: (msg: string) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  header: (msg: string) => console.log(`\n${colors.cyan}═══ ${msg} ═══${colors.reset}\n`),
};

async function checkFile(filePath: string): Promise<{ exists: boolean; exports?: string[] }> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    
    // Находим все экспорты
    const exports: string[] = [];
    
    // export function name
    const funcMatches = content.matchAll(/export\s+(?:async\s+)?function\s+(\w+)/g);
    for (const match of funcMatches) {
      exports.push(match[1]);
    }
    
    // export const name
    const constMatches = content.matchAll(/export\s+const\s+(\w+)/g);
    for (const match of constMatches) {
      exports.push(match[1]);
    }
    
    // export { name }
    const namedMatches = content.matchAll(/export\s+\{\s*([^}]+)\s*\}/g);
    for (const match of namedMatches) {
      const names = match[1].split(',').map(n => n.trim().split(/\s+as\s+/)[0]);
      exports.push(...names);
    }
    
    return { exists: true, exports };
  } catch {
    return { exists: false };
  }
}

async function checkImports() {
  log.header('Checking Project Structure and Imports');
  
  const projectRoot = '/Users/mz/tootfm-v3/apps/web';
  
  // 1. Проверяем auth config файлы
  log.header('Auth Configuration Files');
  
  const authFiles = [
    'lib/auth-config.ts',
    'lib/auth-options.ts',
    'lib/auth.ts'
  ];
  
  let authOptionsFile: string | null = null;
  
  for (const file of authFiles) {
    const fullPath = path.join(projectRoot, file);
    const result = await checkFile(fullPath);
    
    if (result.exists) {
      log.success(`${file} exists`);
      if (result.exports?.includes('authOptions')) {
        log.info(`  → exports authOptions ✓`);
        authOptionsFile = file;
      }
      if (result.exports?.length) {
        log.info(`  → exports: ${result.exports.join(', ')}`);
      }
    } else {
      log.warning(`${file} not found`);
    }
  }
  
  if (!authOptionsFile) {
    log.error('No file exports authOptions!');
  } else {
    log.success(`authOptions found in: ${authOptionsFile}`);
  }
  
  // 2. Проверяем Apple Music JWT файл
  log.header('Apple Music JWT File');
  
  const appleJwtPath = path.join(projectRoot, 'lib/apple-music-jwt.ts');
  const appleResult = await checkFile(appleJwtPath);
  
  if (appleResult.exists) {
    log.success('lib/apple-music-jwt.ts exists');
    if (appleResult.exports?.length) {
      log.info(`Exports: ${appleResult.exports.join(', ')}`);
      
      if (appleResult.exports.includes('generateAppleMusicToken')) {
        log.success('  → generateAppleMusicToken ✓');
      } else if (appleResult.exports.includes('generateAppleToken')) {
        log.warning('  → exports generateAppleToken (should be generateAppleMusicToken)');
      } else {
        log.error('  → missing token generation function');
      }
    }
  } else {
    log.error('lib/apple-music-jwt.ts not found');
  }
  
  // 3. Проверяем Spotify файл
  log.header('Spotify Integration File');
  
  const spotifyPath = path.join(projectRoot, 'lib/spotify.ts');
  const spotifyResult = await checkFile(spotifyPath);
  
  if (spotifyResult.exists) {
    log.success('lib/spotify.ts exists');
    if (spotifyResult.exports?.length) {
      log.info(`Exports: ${spotifyResult.exports.join(', ')}`);
    }
  }
  
  // 4. Проверяем Storage
  log.header('Storage File');
  
  const storagePath = path.join(projectRoot, 'lib/storage.ts');
  const storageResult = await checkFile(storagePath);
  
  if (storageResult.exists) {
    log.success('lib/storage.ts exists');
    if (storageResult.exports?.includes('storage')) {
      log.success('  → exports storage ✓');
    }
  }
  
  // 5. Генерируем правильные импорты
  log.header('Correct Import Statements');
  
  log.info('For Apple Music Token route, use:');
  
  if (authOptionsFile) {
    const authImportPath = authOptionsFile.replace('.ts', '').replace('lib/', '@/lib/');
    log.success(`import { authOptions } from '${authImportPath}';`);
  }
  
  if (appleResult.exports?.includes('generateAppleMusicToken')) {
    log.success(`import { generateAppleMusicToken } from '@/lib/apple-music-jwt';`);
  } else {
    log.warning('Fix the export name in apple-music-jwt.ts first');
  }
  
  // 6. Проверяем все API routes на правильность импортов
  log.header('Checking API Routes');
  
  const apiRoutes = [
    'app/api/auth/[...nextauth]/route.ts',
    'app/api/music/portrait/route.ts',
    'app/api/music/unified-portrait/route.ts',
    'app/api/auth/spotify/callback/route.ts',
    'app/api/auth/apple-music/callback/route.ts',
  ];
  
  for (const route of apiRoutes) {
    const fullPath = path.join(projectRoot, route);
    try {
      const content = await fs.readFile(fullPath, 'utf-8');
      
      // Проверяем импорты authOptions
      if (content.includes('authOptions')) {
        const authImportMatch = content.match(/from ['"]([^'"]+)['"]/g);
        if (authImportMatch) {
          const hasCorrectImport = authImportMatch.some(m => 
            m.includes('auth-options') || m.includes('auth-config')
          );
          
          if (hasCorrectImport) {
            log.success(`${route} - authOptions import ✓`);
          } else {
            log.warning(`${route} - check authOptions import`);
          }
        }
      }
    } catch {
      // File doesn't exist, skip
    }
  }
  
  // 7. Итоговые рекомендации
  log.header('Summary');
  
  if (!authOptionsFile) {
    log.error('CRITICAL: No authOptions export found!');
    log.info('Create lib/auth-options.ts with authOptions export');
  }
  
  log.info('\nRecommended file structure:');
  log.info('lib/');
  log.info('  ├── auth-options.ts  (exports authOptions for NextAuth)');
  log.info('  ├── storage.ts       (exports storage)');
  log.info('  ├── spotify.ts       (Spotify API helpers)');
  log.info('  ├── apple-music-jwt.ts (exports generateAppleMusicToken)');
  log.info('  └── apple-music-api.ts (Apple Music API client)');
}

// Запуск
checkImports().catch(console.error);