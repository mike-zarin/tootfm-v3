#!/usr/bin/env tsx
// apps/web/scripts/api-health-check.ts
// Проверка всех API endpoints

import { execSync } from 'child_process';

interface APIEndpoint {
  method: string;
  path: string;
  description: string;
  critical: boolean;
}

class APIHealthChecker {
  private baseUrl = 'http://localhost:3000';
  private endpoints: APIEndpoint[] = [
    { method: 'GET', path: '/api/health', description: 'Health check', critical: true },
    { method: 'GET', path: '/api/auth/session', description: 'Session status', critical: true },
    { method: 'GET', path: '/api/auth/spotify/status', description: 'Spotify connection status', critical: true },
    { method: 'POST', path: '/api/auth/spotify/connect', description: 'Spotify connect', critical: true },
    { method: 'GET', path: '/api/auth/spotify/callback', description: 'Spotify callback', critical: true },
    { method: 'POST', path: '/api/auth/spotify/refresh', description: 'Spotify token refresh', critical: true },
    { method: 'POST', path: '/api/auth/spotify/disconnect', description: 'Spotify disconnect', critical: true },
    { method: 'GET', path: '/api/music/portrait', description: 'Music portrait generation', critical: true },
    { method: 'GET', path: '/api/music/unified-portrait', description: 'Unified music portrait', critical: false },
    { method: 'POST', path: '/api/parties', description: 'Create party', critical: true },
    { method: 'GET', path: '/api/parties/join', description: 'Join party', critical: true },
    { method: 'POST', path: '/api/spotify/player', description: 'Spotify player control', critical: true }
  ];

  async checkAllEndpoints(): Promise<void> {
    console.log('🔌 API Health Check\n');
    console.log(`Testing endpoints on ${this.baseUrl}\n`);

    for (const endpoint of this.endpoints) {
      await this.checkEndpoint(endpoint);
    }

    this.printSummary();
  }

  private async checkEndpoint(endpoint: APIEndpoint): Promise<void> {
    const { method, path, description, critical } = endpoint;
    const icon = critical ? '🚨' : 'ℹ️';
    
    try {
      const url = `${this.baseUrl}${path}`;
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const status = response.status;
      const statusText = response.statusText;

      if (status < 400) {
        console.log(`✅ ${icon} ${method} ${path} - ${status} ${statusText} - ${description}`);
      } else if (status < 500) {
        console.log(`⚠️  ${icon} ${method} ${path} - ${status} ${statusText} - ${description} (Client Error)`);
      } else {
        console.log(`❌ ${icon} ${method} ${path} - ${status} ${statusText} - ${description} (Server Error)`);
      }
    } catch (error) {
      console.log(`❌ ${icon} ${method} ${path} - CONNECTION FAILED - ${description}`);
      console.log(`   Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private printSummary(): void {
    console.log('\n📊 API Health Summary');
    console.log('='.repeat(50));
    console.log('✅ = Working');
    console.log('⚠️  = Client Error (may be expected)');
    console.log('❌ = Server Error or Connection Failed');
    console.log('🚨 = Critical endpoint');
    console.log('ℹ️  = Non-critical endpoint');
  }
}

// Check if server is running
async function checkServerRunning(): Promise<boolean> {
  try {
    const response = await fetch('http://localhost:3000/api/health');
    return response.ok;
  } catch {
    return false;
  }
}

// Main execution
async function main() {
  const isRunning = await checkServerRunning();
  
  if (!isRunning) {
    console.log('❌ Server is not running on localhost:3000');
    console.log('Please start the development server with: npm run dev');
    process.exit(1);
  }

  const checker = new APIHealthChecker();
  await checker.checkAllEndpoints();
}

main().catch(console.error);
