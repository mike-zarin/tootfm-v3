const fs = require('fs');
const data = JSON.parse(fs.readFileSync('data.json', 'utf8'));
// Backup
fs.writeFileSync(`data.backup.${Date.now()}.json`, JSON.stringify(data, null, 2));
// Remove duplicate memberships
const uniqueMemberships = [];
const seen = new Set();
data.memberships.forEach(m => {
  const key = `${m.userId}-${m.partyId}`;
  if (!seen.has(key)) {
    seen.add(key);
    uniqueMemberships.push(m);
  }
});
data.memberships = uniqueMemberships;
fs.writeFileSync('data.json', JSON.stringify(data, null, 2));
