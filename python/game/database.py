"""
Banco de dados SQLite para o Gacha Game (Python)
Replica o schema do server/database/schema.js
"""

import os
import sqlite3
import json
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent
DB_PATH = os.environ.get('DB_PATH', str(BASE_DIR / 'data' / 'gacha-game.db'))

SCHEMA = """
-- =============================================
-- 1. USERS - Contas dos jogadores
-- =============================================
CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  username      TEXT UNIQUE NOT NULL,
  email         TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  gems          INTEGER DEFAULT 1000,
  gold          INTEGER DEFAULT 5000,
  level         INTEGER DEFAULT 1,
  xp            INTEGER DEFAULT 0,
  avatar_url    TEXT,
  is_admin      INTEGER DEFAULT 0,
  last_login    TEXT,
  created_at    TEXT DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- 2. CHARACTERS - Catálogo de personagens
-- =============================================
CREATE TABLE IF NOT EXISTS characters (
  id                 INTEGER PRIMARY KEY AUTOINCREMENT,
  name               TEXT NOT NULL,
  anime              TEXT NOT NULL,
  rarity             TEXT NOT NULL CHECK (rarity IN ('common', 'rare', 'epic', 'legendary', 'mythic', 'secret')),
  element            TEXT,
  role               TEXT CHECK (role IN ('attacker', 'tank', 'support')),
  base_hp            INTEGER NOT NULL,
  base_atk           INTEGER NOT NULL,
  base_def           INTEGER NOT NULL,
  base_speed         INTEGER NOT NULL,
  skill_name         TEXT,
  skill_description  TEXT,
  image_url          TEXT,
  image_idle_url     TEXT,
  gif_attack_url     TEXT,
  gif_defend_url     TEXT,
  gif_skill_url      TEXT,
  gif_hit_url        TEXT,
  gif_victory_url    TEXT,
  gif_defeat_url     TEXT,
  is_admin_exclusive INTEGER DEFAULT 0,
  power_tier         INTEGER DEFAULT 1,
  created_at         TEXT DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- 3. USER_CHARACTERS - Personagens do jogador
-- =============================================
CREATE TABLE IF NOT EXISTS user_characters (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  character_id INTEGER NOT NULL REFERENCES characters(id),
  level        INTEGER DEFAULT 1,
  xp           INTEGER DEFAULT 0,
  hp           INTEGER,
  max_hp       INTEGER DEFAULT 0,
  atk          INTEGER,
  def          INTEGER,
  speed        INTEGER,
  is_favorite  INTEGER DEFAULT 0,
  is_locked    INTEGER DEFAULT 0,
  obtained_at  TEXT DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- 4. BANNERS - Banners de gacha
-- =============================================
CREATE TABLE IF NOT EXISTS banners (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT NOT NULL,
  description TEXT,
  image_url   TEXT,
  start_date  TEXT,
  end_date    TEXT,
  is_active   INTEGER DEFAULT 1,
  created_at  TEXT DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- 5. BANNER_ITEMS - Itens de cada banner
-- =============================================
CREATE TABLE IF NOT EXISTS banner_items (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  banner_id    INTEGER NOT NULL REFERENCES banners(id) ON DELETE CASCADE,
  character_id INTEGER NOT NULL REFERENCES characters(id),
  drop_rate    REAL NOT NULL,
  is_rate_up   INTEGER DEFAULT 0
);

-- =============================================
-- 6. INVENTORY - Inventário de itens
-- =============================================
CREATE TABLE IF NOT EXISTS inventory (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  item_name  TEXT NOT NULL,
  item_type  TEXT NOT NULL CHECK (item_type IN ('potion', 'equipment', 'material', 'ticket', 'food')),
  quantity   INTEGER DEFAULT 1,
  rarity     TEXT,
  stats      TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- 16b. USER_DAILY_LOGINS - Login diário
-- =============================================
CREATE TABLE IF NOT EXISTS user_daily_logins (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  last_claim TEXT,
  streak     INTEGER DEFAULT 0,
  total_days INTEGER DEFAULT 0,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- 7. MISSIONS - Missões disponíveis
-- =============================================
CREATE TABLE IF NOT EXISTS missions (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  name             TEXT NOT NULL,
  description      TEXT,
  type             TEXT NOT NULL CHECK (type IN ('daily', 'weekly', 'story')),
  objective_type   TEXT NOT NULL,
  objective_target INTEGER NOT NULL,
  reward_gems      INTEGER DEFAULT 0,
  reward_gold      INTEGER DEFAULT 0,
  created_at       TEXT DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- 8. USER_MISSIONS - Progresso das missões
-- =============================================
CREATE TABLE IF NOT EXISTS user_missions (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mission_id   INTEGER NOT NULL REFERENCES missions(id),
  progress     INTEGER DEFAULT 0,
  is_completed INTEGER DEFAULT 0,
  claimed_at   TEXT
);

-- =============================================
-- 9. BATTLE_RESULTS - Resultados de batalhas PvP
-- =============================================
CREATE TABLE IF NOT EXISTS battle_results (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  attacker_id    INTEGER NOT NULL REFERENCES users(id),
  defender_id    INTEGER NOT NULL REFERENCES users(id),
  winner_id      INTEGER REFERENCES users(id),
  attacker_team  TEXT NOT NULL,
  defender_team  TEXT NOT NULL,
  battle_log     TEXT,
  created_at     TEXT DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- 10. RANKINGS - Ranking global (Elo)
-- =============================================
CREATE TABLE IF NOT EXISTS rankings (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  rating     INTEGER DEFAULT 1000,
  wins       INTEGER DEFAULT 0,
  losses     INTEGER DEFAULT 0,
  rank       INTEGER,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- 11. ACHIEVEMENTS - Catálogo de conquistas
-- =============================================
CREATE TABLE IF NOT EXISTS achievements (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  name             TEXT NOT NULL,
  description      TEXT,
  icon_url         TEXT,
  category         TEXT NOT NULL CHECK (category IN ('collection', 'battle', 'progression', 'gacha', 'special')),
  objective_type   TEXT NOT NULL,
  objective_target INTEGER NOT NULL,
  reward_gems      INTEGER DEFAULT 0,
  reward_gold      INTEGER DEFAULT 0,
  created_at       TEXT DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- 12. USER_ACHIEVEMENTS - Conquistas do jogador
-- =============================================
CREATE TABLE IF NOT EXISTS user_achievements (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id        INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  achievement_id INTEGER NOT NULL REFERENCES achievements(id),
  progress       INTEGER DEFAULT 0,
  is_unlocked    INTEGER DEFAULT 0,
  unlocked_at    TEXT
);

-- =============================================
-- 13. USER_TEAMS - Time ativo (máx. 3)
-- =============================================
CREATE TABLE IF NOT EXISTS user_teams (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id           INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_character_id INTEGER NOT NULL REFERENCES user_characters(id) ON DELETE CASCADE,
  slot              INTEGER NOT NULL CHECK (slot BETWEEN 1 AND 3),
  created_at        TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (user_id, slot)
);

-- =============================================
-- 14. BOSSES - Chefes por anime
-- =============================================
CREATE TABLE IF NOT EXISTS bosses (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT NOT NULL,
  anime      TEXT NOT NULL,
  hp         INTEGER NOT NULL,
  atk        INTEGER NOT NULL,
  def        INTEGER NOT NULL,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'normal', 'hard', 'nightmare')),
  image_url  TEXT,
  gif_attack_url TEXT,
  gif_defend_url TEXT,
  gif_skill_url  TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- 15. BOSS_DROPS - Itens que cada boss dropa
-- =============================================
CREATE TABLE IF NOT EXISTS boss_drops (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  boss_id    INTEGER NOT NULL REFERENCES bosses(id) ON DELETE CASCADE,
  item_name  TEXT NOT NULL,
  drop_rate  REAL NOT NULL,
  quantity   INTEGER DEFAULT 1
);

-- =============================================
-- 16. CHARACTER_EVOLUTIONS - Evoluções por personagem
-- =============================================
CREATE TABLE IF NOT EXISTS character_evolutions (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  character_id      INTEGER NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  evolution_name    TEXT NOT NULL,
  required_item     TEXT NOT NULL,
  required_quantity INTEGER DEFAULT 1,
  new_rarity        TEXT NOT NULL CHECK (new_rarity IN ('rare', 'epic', 'legendary', 'mythic', 'secret')),
  stat_multiplier   REAL NOT NULL DEFAULT 1.5
);

-- =============================================
-- ÍNDICES
-- =============================================
CREATE INDEX IF NOT EXISTS idx_user_characters_user ON user_characters(user_id);
CREATE INDEX IF NOT EXISTS idx_banner_items_banner ON banner_items(banner_id);
CREATE INDEX IF NOT EXISTS idx_rankings_rating ON rankings(rating);
CREATE INDEX IF NOT EXISTS idx_user_missions_user ON user_missions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_teams_user ON user_teams(user_id);
CREATE INDEX IF NOT EXISTS idx_battle_results_attacker ON battle_results(attacker_id);
CREATE INDEX IF NOT EXISTS idx_battle_results_defender ON battle_results(defender_id);
CREATE INDEX IF NOT EXISTS idx_boss_drops_boss ON boss_drops(boss_id);
CREATE INDEX IF NOT EXISTS idx_character_evolutions_char ON character_evolutions(character_id);
"""


class Database:
    """Wrapper do SQLite com row_factory = dict"""

    def __init__(self, db_path=None):
        self.db_path = db_path or DB_PATH
        # Garante que o diretório existe
        os.makedirs(os.path.dirname(self.db_path), exist_ok=True)
        self.conn = sqlite3.connect(self.db_path)
        self.conn.row_factory = sqlite3.Row
        self.conn.execute('PRAGMA foreign_keys = ON')
        self.conn.executescript(SCHEMA)
        self._migrate()

    def _migrate(self):
        """Migrações leves (adiciona colunas que faltam)"""
        # Adiciona max_hp em user_characters
        cols = [r['name'] for r in self.conn.execute('PRAGMA table_info(user_characters)').fetchall()]
        if 'max_hp' not in cols:
            self.conn.execute('ALTER TABLE user_characters ADD COLUMN max_hp INTEGER DEFAULT 0')
            self.conn.execute('UPDATE user_characters SET max_hp = hp WHERE max_hp = 0')
            self.conn.commit()

        # Adiciona colunas de GIF em bosses
        boss_cols = [r['name'] for r in self.conn.execute('PRAGMA table_info(bosses)').fetchall()]
        for col in ['gif_attack_url', 'gif_defend_url', 'gif_skill_url']:
            if col not in boss_cols:
                self.conn.execute(f'ALTER TABLE bosses ADD COLUMN {col} TEXT')
                self.conn.commit()

    def query(self, sql, params=None):
        """Executa SELECT e retorna lista de dicts"""
        cur = self.conn.execute(sql, params or [])
        rows = cur.fetchall()
        return [dict(r) for r in rows]

    def get(self, sql, params=None):
        """Executa SELECT e retorna um dict ou None"""
        cur = self.conn.execute(sql, params or [])
        row = cur.fetchone()
        return dict(row) if row else None

    def execute(self, sql, params=None):
        """Executa INSERT/UPDATE/DELETE e retorna lastrowid"""
        cur = self.conn.execute(sql, params or [])
        self.conn.commit()
        return cur.lastrowid

    def transaction(self, fn):
        """Executa uma função dentro de uma transação"""
        try:
            self.conn.execute('BEGIN')
            result = fn()
            self.conn.commit()
            return result
        except Exception:
            self.conn.rollback()
            raise

    def close(self):
        self.conn.close()


# Instância global
db = Database()