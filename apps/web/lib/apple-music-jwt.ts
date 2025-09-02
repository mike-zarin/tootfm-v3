// lib/apple-music-jwt.ts

import jwt from 'jsonwebtoken';

export function generateAppleMusicToken(): string {
  const privateKey = process.env.APPLE_PRIVATE_KEY;
  const teamId = process.env.APPLE_TEAM_ID;
  const keyId = process.env.APPLE_KEY_ID;

  // Отладка
  console.log('Generating Apple Music token...');
  console.log('Team ID exists:', !!teamId);
  console.log('Key ID exists:', !!keyId);
  console.log('Private Key exists:', !!privateKey);
  console.log('Private Key length:', privateKey?.length);

  if (!privateKey || !teamId || !keyId) {
    throw new Error(
      `Apple Music credentials missing: ` +
      `TeamID: ${!!teamId}, KeyID: ${!!keyId}, PrivateKey: ${!!privateKey}`
    );
  }

  try {
    const token = jwt.sign({}, privateKey, {
      algorithm: 'ES256',
      expiresIn: '180d',
      issuer: teamId,
      header: {
        alg: 'ES256',
        kid: keyId
      }
    });

    console.log('Token generated successfully');
    return token;
  } catch (error) {
    console.error('JWT generation error:', error);
    throw error;
  }
}