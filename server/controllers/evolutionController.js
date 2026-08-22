const db = require('../database');
const { formatNumber } = require('../utils/formatNumber');
const { registerProgress } = require('./missionController');

/**
 * Lista as evoluções disponíveis para um personagem da bag
 * GET /api/evolution/character/:id
 */
function getCharacterEvolutions(req, res) {
  const userCharId = req.params.id;

  const char = db
    .prepare(
      `SELECT uc.id, uc.level, uc.xp, uc.max_hp, uc.hp, uc.atk, uc.def, uc.speed,
              c.id as character_id, c.name, c.rarity, c.element, c.role, c.anime
       FROM user_characters uc
       JOIN characters c ON uc.character_id = c.id
       WHERE uc.id = ? AND uc.user_id = ?`
    )
    .get(userCharId, req.user.id);

  if (!char) {
    return res.status(404).json({ error: 'Personagem não encontrado' });
  }

  const evolutions = db
    .prepare(
      `SELECT ce.id, ce.evolution_name, ce.required_item, ce.required_quantity, ce.new_rarity, ce.stat_multiplier
       FROM character_evolutions ce
       WHERE ce.character_id = ?
       ORDER BY ce.id`
    )
    .all(char.character_id);

  // Verifica quais itens o jogador tem
  const inventory = db
    .prepare('SELECT item_name, quantity FROM inventory WHERE user_id = ?')
    .all(req.user.id);

  const evoList = evolutions.map((evo) => {
    const item = inventory.find((i) => i.item_name === evo.required_item);
    const hasItem = item ? item.quantity >= evo.required_quantity : false;
    return {
      ...evo,
      has_item: hasItem,
      owned_quantity: item ? item.quantity : 0,
    };
  });

  return res.json({
    character: {
      id: char.id,
      name: char.name,
      rarity: char.rarity,
      element: char.element,
      role: char.role,
      level: char.level,
      hp_formatted: formatNumber(char.max_hp || char.hp),
      atk_formatted: formatNumber(char.atk),
      def_formatted: formatNumber(char.def),
    },
    evolutions: evoList,
  });
}

/**
 * Evolui um personagem
 * POST /api/evolution/evolve
 * Body: { "user_character_id": 5, "evolution_id": 2 }
 */
function evolveCharacter(req, res) {
  const { user_character_id, evolution_id } = req.body;

  if (!user_character_id || !evolution_id) {
    return res.status(400).json({ error: 'user_character_id e evolution_id são obrigatórios' });
  }

  // Busca a evolução
  const evolution = db
    .prepare(
      `SELECT ce.*, c.name as char_name, c.rarity as current_rarity
       FROM character_evolutions ce
       JOIN characters c ON ce.character_id = c.id
       WHERE ce.id = ?`
    )
    .get(evolution_id);

  if (!evolution) {
    return res.status(404).json({ error: 'Evolução não encontrada' });
  }

  // Busca o personagem do jogador
  const char = db
    .prepare(
      `SELECT uc.*, c.name, c.anime, c.rarity, c.element, c.role, c.skill_name, c.skill_description,
              c.base_hp, c.base_atk, c.base_def, c.base_speed
       FROM user_characters uc
       JOIN characters c ON uc.character_id = c.id
       WHERE uc.id = ? AND uc.user_id = ?`
    )
    .get(user_character_id, req.user.id);

  if (!char) {
    return res.status(404).json({ error: 'Personagem não encontrado' });
  }

  // A evolução deve ser do mesmo personagem do catálogo
  if (char.character_id !== evolution.character_id) {
    return res.status(400).json({ error: 'Evolução não pertence a este personagem' });
  }

  // Verifica os requisitos de item
  const item = db
    .prepare('SELECT id, quantity FROM inventory WHERE user_id = ? AND item_name = ?')
    .get(req.user.id, evolution.required_item);

  const hasItem = item && item.quantity >= evolution.required_quantity;
  if (!hasItem) {
    return res.status(400).json({
      error: `Requer ${evolution.required_quantity}x ${evolution.required_item}`,
      required_item: evolution.required_item,
      required_quantity: evolution.required_quantity,
      owned: item ? item.quantity : 0,
    });
  }

  // Consome os itens
  if (item.quantity === evolution.required_quantity) {
    db.prepare('DELETE FROM inventory WHERE id = ?').run(item.id);
  } else {
    db.prepare('UPDATE inventory SET quantity = quantity - ? WHERE id = ?').run(
      evolution.required_quantity,
      item.id
    );
  }

  // Aplica a evolução: multiplica os stats pelo stat_multiplier
  const mult = evolution.stat_multiplier;
  const newMaxHp = Math.floor((char.max_hp || char.hp) * mult);
  const newHp = newMaxHp; // Evoluir cura completamente
  const newAtk = Math.floor((char.atk || char.base_atk) * mult);
  const newDef = Math.floor((char.def || char.base_def) * mult);
  const newSpeed = Math.floor((char.speed || char.base_speed) * mult);

  db.prepare(
    `UPDATE user_characters
     SET max_hp = ?, hp = ?, atk = ?, def = ?, speed = ?
     WHERE id = ?`
  ).run(newMaxHp, newHp, newAtk, newDef, newSpeed, user_character_id);

  // Progresso de missão (evolve)
  registerProgress(req.user.id, 'evolve');

  return res.json({
    message: `${char.name} evoluiu para ${evolution.evolution_name}!`,
    evolution: {
      name: evolution.evolution_name,
      new_rarity: evolution.new_rarity,
      stat_multiplier: mult,
    },
    character: {
      id: char.id,
      name: char.name,
      rarity: evolution.new_rarity,
      hp_formatted: formatNumber(newMaxHp),
      atk_formatted: formatNumber(newAtk),
      def_formatted: formatNumber(newDef),
      speed_formatted: formatNumber(newSpeed),
    },
  });
}

module.exports = { getCharacterEvolutions, evolveCharacter };
