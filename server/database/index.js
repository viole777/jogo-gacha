const Database = require('better-sqlite3');
const path = require('path');
const SCHEMA = require('./schema');
const { syncAssetUrls, auditAssetUrls } = require('./assetCatalog');

// Caminho do banco de dados
const dbPath = process.env.DB_PATH || path.join(__dirname, '..', '..', 'data', 'gacha-game.db');

// Garante que o diretório data/ existe
const fs = require('fs');
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Cria a conexão com o banco
const db = new Database(dbPath);

// Habilita foreign keys (importante para integridade referencial)
db.pragma('foreign_keys = ON');

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

syncAssetUrls(db);
auditAssetUrls(db);

module.exports = db;
