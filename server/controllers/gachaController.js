const db = require('../database');
const { formatNumber } = require('../utils/formatNumber');
const { registerProgress } = require('./missionController');

// Custo de pull em gems
const PULL_COST = 100;
const MULTI_PULL_COST = 1000; // 10x com desconto

/**
 * Lista os banners ativos
 * GET /api/banners
 */
function getBanners(req, res) {
  const banners = db
    .prepare(
      `SELECT id, name, description, image_url, start_date, end_date, is_active, created_at
       FROM banners
       WHERE is_active = 1
       ORDER BY created_at DESC`
    )
    .all();

  return res.json({ banners });
}

/**
 * Detalhes de um banner com personagens e taxas
 * GET /api/banners/:id
 */
function getBannerDetails(req, res) {
  const bannerId = req.params.id;

  const banner = db.prepare('SELECT * FROM banners WHERE id = ? AND is_active = 1').get(bannerId);

  if (!banner) {
    return res.status(404).json({ error: 'Banner não encontrado' });
  }

  // Personagens do banner com taxas
  const items = db
    .prepare(
      `SELECT bi.id, bi.drop_rate, bi.is_rate_up,
              c.id as character_id, c.name, c.anime, c.rarity, c.element, c.role,
              c.skill_name, c.skill_description, c.image_url, c.power_tier
       FROM banner_items bi
       JOIN characters c ON bi.character_id = c.id
       WHERE bi.banner_id = ?
       ORDER BY c.power_tier DESC`
    )
    .all(bannerId);

  // Agrupa por raridade para mostrar as taxas
  const byRarity = {};
  for (const item of items) {
    if (!byRarity[item.rarity]) {
      byRarity[item.rarity] = { characters: [], total_rate: 0 };
    }
    byRarity[item.rarity].characters.push(item);
    byRarity[item.rarity].total_rate += item.drop_rate;
  }

  return res.json({
    banner,
    pull_cost: PULL_COST,
    multi_pull_cost: MULTI_PULL_COST,
    items,
    by_rarity: byRarity,
  });
}

/**
 * Realiza um pull no banner
 * POST /api/banners/:id/pull
 * Body: { "quantity": 1 | 10 }
 */
function pull(req, res) {
  const bannerId = req.params.id;
  const { quantity = 1 } = req.body;

  if (quantity !== 1 && quantity !== 10) {
    return res.status(400).json({ error: 'Quantidade deve ser 1 ou 10' });
  }

  // Verifica se o banner existe e está ativo
  const banner = db.prepare('SELECT * FROM banners WHERE id = ? AND is_active = 1').get(bannerId);
  if (!banner) {
    return res.status(404).json({ error: 'Banner não encontrado' });
  }

  // Verifica o custo
  const cost = quantity === 10 ? MULTI_PULL_COST : PULL_COST;

  // Busca o usuário
  const user = db.prepare('SELECT gems FROM users WHERE id = ?').get(req.user.id);
  if (user.gems < cost) {
    return res.status(400).json({
      error: 'Gems insuficientes',
      required: cost,
      current: user.gems,
    });
  }

  // Verifica o limite da bag (20 personagens)
  const bagCount = db
    .prepare('SELECT COUNT(*) as count FROM user_characters WHERE user_id = ?')
    .get(req.user.id);

  if (bagCount.count + quantity > 20) {
    return res.status(400).json({
      error: 'Bag cheia! Libere espaço antes de puxar.',
      bag_count: bagCount.count,
      bag_limit: 20,
    });
  }

  // Busca os personagens do banner com taxas
  const bannerItems = db
    .prepare(
      `SELECT bi.character_id, bi.drop_rate, bi.is_rate_up,
              c.name, c.anime, c.rarity, c.base_hp, c.base_atk, c.base_def, c.base_speed,
              c.skill_name, c.skill_description, c.image_url, c.image_idle_url,
              c.gif_attack_url, c.gif_defend_url, c.gif_skill_url, c.gif_hit_url,
              c.gif_victory_url, c.gif_defeat_url, c.power_tier
       FROM banner_items bi
       JOIN characters c ON bi.character_id = c.id
       WHERE bi.banner_id = ?`
    )
    .all(bannerId);

  if (bannerItems.length === 0) {
    return res.status(400).json({ error: 'Banner sem personagens' });
  }

  // Realiza os pulls
  const results = [];
  const insertCharacter = db.prepare(
    `INSERT INTO user_characters (user_id, character_id, level, hp, max_hp, atk, def, speed)
     VALUES (?, ?, 1, ?, ?, ?, ?, ?)`
  );

  const pullTransaction = db.transaction(() => {
    // Debita as gems
    db.prepare('UPDATE users SET gems = gems - ? WHERE id = ?').run(cost, req.user.id);

    for (let i = 0; i < quantity; i++) {
      // Seleção ponderada pelo drop_rate
      const pulled = weightedSelect(bannerItems);

      // Insere o personagem na bag do jogador
      const result = insertCharacter.run(
        req.user.id,
        pulled.character_id,
        pulled.base_hp,
        pulled.base_hp,
        pulled.base_atk,
        pulled.base_def,
        pulled.base_speed
      );

      results.push({
        user_character_id: result.lastInsertRowid,
        name: pulled.name,
        anime: pulled.anime,
        rarity: pulled.rarity,
        skill_name: pulled.skill_name,
        skill_description: pulled.skill_description,
        image_url: pulled.image_url,
        image_idle_url: pulled.image_idle_url,
        gif_attack_url: pulled.gif_attack_url,
        gif_defend_url: pulled.gif_defend_url,
        gif_skill_url: pulled.gif_skill_url,
        gif_hit_url: pulled.gif_hit_url,
        gif_victory_url: pulled.gif_victory_url,
        gif_defeat_url: pulled.gif_defeat_url,
        power_tier: pulled.power_tier,
        hp: pulled.base_hp,
        atk: pulled.base_atk,
        def: pulled.base_def,
        speed: pulled.base_speed,
        hp_formatted: formatNumber(pulled.base_hp),
        atk_formatted: formatNumber(pulled.base_atk),
        def_formatted: formatNumber(pulled.base_def),
        speed_formatted: formatNumber(pulled.base_speed),
        is_rate_up: pulled.is_rate_up,
      });
    }
  });

  pullTransaction();

  // Progresso de missões (pull)
  registerProgress(req.user.id, 'pull', quantity);

  // Busca as gems restantes
  const updatedUser = db.prepare('SELECT gems FROM users WHERE id = ?').get(req.user.id);

  // Ordena os resultados por raridade (mais raro primeiro)
  const rarityOrder = { secret: 0, mythic: 1, legendary: 2, epic: 3, rare: 4, common: 5 };
  results.sort((a, b) => rarityOrder[a.rarity] - rarityOrder[b.rarity]);

  return res.json({
    message: quantity === 10 ? 'Multi-pull realizado!' : 'Pull realizado!',
    banner: { id: banner.id, name: banner.name },
    cost,
    gems_remaining: updatedUser.gems,
    results,
  });
}

/**
 * Seleção ponderada de personagem baseada no drop_rate
 * @param {Array} items - Personagens do banner com drop_rate
 * @returns {Object} Personagem selecionado
 */
function weightedSelect(items) {
  const totalRate = items.reduce((sum, item) => sum + item.drop_rate, 0);
  let random = Math.random() * totalRate;

  for (const item of items) {
    random -= item.drop_rate;
    if (random <= 0) {
      return item;
    }
  }

  // Fallback (nunca deve acontecer)
  return items[items.length - 1];
}

module.exports = { getBanners, getBannerDetails, pull };
