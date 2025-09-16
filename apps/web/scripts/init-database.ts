#!/usr/bin/env tsx
// apps/web/scripts/init-database.ts
// Script to initialize PostgreSQL database with schema

import { sql } from '@vercel/postgres';
import fs from 'fs';
import path from 'path';

async function initializeDatabase() {
  try {
    console.log('🚀 Initializing tootFM database...');
    
    // Check if POSTGRES_URL is available
    if (!process.env.POSTGRES_URL) {
      console.error('❌ POSTGRES_URL environment variable is not set');
      console.log('Please set POSTGRES_URL in your environment or .env.local file');
      process.exit(1);
    }

    // Read schema file
    const schemaPath = path.join(__dirname, '../lib/database-schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    console.log('📄 Executing database schema...');
    
    // Execute schema
    await sql.query(schema);
    
    console.log('✅ Database initialized successfully!');
    console.log('📊 Tables created:');
    console.log('  - users');
    console.log('  - parties');
    console.log('  - memberships');
    console.log('  - tracks');
    console.log('  - votes');
    console.log('  - spotify_profiles');
    console.log('  - apple_music_profiles');
    console.log('  - music_portraits');
    
    // Test connection
    const result = await sql`SELECT COUNT(*) as count FROM users`;
    console.log(`🔍 Test query successful: ${result.rows[0].count} users found`);
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  initializeDatabase();
}

export { initializeDatabase };
