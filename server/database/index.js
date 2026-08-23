const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const SCHEMA = require('./schema');
const { syncAssetUrls, auditAssetUrls } = require('./assetCatalog');
const { getBackupDir, restoreLatestBackup } = require('./backup');

// Em produção, prefere o disco persistente e mantém um fallback explícito
// quando o Render ainda não provisionou o ponto de montagem.
const localDbPath = path.join(__dirname, '..', '..', 'data', 'gacha-game.db');
const persistentDbPath = '/var/data/gacha-game.db';
const configuredDbPath = process.env.DB_PATH || persistentDbPath;
const canUseConfiguredDb = fs.existsSync(path.dirname(configuredDbPath))
  && (() => { try { fs.accessSync(path.dirname(configuredDbPath), fs.constants.W_OK); return true; } catch (error) { return false; } })();
const dbPath = process.env.NODE_ENV === 'production' && !canUseConfiguredDb
  ? localDbPath
  : configuredDbPath;

// Garante que o diretório data/ existe
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}
if (process.env.NODE_ENV === 'production' && dbPath === localDbPath) {
  console.warn('⚠️ Persistent Disk não montado; usando banco temporário. Configure /var/data no Render para preservar dados.');
}
restoreLatestBackup(dbPath);

// Cria a conexão com o banco
const db = new Database(dbPath);

// Habilita foreign keys (importante para integridade referencial)
db.pragma('foreign_keys = ON');
// Mantém as escritas seguras e permite leituras durante gravações curtas.
db.pragma('journal_mode = WAL');
db.pragma('synchronous = FULL');
db.pragma('busy_timeout = 5000');

// Executa o schema (cria tabelas se não existirem)
db.exec(SCHEMA);

// Garante que contas antigas também tenham rating e possam participar do PvP.
db.prepare(
  `INSERT OR IGNORE INTO rankings (user_id, rating)
   SELECT id, 1000 FROM users`
).run();

// =============================================
// MIGRAÇÕES LEVES
// =============================================
// Adiciona max_hp em user_characters (HP máximo para cura/percentual)
const ucCols = db.prepare('PRAGMA table_info(user_characters)').all();
if (!ucCols.some((c) => c.name === 'max_hp')) {
  db.exec('ALTER TABLE user_characters ADD COLUMN max_hp INTEGER DEFAULT 0');
  // Backfill: max_hp = hp atual
  db.exec('UPDATE user_characters SET max_hp = hp WHERE max_hp = 0');
}

// Adiciona colunas de animação (GIFs) na tabela bosses
const bossCols = db.prepare('PRAGMA table_info(bosses)').all();
const bossGifCols = ['gif_attack_url', 'gif_defend_url', 'gif_skill_url'];
for (const col of bossGifCols) {
  if (!bossCols.some((c) => c.name === col)) {
    db.exec(`ALTER TABLE bosses ADD COLUMN ${col} TEXT`);
  }
}

const userCols = db.prepare('PRAGMA table_info(users)').all();
if (!userCols.some((c) => c.name === 'last_seen')) {
  db.exec('ALTER TABLE users ADD COLUMN last_seen TEXT');
}

syncAssetUrls(db);
auditAssetUrls(db);

module.exports = db;
module.exports.dbPath = dbPath;
module.exports.backupDir = getBackupDir(dbPath);
module.exports.backupDir = getBackupDir(dbPath);
