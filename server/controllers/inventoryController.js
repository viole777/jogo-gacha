const db = require('../database');
const { registerProgress } = require('./missionController');

// XP necessário para subir de nível (fórmula: 100 * level^1.5)
function xpToNextLevel(level) {
  return Math.floor(100 * Math.pow(level, 1.5));
}


/**
 * Lista os itens do inventário do jogador
 * GET /api/inventory
 */
function getInventory(req, res) {
  const items = db
    .prepare(
      `SELECT id, item_name, item_type, quantity, rarity, stats, created_at
       FROM inventory
       WHERE user_id = ?
       ORDER BY item_type, item_name`
    )
    .all(req.user.id);

  // Converte stats de JSON string para objeto
  const formatted = items.map((item) => ({
    ...item,
    stats: item.stats ? JSON.parse(item.stats) : null,
  }));

  return res.json({
    items: formatted,
    count: formatted.length,
  });
}

/**
 * Usar um item do inventário
 * POST /api/inventory/use
 * Body: { "item_id": 1, "quantity": 1, "user_character_id": 5 }
 *
 * Tipos:
 * - potion: cura HP (stats.heal = valor fixo OU stats.heal_percent = % do HP máximo)
 * - food:   dá XP ao personagem alvo (stats.xp = XP ganho) ou restaura stamina
 * - ticket: dá gems
 */
function useItem(req, res) {
  const { item_id, quantity = 1, user_character_id = null } = req.body;

  if (!item_id) {
    return res.status(400).json({ error: 'item_id é obrigatório' });
  }

  // Busca o item
  const item = db
    .prepare('SELECT * FROM inventory WHERE id = ? AND user_id = ?')
    .get(item_id, req.user.id);

  if (!item) {
    return res.status(404).json({ error: 'Item não encontrado' });
  }

  if (item.quantity < quantity) {
    return res.status(400).json({ error: 'Quantidade insuficiente' });
  }

  const stats = item.stats ? JSON.parse(item.stats) : {};

  // Processa o uso do item
  let result;

  switch (item.item_type) {
    case 'potion': {
      if (!user_character_id) {
        return res.status(400).json({ error: 'Informe user_character_id para usar a poção' });
      }

      const target = db
        .prepare('SELECT id, hp, max_hp FROM user_characters WHERE id = ? AND user_id = ?')
        .get(user_character_id, req.user.id);

      if (!target) {
        return res.status(404).json({ error: 'Personagem não encontrado' });
      }

      // Calcula a cura
      let healAmount = stats.heal || 0;
      if (stats.heal_percent) {
        healAmount = Math.floor((target.max_hp || target.hp) * (stats.heal_percent / 100));
      }

      const newHp = Math.min(target.max_hp || target.hp, target.hp + healAmount);
      const actualHeal = newHp - target.hp;

      if (actualHeal <= 0) {
        return res.status(400).json({ error: 'Personagem já está com HP cheio' });
      }

      db.prepare('UPDATE user_characters SET hp = ? WHERE id = ?').run(newHp, target.id);

      result = {
        message: `Poção usada! +${actualHeal} HP em ${item.item_name}`,
        healed: actualHeal,
        user_character_id: target.id,
      };
      break;
    }

    case 'food': {
      // Alimentos dão XP (e podem restaurar HP)
      if (!user_character_id) {
        return res.status(400).json({ error: 'Informe user_character_id para alimentar o personagem' });
      }

      const target = db
        .prepare(
          `SELECT uc.id, uc.level, uc.xp, uc.hp, uc.max_hp, c.name
           FROM user_characters uc
           JOIN characters c ON uc.character_id = c.id
           WHERE uc.id = ? AND uc.user_id = ?`
        )
        .get(user_character_id, req.user.id);

      if (!target) {
        return res.status(404).json({ error: 'Personagem não encontrado' });
      }

      const xpGain = stats.xp || 50;
      let levelsGained = 0;
      let newLevel = target.level;
      let newXp = target.xp + xpGain;

      // Calcula quantos níveis subiu
      while (newXp >= xpToNextLevel(newLevel)) {
        newXp -= xpToNextLevel(newLevel);
        newLevel++;
        levelsGained++;
      }

      // Restaura stamina/HP (alimentos recuperam 30% do HP máximo por padrão)
      let restoredHp = 0;
      if (target.max_hp && target.hp < target.max_hp) {
        const foodHealPercent = stats.heal_percent || 30;
        restoredHp = Math.floor(target.max_hp * (foodHealPercent / 100));
        restoredHp = Math.min(restoredHp, target.max_hp - target.hp);
      }

      // Atualiza o personagem (nível e stats multiplicados por 1.1 por nível)
      const statMult = Math.pow(1.1, levelsGained);
      const hp = target.max_hp ? Math.floor(target.max_hp * statMult) : target.hp;
      const newHp = hp ? (target.hp * statMult + restoredHp) : target.hp;

      db.prepare(
        'UPDATE user_characters SET level = ?, xp = ?, max_hp = ?, hp = ? WHERE id = ?'
      ).run(newLevel, newXp, hp, Math.min(hp, Math.floor(newHp)), target.id);

      // Progresso de missão (feed)
      registerProgress(req.user.id, 'feed', quantity);

      result = {
        message: `${target.name} comeu ${item.item_name}! +${xpGain} XP${levelsGained > 0 ? `, subiu ${levelsGained} nível(is)!` : ''}`,
        character: target.name,
        xp_gained: xpGain,
        levels_gained: levelsGained,
        new_level: newLevel,
        hp_restored: restoredHp,
      };
      break;
    }

    case 'ticket': {
      // Ticket de gacha: adiciona gems
      const gemsAmount = stats.gems || 100;
      db.prepare('UPDATE users SET gems = gems + ? WHERE id = ?').run(gemsAmount, req.user.id);
      result = {
        message: `Ticket usado! +${gemsAmount} gems`,
        gems_added: gemsAmount,
      };
      break;
    }

    case 'material': {
      return res.status(400).json({ error: 'Materiais são usados na evolução de personagens' });
    }

    case 'equipment': {
      return res.status(400).json({ error: 'Equipamentos são equipados automaticamente' });
    }

    default:
      return res.status(400).json({ error: 'Tipo de item não suportado' });
  }

  // Atualiza a quantidade ou remove o item
  if (item.quantity <= quantity) {
    db.prepare('DELETE FROM inventory WHERE id = ?').run(item.id);
  } else {
    db.prepare('UPDATE inventory SET quantity = quantity - ? WHERE id = ?').run(quantity, item.id);
  }

  return res.json({ ...result, item_remaining: item.quantity - quantity });
}

/**
 * Adiciona um item ao inventário (usado internamente)
 * @param {number} userId - ID do jogador
 * @param {string} itemName - Nome do item
 * @param {string} itemType - Tipo do item ('potion' | 'food' | 'ticket' | 'material' | 'equipment')
 * @param {number} quantity - Quantidade
 * @param {string} rarity - Raridade
 * @param {object} stats - Estatísticas do item
 */
function addItem(userId, itemName, itemType, quantity = 1, rarity = null, stats = null) {
  const existing = db
    .prepare(
      'SELECT id, quantity FROM inventory WHERE user_id = ? AND item_name = ? AND item_type = ?'
    )
    .get(userId, itemName, itemType);

  if (existing) {
    db.prepare('UPDATE inventory SET quantity = quantity + ? WHERE id = ?').run(quantity, existing.id);
    return existing.id;
  }

  const result = db
    .prepare(
      `INSERT INTO inventory (user_id, item_name, item_type, quantity, rarity, stats)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .run(userId, itemName, itemType, quantity, rarity, stats ? JSON.stringify(stats) : null);

  return result.lastInsertRowid;
}

module.exports = { getInventory, useItem, addItem };
