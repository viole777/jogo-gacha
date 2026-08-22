const db = require('../database');
const { addItem } = require('./inventoryController');
const { formatNumber } = require('../utils/formatNumber');
const { registerProgress } = require('./missionController');

/**
 * Lista os bosses disponíveis
 * GET /api/bosses
 */
function getBosses(req, res) {
  const bosses = db
    .prepare(
      `SELECT b.id, b.name, b.anime, b.hp, b.atk, b.def, b.difficulty, b.image_url,
              b.gif_attack_url, b.gif_defend_url, b.gif_skill_url,
              (SELECT GROUP_CONCAT(item_name || '|' || drop_rate || '|' || quantity, ';')
               FROM boss_drops WHERE boss_drops.boss_id = b.id) as drops_raw
       FROM bosses b
       ORDER BY b.difficulty, b.anime`
    )
    .all();

  const formatted = bosses.map((boss) => {
    const drops = (boss.drops_raw || '')
      .split(';')
      .filter(Boolean)
      .map((d) => {
        const [item_name, drop_rate, quantity] = d.split('|');
        return { item_name, drop_rate: parseFloat(drop_rate), quantity: parseInt(quantity, 10) };
      });

    return {
      ...boss,
      drops,
      drops_raw: undefined,
      hp_formatted: formatNumber(boss.hp),
      atk_formatted: formatNumber(boss.atk),
      def_formatted: formatNumber(boss.def),
    };
  });

  return res.json({ bosses: formatted });
}

/**
 * Luta contra um boss
 * POST /api/bosses/:id/fight
 * Body: { "team": [userCharacterId1, userCharacterId2, userCharacterId3] }
 */
function fightBoss(req, res) {
  const bossId = req.params.id;
  const { team = [] } = req.body;

  if (!Array.isArray(team) || team.length === 0 || team.length > 3) {
    return res.status(400).json({ error: 'Envie um time de 1 a 3 personagens' });
  }

  const boss = db.prepare('SELECT * FROM bosses WHERE id = ?').get(bossId);
  if (!boss) {
    return res.status(404).json({ error: 'Boss não encontrado' });
  }

  // Verifica o time do jogador
  const placeholders = team.map(() => '?').join(',');
  const teamChars = db
    .prepare(
      `SELECT uc.id, uc.level, uc.hp, uc.max_hp, uc.atk, uc.def, uc.speed,
              c.name, c.rarity, c.element, c.role, c.skill_name, c.skill_description,
              c.image_url, c.image_idle_url, c.gif_attack_url, c.gif_defend_url,
              c.gif_hit_url, c.gif_victory_url, c.gif_defeat_url
       FROM user_characters uc
       JOIN characters c ON uc.character_id = c.id
       WHERE uc.id IN (${placeholders}) AND uc.user_id = ?`
    )
    .all(...team, req.user.id);

  if (teamChars.length === 0) {
    return res.status(400).json({ error: 'Time inválido' });
  }

  // Simula a batalha
  let bossHp = boss.hp;
  const bossDef = boss.def;
  const bossAtk = boss.atk;
  const log = [];
  const events = [];
  let playerSurvived = true;

  const maxTurns = 30;
  for (let turn = 1; turn <= maxTurns && bossHp > 0; turn++) {
    // Ataque do time
    for (const char of teamChars) {
      if (bossHp <= 0) break;
      if (char.hp <= 0) continue;

      const damage = Math.max(1, Math.floor(char.atk - bossDef * 0.3));
      bossHp -= damage;
      log.push(`Turno ${turn}: ${char.name} causa ${formatNumber(damage)} de dano no boss.`);
      events.push({
        type: 'player_attack',
        turn,
        attacker: char.name,
        attacker_id: char.id,
        target: boss.name,
        damage,
        damage_formatted: formatNumber(damage),
        boss_hp: Math.max(0, Math.floor(bossHp)),
        boss_hp_formatted: formatNumber(Math.max(0, bossHp)),
        char_hp: Math.max(0, Math.floor(char.hp)),
      });
    }

    if (bossHp <= 0) break;

    // Ataque do boss
    for (const char of teamChars) {
      if (char.hp <= 0) continue;
      const damage = Math.max(1, Math.floor(bossAtk - char.def * 0.5));
      char.hp -= damage;
      log.push(`Turno ${turn}: ${boss.name} causa ${formatNumber(damage)} de dano em ${char.name}.`);
      events.push({
        type: 'boss_attack',
        turn,
        attacker: boss.name,
        target: char.name,
        target_id: char.id,
        damage,
        damage_formatted: formatNumber(damage),
        boss_hp: Math.max(0, Math.floor(bossHp)),
        char_hp: Math.max(0, Math.floor(char.hp)),
      });
      if (char.hp <= 0) {
        log.push(`${char.name} foi derrotado!`);
        events.push({
          type: 'player_defeated',
          turn,
          target: char.name,
          target_id: char.id,
          char_hp: 0,
        });
      }
    }

    const allDead = teamChars.every((c) => c.hp <= 0);
    if (allDead) {
      playerSurvived = false;
      break;
    }
  }

  const victory = playerSurvived && bossHp <= 0;

  // Persiste o HP dos personagens (dano de batalha é permanente até curar)
  const updateHp = db.prepare('UPDATE user_characters SET hp = ? WHERE id = ? AND user_id = ?');
  const hpTransaction = db.transaction(() => {
    for (const char of teamChars) {
      updateHp.run(Math.max(0, Math.floor(char.hp)), char.id, req.user.id);
    }
  });
  hpTransaction();

  // Se venceu, calcula os drops
  const drops = [];
  if (victory) {
    const bossDrops = db
      .prepare('SELECT item_name, drop_rate, quantity FROM boss_drops WHERE boss_id = ?')
      .all(bossId);

    for (const drop of bossDrops) {
      if (Math.random() < drop.drop_rate) {
        addItem(req.user.id, drop.item_name, 'material', drop.quantity, 'epic', {
          evolution_material: true,
        });
        drops.push({ item_name: drop.item_name, quantity: drop.quantity });
      }
    }

    const goldReward = { easy: 500, normal: 1500, hard: 3000, nightmare: 8000 }[boss.difficulty] || 1000;
    db.prepare('UPDATE users SET gold = gold + ? WHERE id = ?').run(goldReward, req.user.id);

    registerProgress(req.user.id, 'boss');
  }

  return res.json({
    victory,
    boss: {
      id: boss.id,
      name: boss.name,
      anime: boss.anime,
      difficulty: boss.difficulty,
      image_url: boss.image_url,
      gif_attack_url: boss.gif_attack_url,
      gif_defend_url: boss.gif_defend_url,
      gif_skill_url: boss.gif_skill_url,
      hp: boss.hp,
      atk: boss.atk,
      def: boss.def,
    },
    boss_hp_remaining: Math.max(0, Math.floor(bossHp)),
    boss_hp_formatted: formatNumber(Math.max(0, bossHp)),
    log,
    events,
    drops,
    drops_formatted: drops.map((d) => `${d.item_name} x${d.quantity}`),
    team_status: teamChars.map((c) => ({
      id: c.id,
      name: c.name,
      hp: Math.max(0, c.hp),
      hp_formatted: formatNumber(Math.max(0, c.hp)),
      max_hp: c.max_hp,
      image_url: c.image_url,
      image_idle_url: c.image_idle_url,
      gif_attack_url: c.gif_attack_url,
      gif_defend_url: c.gif_defend_url,
      gif_hit_url: c.gif_hit_url,
      gif_victory_url: c.gif_victory_url,
      gif_defeat_url: c.gif_defeat_url,
    })),
  });
}

module.exports = { getBosses, fightBoss };
