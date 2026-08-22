const db = require('../database');
const { formatNumber } = require('../utils/formatNumber');

/**
 * Verifica se o usuário autenticado é a conta administrativa Viole.
 * A conta Viole continua visível no ranking e no PvP.
 */
function isViole(req) {
  const user = db
    .prepare('SELECT username, is_admin FROM users WHERE id = ?')
    .get(req.user.id);

  return !!(user && user.username === 'Viole' && user.is_admin === 1);
}

/**
 * Verifica se um personagem pertence ao usuário autenticado.
 * Isso impede que alguém tente manipular personagens de outra conta.
 */
function getOwnedCharacter(charId, userId) {
  return db
    .prepare(
      `SELECT uc.id, uc.user_id, uc.is_favorite, uc.is_locked,
              c.is_admin_exclusive, c.name, c.rarity
       FROM user_characters uc
       JOIN characters c ON uc.character_id = c.id
       WHERE uc.id = ? AND uc.user_id = ?`
    )
    .get(charId, userId);
}

/**
 * Dados completos da conta do jogador
 * GET /api/account
 */
function getAccount(req, res) {
  const user = db
    .prepare(
      `SELECT id, username, email, gems, gold, level, xp,
              avatar_url, last_login, created_at
       FROM users
       WHERE id = ?`
    )
    .get(req.user.id);

  if (!user) {
    return res.status(404).json({ error: 'Usuário não encontrado' });
  }

  const charCount = db
    .prepare('SELECT COUNT(*) as count FROM user_characters WHERE user_id = ?')
    .get(req.user.id);

  const itemCount = db
    .prepare('SELECT COUNT(*) as count FROM inventory WHERE user_id = ?')
    .get(req.user.id);

  const daily = db
    .prepare(
      'SELECT total_days, streak FROM user_daily_logins WHERE user_id = ?'
    )
    .get(req.user.id) || { total_days: 0, streak: 0 };

  return res.json({
    user: {
      ...user,

      // Informação útil apenas internamente no backend.
      // Não expomos is_admin para usuários comuns.
      gems_formatted: formatNumber(user.gems),
      gold_formatted: formatNumber(user.gold),

      bag_count: charCount.count,
      bag_limit: 20,

      inventory_count: itemCount.count,

      daily_streak: daily.streak,
      daily_total_days: daily.total_days,
    },
  });
}

/**
 * Lista os personagens da bag do jogador (máx. 20)
 * GET /api/account/characters
 */
function getCharacters(req, res) {
  const characters = db
    .prepare(
      `SELECT
          uc.id,
          uc.level,
          uc.xp,
          uc.hp,
          uc.max_hp,
          uc.atk,
          uc.def,
          uc.speed,
          uc.is_favorite,
          uc.is_locked,
          uc.obtained_at,

          c.name,
          c.anime,
          c.rarity,
          c.element,
          c.role,
          c.skill_name,
          c.skill_description,

          c.image_url,
          c.image_idle_url,
          c.gif_attack_url,
          c.gif_defend_url,
          c.gif_skill_url,
          c.gif_hit_url,
          c.gif_victory_url,
          c.gif_defeat_url,

          c.power_tier
       FROM user_characters uc
       JOIN characters c ON uc.character_id = c.id

       WHERE uc.user_id = ?

       ORDER BY
         uc.is_favorite DESC,
         uc.is_locked DESC,
         c.power_tier DESC`
    )
    .all(req.user.id);

  const formatted = characters.map((char) => ({
    ...char,

    hp_formatted: formatNumber(char.hp),
    max_hp_formatted: formatNumber(char.max_hp),
    atk_formatted: formatNumber(char.atk),
    def_formatted: formatNumber(char.def),
    speed_formatted: formatNumber(char.speed),
  }));

  return res.json({
    characters: formatted,
    count: formatted.length,
    limit: 20,
  });
}

/**
 * Ver o time ativo do jogador (máx. 3)
 * GET /api/account/team
 */
function getTeam(req, res) {
  const team = db
    .prepare(
      `SELECT
          ut.slot,

          uc.id AS user_character_id,
          uc.level,
          uc.xp,
          uc.hp,
          uc.max_hp,
          uc.atk,
          uc.def,
          uc.speed,

          c.name,
          c.anime,
          c.rarity,
          c.element,
          c.role,
          c.skill_name,
          c.skill_description,

          c.image_url,
          c.image_idle_url,
          c.gif_attack_url,
          c.gif_defend_url,
          c.gif_skill_url,
          c.gif_hit_url,
          c.gif_victory_url,
          c.gif_defeat_url,

          c.power_tier

       FROM user_teams ut

       JOIN user_characters uc
         ON ut.user_character_id = uc.id

       JOIN characters c
         ON uc.character_id = c.id

       WHERE ut.user_id = ?

       ORDER BY ut.slot`
    )
    .all(req.user.id);

  const formatted = team.map((char) => ({
    ...char,

    hp_formatted: formatNumber(char.hp),
    max_hp_formatted: formatNumber(char.max_hp),
    atk_formatted: formatNumber(char.atk),
    def_formatted: formatNumber(char.def),
    speed_formatted: formatNumber(char.speed),
  }));

  return res.json({
    team: formatted,
    count: formatted.length,
    limit: 3,
  });
}

/**
 * Montar o time ativo (máx. 3 personagens)
 * PUT /api/account/team
 * Body: { "slots": [id1, id2, id3] }
 */
function setTeam(req, res) {
  const { slots } = req.body;

  if (
    !slots ||
    !Array.isArray(slots) ||
    slots.length === 0 ||
    slots.length > 3
  ) {
    return res.status(400).json({
      error: 'Envie entre 1 e 3 personagens no time',
    });
  }

  // Evita personagens duplicados no mesmo time.
  if (new Set(slots).size !== slots.length) {
    return res.status(400).json({
      error: 'Não é possível colocar o mesmo personagem mais de uma vez',
    });
  }

  const checkOwnership = db.prepare(
    'SELECT id FROM user_characters WHERE id = ? AND user_id = ?'
  );

  for (const charId of slots) {
    const owned = checkOwnership.get(charId, req.user.id);

    if (!owned) {
      return res.status(400).json({
        error: `Personagem ${charId} não pertence ao jogador`,
      });
    }
  }

  db.prepare('DELETE FROM user_teams WHERE user_id = ?').run(req.user.id);

  const insertTeam = db.prepare(
    `INSERT INTO user_teams
      (user_id, user_character_id, slot)
     VALUES (?, ?, ?)`
  );

  const insertAll = db.transaction(() => {
    slots.forEach((charId, index) => {
      insertTeam.run(req.user.id, charId, index + 1);
    });
  });

  insertAll();

  return res.json({
    message: 'Time atualizado com sucesso!',
    team: slots,
  });
}

/**
 * Atualizar avatar do jogador
 * PUT /api/account/avatar
 */
function updateAvatar(req, res) {
  const { avatar_url } = req.body;

  if (!avatar_url || typeof avatar_url !== 'string') {
    return res.status(400).json({
      error: 'avatar_url é obrigatório',
    });
  }

  db.prepare(
    'UPDATE users SET avatar_url = ? WHERE id = ?'
  ).run(avatar_url, req.user.id);

  return res.json({
    message: 'Avatar atualizado com sucesso!',
    avatar_url,
  });
}

/**
 * Favoritar/desfavoritar personagem
 * PUT /api/account/characters/:id/favorite
 */
function toggleFavorite(req, res) {
  const charId = req.params.id;

  const char = getOwnedCharacter(charId, req.user.id);

  if (!char) {
    return res.status(404).json({
      error: 'Personagem não encontrado',
    });
  }

  const newValue = char.is_favorite === 1 ? 0 : 1;

  db.prepare(
    'UPDATE user_characters SET is_favorite = ? WHERE id = ? AND user_id = ?'
  ).run(newValue, charId, req.user.id);

  return res.json({
    message:
      newValue === 1
        ? 'Personagem favoritado!'
        : 'Personagem desfavoritado',

    is_favorite: newValue,
  });
}

/**
 * Bloquear/desbloquear personagem
 * PUT /api/account/characters/:id/lock
 */
function toggleLock(req, res) {
  const charId = req.params.id;

  const char = getOwnedCharacter(charId, req.user.id);

  if (!char) {
    return res.status(404).json({
      error: 'Personagem não encontrado',
    });
  }

  const newValue = char.is_locked === 1 ? 0 : 1;

  db.prepare(
    'UPDATE user_characters SET is_locked = ? WHERE id = ? AND user_id = ?'
  ).run(newValue, charId, req.user.id);

  return res.json({
    message:
      newValue === 1
        ? 'Personagem bloqueado!'
        : 'Personagem desbloqueado',

    is_locked: newValue,
  });
}

/**
 * Deletar personagem
 * DELETE /api/account/characters/:id
 */
function deleteCharacter(req, res) {
  const charId = req.params.id;

  const char = getOwnedCharacter(charId, req.user.id);

  if (!char) {
    return res.status(404).json({
      error: 'Personagem não encontrado',
    });
  }

  // Personagens exclusivos do admin não podem ser deletados.
  if (char.is_admin_exclusive === 1) {
    return res.status(400).json({
      error: 'Não é possível deletar personagens exclusivos do admin',
    });
  }

  // Favoritos precisam ser desfavoritados antes.
  if (char.is_favorite === 1) {
    return res.status(400).json({
      error: 'Desfavorite o personagem antes de deletar',
    });
  }

  // Personagens bloqueados precisam ser desbloqueados antes.
  if (char.is_locked === 1) {
    return res.status(400).json({
      error: 'Desbloqueie o personagem antes de deletar',
    });
  }

  // Remove do time.
  db.prepare(
    'DELETE FROM user_teams WHERE user_character_id = ? AND user_id = ?'
  ).run(charId, req.user.id);

  // Remove somente se realmente pertencer ao usuário.
  db.prepare(
    'DELETE FROM user_characters WHERE id = ? AND user_id = ?'
  ).run(charId, req.user.id);

  return res.json({
    message: `${char.name} deletado com sucesso!`,
    character: char.name,
    rarity: char.rarity,
  });
}

module.exports = {
  getAccount,
  getCharacters,
  getTeam,
  setTeam,
  updateAvatar,
  toggleFavorite,
  toggleLock,
  deleteCharacter,

  // Pode ser usado por outros controllers/middlewares.
  isViole,
};
