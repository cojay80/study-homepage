const fs = require('fs');
const path = require('path');

const dbPath = path.resolve(__dirname, '..', 'db', 'magic_kingdom.db');
const outDir = path.resolve(__dirname, '..', 'backups');
const keep = Number(process.env.BACKUP_KEEP || 30);

function pad(n) {
  return String(n).padStart(2, '0');
}

function stamp(d = new Date()) {
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

if (!fs.existsSync(dbPath)) {
  console.error('DB not found:', dbPath);
  process.exit(1);
}

fs.mkdirSync(outDir, { recursive: true });
const dest = path.join(outDir, `magic_kingdom_${stamp()}.db`);
fs.copyFileSync(dbPath, dest);
console.log('Backup created:', dest);

if (Number.isFinite(keep) && keep > 0) {
  const files = fs.readdirSync(outDir)
    .filter((n) => n.startsWith('magic_kingdom_') && n.endsWith('.db'))
    .map((n) => ({ name: n, full: path.join(outDir, n) }))
    .sort((a, b) => {
      const sa = a.name.replace('magic_kingdom_', '').replace('.db', '');
      const sb = b.name.replace('magic_kingdom_', '').replace('.db', '');
      return sa.localeCompare(sb);
    });

  const extra = files.length - keep;
  if (extra > 0) {
    const toDelete = files.slice(0, extra);
    for (const f of toDelete) {
      try {
        fs.unlinkSync(f.full);
        console.log('Deleted old backup:', f.name);
      } catch (e) {
        console.error('Failed to delete backup:', f.name, e?.message || e);
      }
    }
  }
}
