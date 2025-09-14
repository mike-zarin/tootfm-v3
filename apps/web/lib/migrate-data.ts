// apps/web/lib/migrate-data.ts
import fs from 'fs';
import path from 'path';
const DATA_FILE = path.join(process.cwd(), 'data.json');
export function migrateOldData() {
  if (!fs.existsSync(DATA_FILE)) return;
  const raw = fs.readFileSync(DATA_FILE, 'utf-8');
  const data = JSON.parse(raw);
  // Check if it's old format (parties as array of arrays)
  if (Array.isArray(data.parties) && data.parties.length > 0) {
    if (Array.isArray(data.parties[0])) {
      // Old format detected - convert
      const newParties = data.parties.map(([id, party]: any) => party);
      data.parties = newParties;
    }
  }
  // Ensure all required fields exist
  const migrated = {
    users: data.users || [],
    parties: data.parties || [],
    tracks: data.tracks || [],
    memberships: data.memberships || []
  };
  // Create memberships for existing parties
  if (migrated.memberships.length === 0 && migrated.parties.length > 0) {
    migrated.parties.forEach((party: any) => {
      // Add host as member
      migrated.memberships.push({
        id: `membership_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: party.hostId,
        partyId: party.id,
        role: 'host',
        joinedAt: party.createdAt
      });
    });
  }
  fs.writeFileSync(DATA_FILE, JSON.stringify(migrated, null, 2));
  // console.log('Data migrated successfully');
}
// Run migration on import
migrateOldData();