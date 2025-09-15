import * as fs from 'fs';
import * as path from 'path';

console.log("=== TootFM Migration Audit ===\n");

// 1. Проверка auth конфигураций
const authFiles = [
  'apps/web/lib/auth-options.ts',
  'packages/auth/src/auth-config.ts'
];

console.log("📁 Auth Configuration Files:");
authFiles.forEach(file => {
  const exists = fs.existsSync(file);
  console.log(`  ${exists ? '✅' : '❌'} ${file}`);
});

// 2. Проверка storage использования
const storageImports: string[] = [];
const checkDir = (dir: string) => {
  try {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory() && !file.includes('node_modules') && !file.startsWith('.')) {
        checkDir(fullPath);
      } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
        const content = fs.readFileSync(fullPath, 'utf-8');
        if (content.includes("from '@/lib/storage'") || content.includes('from "../lib/storage"') || content.includes('from "../../lib/storage"')) {
          storageImports.push(fullPath.replace(process.cwd() + '/', ''));
        }
      }
    });
  } catch (e) {
    // Ignore permission errors
  }
};

console.log("\n📦 Files using storage.ts:");
checkDir('apps/web/app');
checkDir('apps/web/components');
checkDir('apps/web/lib');
storageImports.forEach(file => console.log(`  - ${file}`));

// 3. TypeScript errors count
console.log("\n⚠️ TypeScript Status:");
try {
  const { execSync } = require('child_process');
  execSync('npm run type-check', { cwd: 'apps/web', stdio: 'pipe' });
  console.log("  ✅ No TypeScript errors");
} catch (e: any) {
  const output = e.stdout?.toString() || e.stderr?.toString() || '';
  const errorCount = (output.match(/error TS/g) || []).length;
  console.log(`  ❌ ${errorCount} TypeScript errors found`);
}

// 4. Критические файлы
console.log("\n🔴 Critical Files Status:");
const criticalFiles = [
  'apps/web/data.json',
  'apps/web/.env.local',
  'apps/web/lib/storage.ts'
];
criticalFiles.forEach(file => {
  const exists = fs.existsSync(file);
  console.log(`  ${exists ? '✅' : '❌'} ${file}`);
});

// 5. Проверка package.json зависимостей
console.log("\n📋 Package Dependencies:");
try {
  const packageJson = JSON.parse(fs.readFileSync('apps/web/package.json', 'utf-8'));
  const hasPrisma = packageJson.dependencies?.prisma || packageJson.devDependencies?.prisma;
  const hasPostgres = packageJson.dependencies?.['@vercel/postgres'] || packageJson.devDependencies?.['@vercel/postgres'];
  console.log(`  ${hasPrisma ? '✅' : '❌'} Prisma: ${hasPrisma || 'Not found'}`);
  console.log(`  ${hasPostgres ? '✅' : '❌'} Vercel Postgres: ${hasPostgres || 'Not found'}`);
} catch (e) {
  console.log("  ❌ Could not read package.json");
}

// 6. Проверка Prisma schema
console.log("\n🗄️ Database Configuration:");
const prismaSchema = 'packages/database/prisma/schema.prisma';
if (fs.existsSync(prismaSchema)) {
  const schema = fs.readFileSync(prismaSchema, 'utf-8');
  const hasPostgresProvider = schema.includes('provider = "postgresql"');
  const hasSqliteProvider = schema.includes('provider = "sqlite"');
  console.log(`  ${hasPostgresProvider ? '✅' : '❌'} PostgreSQL provider: ${hasPostgresProvider ? 'Found' : 'Not found'}`);
  console.log(`  ${hasSqliteProvider ? '⚠️' : '✅'} SQLite provider: ${hasSqliteProvider ? 'Found (needs migration)' : 'Not found'}`);
} else {
  console.log("  ❌ Prisma schema not found");
}

console.log("\n=== Audit Complete ===");
