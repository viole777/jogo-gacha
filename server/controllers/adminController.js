const db = require('../database');
const { formatNumber } = require('../utils/formatNumber');

const MAX_CURRENCY = Number.MAX_SAFE_INTEGER;

function parseCurrency(value, field) {
  if (value === undefined || value === null || value === '') return 0;
  const amount = Number(value);
  if (!Number.isSafeInteger(amount) || amount < 0 || amount > MAX_CURRENCY) {
    const error = new Error(`${field} deve ser um inteiro entre 0 e ${MAX_CURRENCY}`);
    error.status = 400;
    throw error;
  }
  return amount;
}

function getPlayers(req, res) {
  const search = String(req.query.search || '').trim();
  const status = req.query.status === 'online' || req.query.status === 'offline'
    ? req.query.status
    : 'all';
  const like = `%${search}%`;
  const users = db.prepare(`
    SELECT id, username, email, gems, gold, level, xp, avatar_url,
           is_admin, last_login, last_seen, created_at,
           CASE WHEN last_seen >= datetime('now', '-5 minutes') THEN 1 ELSE 0 END AS is_online
    FROM users
    WHERE (? = '' OR username LIKE ? OR email LIKE ?)
      AND (? = 'all' OR (? = 'online' AND last_seen >= datetime('now', '-5 minutes'))
           OR (? = 'offline' AND (last_seen IS NULL OR last_seen < datetime('now', '-5 minutes'))))
    ORDER BY is_online DESC, username COLLATE NOCASE ASC
  `).all(search, like, like, status, status, status);

  const items = db.prepare(
    `SELECT id, user_id, item_name, item_type, quantity, rarity, stats, created_at
     FROM inventory WHERE user_id = ? ORDER BY item_name COLLATE NOCASE`
  );
  const characters = db.prepare(`
    SELECT uc.id, uc.character_id, uc.level, uc.xp, uc.hp, uc.max_hp,
           uc.atk, uc.def, uc.speed, uc.is_favorite, uc.is_locked, uc.obtained_at,
           c.name, c.anime, c.rarity, c.element, c.role, c.image_url
    FROM user_characters uc
    JOIN characters c ON c.id = uc.character_id
    WHERE uc.user_id = ?
    ORDER BY c.power_tier DESC, c.name COLLATE NOCASE
  `);

  const playerData = users.map((user) => ({
    ...user,
    is_online: user.is_online === 1,
    gems_formatted: formatNumber(user.gems),
    gold_formatted: formatNumber(user.gold),
    items: items.all(user.id).map((item) => ({
      ...item,
      stats: parseStats(item.stats),
    })),
    units: characters.all(user.id),
  }));

  return res.json({
    players: playerData,
    count: playerData.length,
    online_count: playerData.filter((player) => player.is_online).length,
  });
}

function parseStats(stats) {
  if (!stats) return {};
  try {
    return JSON.parse(stats);
  } catch (error) {
    return {};
  }
}

function grantCurrency(req, res) {
  const userId = Number(req.params.id);
  if (!Number.isInteger(userId) || userId < 1) {
    return res.status(400).json({ error: 'Jogador inválido' });
  }

  try {
    const gems = parseCurrency(req.body.gems, 'Gemas');
    const gold = parseCurrency(req.body.gold, 'Moedas');
    if (gems === 0 && gold === 0) {
      return res.status(400).json({ error: 'Informe uma quantidade de moedas ou gemas maior que zero' });
    }

    const result = db.prepare(`
      UPDATE users
      SET gems = gems + ?, gold = gold + ?
      WHERE id = ?
        AND gems <= ? - ?
        AND gold <= ? - ?
    `).run(gems, gold, userId, MAX_CURRENCY, gems, MAX_CURRENCY, gold);

    if (result.changes !== 1) {
      const player = db.prepare('SELECT id FROM users WHERE id = ?').get(userId);
      return res.status(player ? 400 : 404).json({
        error: player ? 'O saldo ultrapassaria o limite permitido' : 'Jogador não encontrado',
      });
    }

    const player = db.prepare('SELECT gems, gold FROM users WHERE id = ?').get(userId);
    return res.json({ message: 'Saldo atualizado com sucesso!', player });
  } catch (error) {
    return res.status(error.status || 500).json({ error: error.message });
  }
}

function deletePlayer(req, res) {
  const userId = Number(req.params.id);
  if (!Number.isInteger(userId) || userId < 1) {
    return res.status(400).json({ error: 'Jogador inválido' });
  }
  if (userId === req.user.id) {
    return res.status(400).json({ error: 'A conta administrativa logada não pode ser apagada por este painel' });
  }

  const player = db.prepare('SELECT id, username, is_admin FROM users WHERE id = ?').get(userId);
  if (!player) return res.status(404).json({ error: 'Jogador não encontrado' });
  if (player.is_admin === 1) {
    return res.status(400).json({ error: 'Contas administrativas não podem ser apagadas por este painel' });
  }

  const removePlayer = db.transaction(() => {
    db.prepare('DELETE FROM battle_results WHERE attacker_id = ? OR defender_id = ?').run(userId, userId);
    db.prepare('DELETE FROM users WHERE id = ?').run(userId);
  });
  removePlayer();

  return res.json({ message: `Conta de ${player.username} apagada com sucesso!` });
}

module.exports = { getPlayers, grantCurrency, deletePlayer };