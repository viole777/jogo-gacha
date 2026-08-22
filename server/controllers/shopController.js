const db = require('../database');
const { addItem } = require('./inventoryController');

// Preços dos itens da loja
const SHOP_ITEMS = [
  {
    id: 'luck_potion',
    name: 'Poção de Sorte',
    description: 'Aumenta as chances de conseguir personagens raros no gacha por 30 minutos.',
    price_gems: 50,
    price_gold: null,
    rarity: 'epic',
  },
  {
    id: 'luck_scroll',
    name: 'Scroll da Sorte',
    description: 'Garante 1 personagem épico ou superior no próximo pull.',
    price_gems: 200,
    price_gold: null,
    rarity: 'legendary',
  },
  {
    id: 'gacha_ticket',
    name: 'Ticket de Gacha',
    description: 'Permite 1 pull grátis em qualquer banner.',
    price_gems: 100,
    price_gold: null,
    rarity: 'rare',
  },
  {
    id: 'heal_potion',
    name: 'Poção de Cura',
    description: 'Restaura a vida de um personagem do time.',
    price_gems: null,
    price_gold: 500,
    rarity: 'common',
  },
  {
    id: 'picanha_anja',
    name: '🍖 Picanha do Anja',
    description: 'Alimento raro que dá 500 XP ao personagem e restaura 40% do HP.',
    price_gems: null,
    price_gold: 1500,
    rarity: 'rare',
  },
  {
    id: 'miojo_ramen',
    name: '🍜 Miojo Ramen',
    description: 'Alimento comum que dá 150 XP ao personagem e restaura 25% do HP.',
    price_gems: null,
    price_gold: 300,
    rarity: 'common',
  },
  {
    id: 'bom_hamburguer',
    name: '🍔 Bom Hamburguer',
    description: 'Alimento que dá 300 XP ao personagem e restaura 30% do HP.',
    price_gems: null,
    price_gold: 800,
    rarity: 'rare',
  },
  {
    id: 'churros',
    name: '🥖 Churros de Doce de Leite',
    description: 'Alimento que dá 250 XP ao personagem e restaura 20% do HP.',
    price_gems: null,
    price_gold: 600,
    rarity: 'common',
  },
  {
    id: 'empadao',
    name: '🥧 Empadão da Vó',
    description: 'Alimento delicioso que dá 400 XP e restaura 35% do HP.',
    price_gems: null,
    price_gold: 1000,
    rarity: 'rare',
  },
];


// Preços de venda de personagens por raridade
const SELL_PRICES_GOLD = {
  common: 100,
  rare: 500,
  epic: 2000,
  legendary: 10000,
  mythic: 50000,
  secret: 250000,
};

// Preços de venda de legendários e secretos em gems
const SELL_PRICES_GEMS = {
  legendary: 20,
  mythic: 50,
  secret: 100,
};

/**
 * Lista os itens disponíveis na loja
 * GET /api/shop
 */
function getShop(req, res) {
  return res.json({
    items: SHOP_ITEMS,
    sell_prices_gold: SELL_PRICES_GOLD,
    sell_prices_gems: SELL_PRICES_GEMS,
  });
}

/**
 * Compra um item da loja
 * POST /api/shop/buy
 * Body: { "item_id": "luck_potion", "quantity": 1 }
 */
function buyItem(req, res) {
  const { item_id, quantity = 1 } = req.body;

  if (!item_id) {
    return res.status(400).json({ error: 'item_id é obrigatório' });
  }

  const shopItem = SHOP_ITEMS.find((item) => item.id === item_id);
  if (!shopItem) {
    return res.status(404).json({ error: 'Item não encontrado na loja' });
  }

  // Busca o usuário
  const user = db.prepare('SELECT gems, gold FROM users WHERE id = ?').get(req.user.id);

  // Determina a moeda de pagamento
  let totalCost;
  let currency;
  if (shopItem.price_gems !== null) {
    totalCost = shopItem.price_gems * quantity;
    currency = 'gems';
    if (user.gems < totalCost) {
      return res.status(400).json({
        error: 'Gems insuficientes',
        required: totalCost,
        current: user.gems,
      });
    }
  } else if (shopItem.price_gold !== null) {
    totalCost = shopItem.price_gold * quantity;
    currency = 'gold';
    if (user.gold < totalCost) {
      return res.status(400).json({
        error: 'Gold insuficiente',
        required: totalCost,
        current: user.gold,
      });
    }
  } else {
    return res.status(400).json({ error: 'Item sem preço definido' });
  }

  // Debita a moeda
  if (currency === 'gems') {
    db.prepare('UPDATE users SET gems = gems - ? WHERE id = ?').run(totalCost, req.user.id);
  } else {
    db.prepare('UPDATE users SET gold = gold - ? WHERE id = ?').run(totalCost, req.user.id);
  }

  // Adiciona o item ao inventário
  const FOOD_STATS = {
    picanha_anja: { xp: 500, heal_percent: 40 },
    miojo_ramen: { xp: 150, heal_percent: 25 },
    bom_hamburguer: { xp: 300, heal_percent: 30 },
    churros: { xp: 250, heal_percent: 20 },
    empadao: { xp: 400, heal_percent: 35 },
  };

  let itemType = 'material';
  if (item_id === 'heal_potion') itemType = 'potion';
  if (item_id === 'gacha_ticket') itemType = 'ticket';
  if (FOOD_STATS[item_id]) itemType = 'food';

  const stats = {};
  if (item_id === 'luck_potion') stats.luck_boost = 1.5; // 50% mais sorte
  if (item_id === 'luck_scroll') stats.guaranteed_epic = true;
  if (item_id === 'gacha_ticket') stats.gems = 100;
  if (item_id === 'heal_potion') stats.heal = 100000;
  if (FOOD_STATS[item_id]) Object.assign(stats, FOOD_STATS[item_id]);

  addItem(req.user.id, shopItem.name, itemType, quantity, shopItem.rarity, stats);

  // Busca saldo atualizado
  const updatedUser = db.prepare('SELECT gems, gold FROM users WHERE id = ?').get(req.user.id);

  return res.json({
    message: `${shopItem.name} comprado com sucesso!`,
    item: shopItem.name,
    quantity,
    cost: totalCost,
    currency,
    gems_remaining: updatedUser.gems,
    gold_remaining: updatedUser.gold,
  });
}

/**
 * Vende um personagem da bag
 * POST /api/shop/sell
 * Body: { "user_character_id": 1 }
 */
function sellCharacter(req, res) {
  const { user_character_id } = req.body;

  if (!user_character_id) {
    return res.status(400).json({ error: 'user_character_id é obrigatório' });
  }

  // Busca o personagem do jogador
  const char = db
    .prepare(
      `SELECT uc.id, uc.user_id, c.name, c.rarity, c.is_admin_exclusive
       FROM user_characters uc
       JOIN characters c ON uc.character_id = c.id
       WHERE uc.id = ? AND uc.user_id = ?`
    )
    .get(user_character_id, req.user.id);

  if (!char) {
    return res.status(404).json({ error: 'Personagem não encontrado' });
  }

  // Não permite vender personagens exclusivos do admin
  if (char.is_admin_exclusive === 1) {
    return res.status(400).json({ error: 'Não é possível vender personagens exclusivos do admin' });
  }

  // Calcula o valor
  let goldReward = SELL_PRICES_GOLD[char.rarity] || 0;
  let gemsReward = SELL_PRICES_GEMS[char.rarity] || 0;

  // Legendários e secretos são vendidos por gems
  const isPremiumSell = char.rarity === 'legendary' || char.rarity === 'mythic' || char.rarity === 'secret';

  // Remove o personagem da bag
  db.prepare('DELETE FROM user_characters WHERE id = ?').run(user_character_id);

  // Remove do time se estiver nele
  db.prepare('DELETE FROM user_teams WHERE user_character_id = ?').run(user_character_id);

  // Credita o pagamento
  if (isPremiumSell && gemsReward > 0) {
    db.prepare('UPDATE users SET gems = gems + ? WHERE id = ?').run(gemsReward, req.user.id);
  } else {
    db.prepare('UPDATE users SET gold = gold + ? WHERE id = ?').run(goldReward, req.user.id);
  }

  const updatedUser = db.prepare('SELECT gems, gold FROM users WHERE id = ?').get(req.user.id);

  return res.json({
    message: `${char.name} vendido com sucesso!`,
    character: char.name,
    rarity: char.rarity,
    gold_reward: isPremiumSell ? 0 : goldReward,
    gems_reward: isPremiumSell ? gemsReward : 0,
    gems_remaining: updatedUser.gems,
    gold_remaining: updatedUser.gold,
  });
}

module.exports = { getShop, buyItem, sellCharacter };
