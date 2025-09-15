// apps/web/lib/storage-factory.ts
// Factory for selecting storage implementation based on environment

import { storage as fileStorage } from './storage';
import { memoryStorage } from './storage-memory';

// Determine which storage to use based on environment
const isProduction = process.env.NODE_ENV === 'production';

// Use file storage for both development and production
// Memory storage causes data loss in production
export const storage = fileStorage;
