#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Функция для рекурсивного поиска файлов
function findFiles(dir, extensions) {
  let results = [];
  const list = fs.readdirSync(dir);
  
  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat && stat.isDirectory()) {
      // Пропускаем node_modules, .next, .git
      if (!['node_modules', '.next', '.git', 'dist', 'build'].includes(file)) {
        results = results.concat(findFiles(filePath, extensions));
      }
    } else {
      const ext = path.extname(file);
      if (extensions.includes(ext)) {
        results.push(filePath);
      }
    }
  });
  
  return results;
}

// Функция для очистки console.log
function cleanConsoleLogs(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;
    let changes = 0;
    
    // Удаляем console.log (но не console.error)
    content = content.replace(/^\s*console\.log\([^)]*\);\s*$/gm, '');
    changes += (originalContent.match(/^\s*console\.log\([^)]*\);\s*$/gm) || []).length;
    
    // Удаляем console.info
    content = content.replace(/^\s*console\.info\([^)]*\);\s*$/gm, '');
    changes += (originalContent.match(/^\s*console\.info\([^)]*\);\s*$/gm) || []).length;
    
    // Удаляем console.debug
    content = content.replace(/^\s*console\.debug\([^)]*\);\s*$/gm, '');
    changes += (originalContent.match(/^\s*console\.debug\([^)]*\);\s*$/gm) || []).length;
    
    // Удаляем console.warn (но не console.error)
    content = content.replace(/^\s*console\.warn\([^)]*\);\s*$/gm, '');
    changes += (originalContent.match(/^\s*console\.warn\([^)]*\);\s*$/gm) || []).length;
    
    // Заменяем console.error на [ERROR] префикс
    content = content.replace(/console\.error\(/g, 'console.error(\'[ERROR]\' + \' \' + ');
    
    // Удаляем пустые строки
    content = content.replace(/^\s*\n/gm, '');
    
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Cleaned ${filePath}: ${changes} console statements removed`);
      return changes;
    }
    
    return 0;
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
    return 0;
  }
}

// Основная функция
function main() {
  const targetDir = process.argv[2] || './apps/web';
  const extensions = ['.ts', '.tsx', '.js', '.jsx'];
  
  console.log(`Cleaning console.log from ${targetDir}...`);
  
  const files = findFiles(targetDir, extensions);
  let totalChanges = 0;
  let filesChanged = 0;
  
  files.forEach(file => {
    // Пропускаем backup файлы и скрипты
    if (file.includes('.backup') || file.includes('.bak') || file.includes('scripts/')) {
      return;
    }
    
    const changes = cleanConsoleLogs(file);
    if (changes > 0) {
      totalChanges += changes;
      filesChanged++;
    }
  });
  
  console.log(`\nCleaning complete!`);
  console.log(`Files changed: ${filesChanged}`);
  console.log(`Total console statements removed: ${totalChanges}`);
}

if (require.main === module) {
  main();
}

module.exports = { cleanConsoleLogs, findFiles };
