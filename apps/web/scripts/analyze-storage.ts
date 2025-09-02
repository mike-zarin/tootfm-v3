// scripts/analyze-storage.ts
// Анализирует методы в storage.ts
// Запуск: npx tsx scripts/analyze-storage.ts

import { promises as fs } from 'fs';
import path from 'path';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  red: '\x1b[31m',
};

async function analyzeStorage() {
  console.log(`\n${colors.cyan}═══ Storage.ts Analysis ═══${colors.reset}\n`);
  
  const storagePath = path.join(process.cwd(), 'lib/storage.ts');
  
  try {
    const content = await fs.readFile(storagePath, 'utf-8');
    
    // Find all methods in Storage class
    console.log(`${colors.blue}📦 Storage Class Methods:${colors.reset}\n`);
    
    // Find method signatures
    const methodRegex = /^\s*(public\s+)?(\w+)\s*\([^)]*\)\s*(?::\s*[^{]+)?\s*{/gm;
    const methods: string[] = [];
    
    let match;
    while ((match = methodRegex.exec(content)) !== null) {
      if (match[2] && !match[2].startsWith('constructor')) {
        methods.push(match[2]);
      }
    }
    
    // Check for specific party-related methods
    const partyMethods = [
      'getAllParties',
      'getParty',
      'createParty',
      'updateParty',
      'deleteParty',
      'getPartiesByUser',
      'getActiveParties'
    ];
    
    console.log(`${colors.yellow}Party Methods:${colors.reset}`);
    partyMethods.forEach(method => {
      if (methods.includes(method) || content.includes(`${method}(`)) {
        console.log(`  ${colors.green}✓${colors.reset} ${method}`);
      } else {
        console.log(`  ${colors.red}✗${colors.reset} ${method} - NOT FOUND`);
      }
    });
    
    // Check for user methods
    console.log(`\n${colors.yellow}User Methods:${colors.reset}`);
    const userMethods = [
      'getUser',
      'getUserByEmail',
      'createUser',
      'updateUser',
      'deleteUser'
    ];
    
    userMethods.forEach(method => {
      if (methods.includes(method) || content.includes(`${method}(`)) {
        console.log(`  ${colors.green}✓${colors.reset} ${method}`);
      } else {
        console.log(`  ${colors.red}✗${colors.reset} ${method}`);
      }
    });
    
    // Check how data is accessed
    console.log(`\n${colors.yellow}Data Access Pattern:${colors.reset}`);
    
    if (content.includes('this.data.parties')) {
      console.log(`  ${colors.green}✓${colors.reset} Direct access: this.data.parties`);
    }
    
    if (content.includes('export const storage')) {
      console.log(`  ${colors.green}✓${colors.reset} Singleton export: storage`);
    }
    
    // Check what's in the data structure
    const dataStructureMatch = content.match(/interface\s+StorageData\s*{([^}]+)}/);
    if (dataStructureMatch) {
      console.log(`\n${colors.yellow}Data Structure:${colors.reset}`);
      const fields = dataStructureMatch[1].match(/(\w+):/g);
      if (fields) {
        fields.forEach(field => {
          console.log(`  - ${field.replace(':', '')}`);
        });
      }
    }
    
    // Show all found methods
    console.log(`\n${colors.blue}All Methods Found:${colors.reset}`);
    methods.forEach(method => {
      console.log(`  • ${method}()`);
    });
    
    // Recommendations
    console.log(`\n${colors.cyan}═══ Recommendations ═══${colors.reset}\n`);
    
    if (!methods.includes('getAllParties')) {
      console.log(`${colors.yellow}Option 1:${colors.reset} Add getAllParties() method to storage.ts`);
      console.log(`${colors.green}Option 2:${colors.reset} Use storage.data.parties directly in page.tsx`);
      console.log(`\n${colors.blue}Safer choice:${colors.reset} Option 2 - won't break existing code`);
    } else {
      console.log(`${colors.green}✓${colors.reset} getAllParties() exists - use it!`);
    }
    
    // Check where storage is used
    console.log(`\n${colors.cyan}═══ Storage Usage Check ═══${colors.reset}\n`);
    
    const filesToCheck = [
      'app/page.tsx',
      'app/api/parties/route.ts',
      'app/api/parties/[id]/route.ts',
      'app/party/[id]/page.tsx'
    ];
    
    for (const file of filesToCheck) {
      const filePath = path.join(process.cwd(), file);
      try {
        const fileContent = await fs.readFile(filePath, 'utf-8');
        
        console.log(`${colors.blue}${file}:${colors.reset}`);
        
        if (fileContent.includes('getAllParties')) {
          console.log(`  ${colors.red}⚠${colors.reset} Uses getAllParties()`);
        }
        if (fileContent.includes('storage.data.parties')) {
          console.log(`  ${colors.green}✓${colors.reset} Uses storage.data.parties`);
        }
        if (fileContent.includes('getParty')) {
          console.log(`  Uses getParty()`);
        }
      } catch {
        // File doesn't exist, skip
      }
    }
    
  } catch (error) {
    console.error(`${colors.red}Error reading storage.ts:${colors.reset}`, error);
  }
}

analyzeStorage().catch(console.error);