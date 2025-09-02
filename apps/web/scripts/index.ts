// scripts/index.ts
// Главный файл для управления всеми проверками
// Запуск: npx tsx scripts/index.ts

import { exec } from 'child_process';
import { promisify } from 'util';
import { promises as fs } from 'fs';
import path from 'path';

const execAsync = promisify(exec);

// Цвета для консоли
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  bold: '\x1b[1m'
};

const log = {
  header: (msg: string) => console.log(`\n${colors.cyan}${colors.bold}═══ ${msg} ═══${colors.reset}\n`),
  success: (msg: string) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg: string) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  warning: (msg: string) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  info: (msg: string) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  cmd: (msg: string) => console.log(`${colors.magenta}$${colors.reset} ${msg}`)
};

// Определение типов проверок
interface CheckScript {
  name: string;
  file: string;
  description: string;
  category: 'health' | 'ui' | 'api' | 'data' | 'cleanup';
  autoFix?: boolean;
  critical?: boolean;
}

const SCRIPTS: CheckScript[] = [
  // Health checks
  {
    name: 'System Health',
    file: 'check-system.ts',
    description: 'Проверка всех файлов и окружения',
    category: 'health',
    critical: true
  },
  {
    name: 'Quick Status',
    file: 'quick-check.ts',
    description: 'Быстрая проверка состояния пользователя',
    category: 'health'
  },
  
  // UI checks
  {
    name: 'UI Flow',
    file: 'analyze-ui-flow.ts',
    description: 'Анализ пользовательского пути',
    category: 'ui',
    critical: true
  },
  {
    name: 'UI Components',
    file: 'check-ui-components.ts',
    description: 'Проверка всех UI компонентов',
    category: 'ui'
  },
  
  // API checks
  {
    name: 'API Tests',
    file: 'test-api.ts',
    description: 'Тестирование всех API endpoints',
    category: 'api',
    critical: true
  },
  {
    name: 'Auth Flow',
    file: 'test-api-auth.ts',
    description: 'Проверка авторизации',
    category: 'api'
  },
  {
    name: 'Spotify Flow',
    file: 'test-spotify-flow.ts',
    description: 'Проверка интеграции Spotify',
    category: 'api'
  },
  
  // Data checks
  {
    name: 'Storage Analysis',
    file: 'analyze-storage.ts',
    description: 'Анализ методов storage.ts',
    category: 'data'
  },
  {
    name: 'Data Integrity',
    file: 'check-data-integrity.ts',
    description: 'Проверка целостности data.json',
    category: 'data',
    autoFix: true
  },
  
  // Cleanup
  {
    name: 'Find Duplicates',
    file: 'find-duplicates.ts',
    description: 'Поиск дублирующегося кода',
    category: 'cleanup',
    autoFix: true
  },
  {
    name: 'Dead Code',
    file: 'find-dead-code.ts',
    description: 'Поиск неиспользуемого кода',
    category: 'cleanup',
    autoFix: true
  }
];

// Главное меню
async function showMenu() {
  log.header('tootFM Project Control System');
  
  console.log('Выберите действие:\n');
  console.log('  1. 🏥 Health Check - Полная проверка здоровья проекта');
  console.log('  2. 🚀 Quick Check - Быстрая проверка основных систем');
  console.log('  3. 🧪 Test All APIs - Протестировать все API');
  console.log('  4. 🎨 Check UI Flow - Проверить пользовательский путь');
  console.log('  5. 🗄️ Data Analysis - Анализ данных и storage');
  console.log('  6. 🧹 Cleanup - Найти и удалить дубликаты/мертвый код');
  console.log('  7. 🔧 Auto-Fix - Автоматически исправить найденные проблемы');
  console.log('  8. 📊 Full Report - Полный отчет о состоянии проекта');
  console.log('  9. 🚨 Critical Only - Только критические проверки');
  console.log('  0. Exit\n');
  
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  return new Promise<string>((resolve) => {
    readline.question('Ваш выбор: ', (answer: string) => {
      readline.close();
      resolve(answer);
    });
  });
}

// Запуск скрипта
async function runScript(script: CheckScript): Promise<boolean> {
  log.cmd(`npx tsx scripts/${script.file}`);
  
  try {
    const { stdout, stderr } = await execAsync(`npx tsx scripts/${script.file}`);
    
    if (stdout) console.log(stdout);
    if (stderr && !stderr.includes('Warning')) {
      console.error(stderr);
      return false;
    }
    
    return true;
  } catch (error) {
    log.error(`Failed to run ${script.name}`);
    if (error instanceof Error) {
      console.error(error.message);
    }
    return false;
  }
}

// Запуск категории скриптов
async function runCategory(category: string) {
  const scripts = SCRIPTS.filter(s => s.category === category);
  
  log.header(`Running ${category.toUpperCase()} checks`);
  
  let passed = 0;
  let failed = 0;
  
  for (const script of scripts) {
    log.info(`Running: ${script.description}`);
    const success = await runScript(script);
    
    if (success) {
      passed++;
    } else {
      failed++;
    }
  }
  
  console.log('\n' + '─'.repeat(50));
  log.info(`Results: ${passed} passed, ${failed} failed`);
  
  return failed === 0;
}

// Полная проверка здоровья
async function fullHealthCheck() {
  log.header('FULL HEALTH CHECK');
  
  const categories = ['health', 'ui', 'api', 'data'];
  const results: Record<string, boolean> = {};
  
  for (const category of categories) {
    results[category] = await runCategory(category);
  }
  
  // Итоговый отчет
  log.header('HEALTH CHECK SUMMARY');
  
  Object.entries(results).forEach(([category, passed]) => {
    if (passed) {
      log.success(`${category.toUpperCase()}: All checks passed`);
    } else {
      log.error(`${category.toUpperCase()}: Some checks failed`);
    }
  });
  
  // Генерация отчета
  await generateReport(results);
}

// Генерация отчета
async function generateReport(results: Record<string, boolean>) {
  const reportPath = path.join(process.cwd(), 'health-report.md');
  
  let report = `# tootFM Health Report\n\n`;
  report += `Generated: ${new Date().toISOString()}\n\n`;
  
  report += `## Summary\n\n`;
  
  Object.entries(results).forEach(([category, passed]) => {
    const emoji = passed ? '✅' : '❌';
    report += `- ${emoji} **${category.toUpperCase()}**: ${passed ? 'Passed' : 'Failed'}\n`;
  });
  
  report += `\n## Recommendations\n\n`;
  
  if (!results.ui) {
    report += `- Fix UI flow issues\n`;
    report += `  - Check that Spotify button is removed from auth page\n`;
    report += `  - Restore party list on main page\n`;
    report += `  - Add profile link\n\n`;
  }
  
  if (!results.api) {
    report += `- Fix API endpoints\n`;
    report += `  - Check Spotify token refresh\n`;
    report += `  - Implement unified portrait endpoint\n\n`;
  }
  
  if (!results.data) {
    report += `- Fix data integrity\n`;
    report += `  - Clean up orphaned records\n`;
    report += `  - Validate foreign keys\n\n`;
  }
  
  await fs.writeFile(reportPath, report);
  log.success(`Report saved to: health-report.md`);
}

// Автоматическое исправление
async function autoFix() {
  log.header('AUTO-FIX MODE');
  
  const fixableScripts = SCRIPTS.filter(s => s.autoFix);
  
  log.info(`Found ${fixableScripts.length} auto-fixable issues`);
  
  for (const script of fixableScripts) {
    log.info(`Fixing: ${script.description}`);
    
    // Здесь добавить логику автоисправления
    // Например, запуск скрипта с параметром --fix
    await execAsync(`npx tsx scripts/${script.file} --fix`);
  }
  
  log.success('Auto-fix completed');
}

// Только критические проверки
async function criticalOnly() {
  const critical = SCRIPTS.filter(s => s.critical);
  
  log.header('CRITICAL CHECKS ONLY');
  
  for (const script of critical) {
    log.warning(`Critical: ${script.description}`);
    const success = await runScript(script);
    
    if (!success) {
      log.error(`CRITICAL FAILURE: ${script.name}`);
      log.info('Fix this issue before proceeding!');
      return false;
    }
  }
  
  log.success('All critical checks passed');
  return true;
}

// Main execution
async function main() {
  while (true) {
    const choice = await showMenu();
    
    switch (choice) {
      case '1':
        await fullHealthCheck();
        break;
      case '2':
        await runScript(SCRIPTS.find(s => s.file === 'quick-check.ts')!);
        break;
      case '3':
        await runCategory('api');
        break;
      case '4':
        await runCategory('ui');
        break;
      case '5':
        await runCategory('data');
        break;
      case '6':
        await runCategory('cleanup');
        break;
      case '7':
        await autoFix();
        break;
      case '8':
        await fullHealthCheck();
        break;
      case '9':
        await criticalOnly();
        break;
      case '0':
        log.info('Exiting...');
        process.exit(0);
      default:
        log.warning('Invalid choice');
    }
    
    console.log('\n' + '═'.repeat(60) + '\n');
  }
}

// Запуск
if (require.main === module) {
  main().catch(console.error);
}

export { runScript, runCategory, fullHealthCheck, criticalOnly };