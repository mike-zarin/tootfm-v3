#!/usr/bin/env tsx
// apps/web/scripts/pre-deploy-check.ts
// Автоматическая проверка готовности к деплою

import fs from 'fs/promises';
import path from 'path';

interface CheckResult {
  name: string;
  status: 'PASS' | 'FAIL' | 'WARN';
  message: string;
  critical: boolean;
}

class PreDeployChecker {
  private results: CheckResult[] = [];

  async runAllChecks(): Promise<void> {
    console.log('🔍 TootFM v3 - Pre-Deploy Check\n');

    await this.checkEnvVariables();
    await this.checkCriticalFiles();
    await this.checkAPIRoutes();
    await this.checkDataStructure();
    await this.checkTypeScriptBuild();
    await this.checkSecurity();

    this.printResults();
  }

  private async checkEnvVariables(): Promise<void> {
    console.log('📋 Checking environment variables...');
    
    const requiredVars = [
      'NEXTAUTH_URL',
      'NEXTAUTH_SECRET',
      'GOOGLE_CLIENT_ID',
      'GOOGLE_CLIENT_SECRET',
      'SPOTIFY_CLIENT_ID',
      'SPOTIFY_CLIENT_SECRET',
      'SPOTIFY_REDIRECT_URI',
      'PUSHER_APP_ID',
      'PUSHER_KEY',
      'PUSHER_SECRET',
      'PUSHER_CLUSTER'
    ];

    const envPath = path.join(process.cwd(), '.env.local');
    
    try {
      const envContent = await fs.readFile(envPath, 'utf-8');
      
      for (const varName of requiredVars) {
        const hasVar = envContent.includes(`${varName}=`);
        this.addResult({
          name: `ENV_${varName}`,
          status: hasVar ? 'PASS' : 'FAIL',
          message: hasVar ? `${varName} is set` : `${varName} is missing`,
          critical: true
        });
      }
    } catch (error) {
      this.addResult({
        name: 'ENV_FILE',
        status: 'FAIL',
        message: 'No .env.local file found',
        critical: true
      });
    }
  }

  private async checkCriticalFiles(): Promise<void> {
    console.log('📁 Checking critical files...');
    
    const criticalFiles = [
      'app/layout.tsx',
      'app/page.tsx',
      'app/providers.tsx',
      'lib/storage.ts',
      'lib/auth.ts',
      'components/spotify/SpotifyConnect.tsx',
      'components/music/MusicPortraitDisplay.tsx',
      'components/party/CreatePartyForm.tsx',
      'data.json'
    ];

    for (const file of criticalFiles) {
      try {
        await fs.access(path.join(process.cwd(), file));
        this.addResult({
          name: `FILE_${file.replace(/\//g, '_')}`,
          status: 'PASS',
          message: `${file} exists`,
          critical: true
        });
      } catch {
        this.addResult({
          name: `FILE_${file.replace(/\//g, '_')}`,
          status: 'FAIL',
          message: `${file} is missing`,
          critical: true
        });
      }
    }
  }

  private async checkAPIRoutes(): Promise<void> {
    console.log('🔌 Checking API routes...');
    
    const apiRoutes = [
      'app/api/auth/spotify/connect/route.ts',
      'app/api/auth/spotify/callback/route.ts',
      'app/api/auth/spotify/disconnect/route.ts',
      'app/api/auth/spotify/status/route.ts',
      'app/api/auth/spotify/refresh/route.ts',
      'app/api/parties/route.ts',
      'app/api/parties/join/route.ts',
      'app/api/music/portrait/route.ts',
      'app/api/spotify/player/route.ts'
    ];

    for (const route of apiRoutes) {
      try {
        await fs.access(path.join(process.cwd(), route));
        this.addResult({
          name: `API_${route.split('/').pop()?.replace('.ts', '')}`,
          status: 'PASS',
          message: `${route} exists`,
          critical: true
        });
      } catch {
        this.addResult({
          name: `API_${route.split('/').pop()?.replace('.ts', '')}`,
          status: 'FAIL',
          message: `${route} is missing`,
          critical: true
        });
      }
    }
  }

  private async checkDataStructure(): Promise<void> {
    console.log('💾 Checking data structure...');
    
    try {
      const dataPath = path.join(process.cwd(), 'data.json');
      const dataContent = await fs.readFile(dataPath, 'utf-8');
      const data = JSON.parse(dataContent);

      const requiredCollections = ['users', 'parties', 'tracks', 'memberships', 'votes', 'spotifyProfiles', 'appleMusicProfiles', 'musicPortraits'];
      
      for (const collection of requiredCollections) {
        const hasCollection = data.hasOwnProperty(collection) && Array.isArray(data[collection]);
        this.addResult({
          name: `DATA_${collection}`,
          status: hasCollection ? 'PASS' : 'FAIL',
          message: hasCollection ? `${collection} collection exists` : `${collection} collection missing`,
          critical: true
        });
      }

      // Check data file permissions
      const stats = await fs.stat(dataPath);
      const writable = stats.mode & 0o200;
      this.addResult({
        name: 'DATA_PERMISSIONS',
        status: writable ? 'PASS' : 'WARN',
        message: writable ? 'data.json is writable' : 'data.json may not be writable',
        critical: false
      });

    } catch (error) {
      this.addResult({
        name: 'DATA_STRUCTURE',
        status: 'FAIL',
        message: 'Failed to read or parse data.json',
        critical: true
      });
    }
  }

  private async checkTypeScriptBuild(): Promise<void> {
    console.log('🔧 Checking TypeScript build...');
    
    try {
      const { execSync } = await import('child_process');
      execSync('npm run type-check', { stdio: 'pipe' });
      this.addResult({
        name: 'TYPESCRIPT_CHECK',
        status: 'PASS',
        message: 'TypeScript compilation successful',
        critical: true
      });
    } catch (error) {
      this.addResult({
        name: 'TYPESCRIPT_CHECK',
        status: 'FAIL',
        message: 'TypeScript compilation failed',
        critical: true
      });
    }

    try {
      const { execSync } = await import('child_process');
      execSync('npm run build', { stdio: 'pipe' });
      this.addResult({
        name: 'BUILD_CHECK',
        status: 'PASS',
        message: 'Production build successful',
        critical: true
      });
    } catch (error) {
      this.addResult({
        name: 'BUILD_CHECK',
        status: 'FAIL',
        message: 'Production build failed',
        critical: true
      });
    }
  }

  private async checkSecurity(): Promise<void> {
    console.log('🔒 Checking security...');
    
    // Check for hardcoded secrets in code
    try {
      const filesToCheck = [
        'lib/storage.ts',
        'lib/auth.ts',
        'app/api/auth/spotify/callback/route.ts'
      ];

      for (const file of filesToCheck) {
        const content = await fs.readFile(path.join(process.cwd(), file), 'utf-8');
        
        // Check for common secret patterns
        const secretPatterns = [
          /client_secret\s*=\s*['"][^'"]+['"]/,
          /api_key\s*=\s*['"][^'"]+['"]/,
          /password\s*=\s*['"][^'"]+['"]/
        ];

        let hasSecrets = false;
        for (const pattern of secretPatterns) {
          if (pattern.test(content)) {
            hasSecrets = true;
            break;
          }
        }

        this.addResult({
          name: `SECURITY_${file.replace(/\//g, '_')}`,
          status: hasSecrets ? 'WARN' : 'PASS',
          message: hasSecrets ? `Potential hardcoded secrets in ${file}` : `No hardcoded secrets in ${file}`,
          critical: hasSecrets
        });
      }
    } catch (error) {
      this.addResult({
        name: 'SECURITY_CHECK',
        status: 'WARN',
        message: 'Could not perform security check',
        critical: false
      });
    }
  }

  private addResult(result: CheckResult): void {
    this.results.push(result);
  }

  private printResults(): void {
    console.log('\n📊 CHECK RESULTS\n');
    console.log('='.repeat(80));

    const critical = this.results.filter(r => r.critical);
    const warnings = this.results.filter(r => !r.critical);

    console.log('\n🚨 CRITICAL CHECKS:');
    critical.forEach(result => {
      const icon = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⚠️';
      console.log(`${icon} ${result.name}: ${result.message}`);
    });

    if (warnings.length > 0) {
      console.log('\n⚠️  WARNINGS:');
      warnings.forEach(result => {
        const icon = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⚠️';
        console.log(`${icon} ${result.name}: ${result.message}`);
      });
    }

    const passed = this.results.filter(r => r.status === 'PASS').length;
    const total = this.results.length;
    const criticalFailed = critical.filter(r => r.status === 'FAIL').length;

    console.log('\n' + '='.repeat(80));
    console.log(`📈 SUMMARY: ${passed}/${total} checks passed`);
    
    if (criticalFailed > 0) {
      console.log(`🚨 ${criticalFailed} critical issues found - NOT READY FOR DEPLOY`);
    } else {
      console.log('✅ All critical checks passed - READY FOR DEPLOY');
    }
    console.log('='.repeat(80));
  }
}

// Run the checker
const checker = new PreDeployChecker();
checker.runAllChecks().catch(console.error);
