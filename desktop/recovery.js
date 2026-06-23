const fs = require('fs');
const path = require('path');
const { ClassicLevel } = require('classic-level');

const LEGACY_USER_DATA = path.join(process.env.APPDATA || '', 'passvault-desktop');
const RECOVERY_FILE = 'legacy-recovery.json';
const STORAGE_KEYS = ['passvault_pro_data_v2', 'vault_data'];

async function readLevelDb(userDataPath) {
  const levelDbDir = path.join(userDataPath, 'Local Storage', 'leveldb');
  if (!fs.existsSync(levelDbDir)) return null;

  let db;
  try {
    db = new ClassicLevel(levelDbDir, { createIfMissing: false });
    let best = null;

    for await (const [key, value] of db.iterator()) {
      const keyText = key.toString('latin1');
      if (!STORAGE_KEYS.some((k) => keyText.includes(k))) continue;

      const raw = value.toString('latin1');
      const start = raw.indexOf('[{');
      if (start === -1) continue;

      try {
        const parsed = JSON.parse(raw.slice(start));
        if (Array.isArray(parsed) && parsed.length > 0 && (!best || parsed.length > best.length)) {
          best = parsed;
        }
      } catch {
        /* try next key */
      }
    }

    return best;
  } catch {
    return null;
  } finally {
    if (db) await db.close().catch(() => {});
  }
}

async function ensureLegacyRecovery(userDataPath) {
  const recoveryPath = path.join(userDataPath, RECOVERY_FILE);
  if (fs.existsSync(recoveryPath)) {
    try {
      const cached = JSON.parse(fs.readFileSync(recoveryPath, 'utf8'));
      if (Array.isArray(cached) && cached.length > 0) return cached;
    } catch {
      /* ignore corrupt cache */
    }
  }

  const fromLegacyProfile = await readLevelDb(LEGACY_USER_DATA);
  if (fromLegacyProfile?.length) {
    fs.writeFileSync(recoveryPath, JSON.stringify(fromLegacyProfile, null, 2), 'utf8');
    return fromLegacyProfile;
  }

  const fromCurrentProfile = await readLevelDb(userDataPath);
  if (fromCurrentProfile?.length) {
    fs.writeFileSync(recoveryPath, JSON.stringify(fromCurrentProfile, null, 2), 'utf8');
    return fromCurrentProfile;
  }

  return null;
}

module.exports = { LEGACY_USER_DATA, RECOVERY_FILE, ensureLegacyRecovery };
