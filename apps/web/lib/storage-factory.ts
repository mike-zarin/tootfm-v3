// apps/web/lib/storage-factory.ts
// Factory for selecting storage implementation based on environment

import { storage as fileStorage } from './storage';
import { memoryStorage } from './storage-memory';

// Determine which storage to use based on environment
const isProduction = process.env.NODE_ENV === 'production';

// For now, use memory storage in production (Vercel) and file storage in development
// Later we can add Vercel Postgres when needed
export const storage = isProduction ? memoryStorage : fileStorage;
