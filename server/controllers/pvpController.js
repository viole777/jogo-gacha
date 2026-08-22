const db = require('../database');
const { formatNumber } = require('../utils/formatNumber');
const { registerProgress } = require('./missionController');

// Fórmula Elo
const K = 32;

/**
 * Lista o ranking global (top 50)
 * GET /api/pvp/ranking
 */
function getRanking(req, res) {
  const ranking = db
    .prepare(
      `SELECT r.rating, r.wins, r.losses, r.rank,
              u.id as user_id, u.username, u.level, u.avatar_url
       FROM rankings r
       JOIN users u ON r.user_id = u.id
       ORDER BY r.rating DESC
       LIMIT 50`
    )
    .all();

  // Recalcula a posição (rank)
  const formatted = ranking.map((entry, index) => ({
    ...entry,
    rank: index + 1,
    winrate: entry.wins + entry.losses > 0
      ? Math.round((entry.wins / (entry.wins + entry.losses)) * 100)
      : 0,
  }));

  // Posição do jogador
  const myRow = db
    .prepare(
      `SELECT COUNT(*) as position FROM rankings r
       JOIN users u ON r.user_id = u.id
       WHERE r.rating > (SELECT rating FROM rankings WHERE user_id = ?)`
    )
    .get(req.user.id);

  const myRanking = db
    .prepare('SELECT rating, wins, losses FROM rankings WHERE user_id = ?')
    .get(req.user.id);

  return res.json({
    ranking: formatted,
    my_position: myRanking ? myRow.position + 1 : null,
    my_rating: myRanking ? myRanking.rating : 1000,
    my_wins: myRanking ? myRanking.wins : 0,
    my_losses: myRanking ? myRanking.losses : 0,
  });
}

/**
 * Busca os saves dos oponentes (jogadores com rating próximo)
 * GET /api/pvp/opponents
 */
function getOpponents(req, res) {
  const myRating = db
    .prepare('SELECT rating FROM rankings WHERE user_id = ?')
    .get(req.user.id);

  const baseRating = myRating ? myRating.rating : 1000;

  const opponents = db
    .prepare(
      `SELECT u.id as user_id, u.username, u.level, u.avatar_url,
              r.rating, r.wins, r.losses,
              (SELECT COUNT(*) FROM user_characters WHERE user_id = u.id) as units_count,
              (SELECT COUNT(*) FROM user_teams WHERE user_id = u.id) as team_count,
              (SELECT c.image_url FROM user_teams ut
               JOIN user_characters uc ON ut.user_character_id = uc.id
               JOIN characters c ON uc.character_id = c.id
               WHERE ut.user_id = u.id ORDER BY ut.slot LIMIT 1) as team_avatar
       FROM rankings r
       JOIN users u ON r.user_id = u.id
       WHERE u.id != ? AND (SELECT COUNT(*) FROM user_teams WHERE user_id = u.id) > 0
       ORDER BY ABS(r.rating - ?) ASC
       LIMIT 10`
    )
    .all(req.user.id, baseRating);

  return res.json({ opponents });
}

/**
 * Desafia um jogador para PvP assíncrono
 * POST /api/pvp/battle
 * Body: { "defender_id": 5 }
 */
function challengePvP(req, res) {
  const { defender_id } = req.body;

  if (!defender_id) {
    return res.status(400).json({ error: 'defender_id é obrigatório' });
  }

  if (defender_id === req.user.id) {
    return res.status(400).json({ error: 'Você não pode desafiar a si mesmo' });
  }

  // Busca o time do atacante
  const attackerTeam = getTeamPower(req.user.id);
  if (!attackerTeam || attackerTeam.length === 0) {
    return res.status(400).json({ error: 'Monte um time antes de batalhar' });
  }

  // Busca o time do defensor
  const defenderTeam = getTeamPower(defender_id);
  if (!defenderTeam || defenderTeam.length === 0) {
    return res.status(404).json({ error: 'Oponente não possui time montado' });
  }

  // Simula a batalha
  const battle = simulateBattle(attackerTeam, defenderTeam);

  // Calcula Elo
  const attackerRatingRow = db
    .prepare('SELECT rating FROM rankings WHERE user_id = ?')
    .get(req.user.id);
  const defenderRatingRow = db
    .prepare('SELECT rating FROM rankings WHERE user_id = ?')
    .get(defender_id);

  const attackerRating = attackerRatingRow ? attackerRatingRow.rating : 1000;
  const defenderRating = defenderRatingRow ? defenderRatingRow.rating : 1000;

  const expected = 1 / (1 + Math.pow(10, (defenderRating - attackerRating) / 400));
  let attackerDelta;
  let defenderDelta;

  if (battle.attackerWon) {
    attackerDelta = Math.round(K * (1 - expected));
    defenderDelta = -Math.round(K * expected);
  } else {
    attackerDelta = Math.round(K * (0 - expected));
    defenderDelta = Math.round(K * (1 - expected));
  }

  // Atualiza rankings
  const updateRanking = db.prepare(
    `UPDATE rankings
     SET rating = rating + ?, wins = wins + ?, losses = losses + ?, updated_at = CURRENT_TIMESTAMP
     WHERE user_id = ?`
  );
  updateRanking.run(
    battle.attackerWon ? attackerDelta : 0,
    battle.attackerWon ? 1 : 0,
    battle.attackerWon ? 0 : 1,
    req.user.id
  );
  updateRanking.run(
    battle.attackerWon ? 0 : defenderDelta,
    battle.attackerWon ? 0 : 1,
    battle.attackerWon ? 1 : 0,
    defender_id
  );

  // Registra o resultado
  db.prepare(
    `INSERT INTO battle_results (attacker_id, defender_id, winner_id, attacker_team, defender_team, battle_log)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(
    req.user.id,
    defender_id,
    battle.attackerWon ? req.user.id : defender_id,
    JSON.stringify(attackerTeam.map((c) => c.name)),
    JSON.stringify(defenderTeam.map((c) => c.name)),
    JSON.stringify(battle.log)
  );

  // Progresso de missão
  registerProgress(req.user.id, 'pvp');
  if (battle.attackerWon) {
    registerProgress(req.user.id, 'pvp_win');
  }

  // Busca o username do defensor para a resposta
  const defender = db
    .prepare('SELECT username FROM users WHERE id = ?')
    .get(defender_id);

  return res.json({
    victory: battle.attackerWon,
    message: battle.attackerWon
      ? `Vitória contra ${defender.username}!`
      : `Derrota para ${defender.username}.`,
    opponent: { id: defender_id, username: defender.username },
    rating_change: attackerDelta,
    new_rating: attackerRating + attackerDelta,
    log: battle.log,
    events: battle.events || [],
    attacker_team: attackerTeam,
    defender_team: defenderTeam,
  });
}

/**
 * Busca o time de um jogador com poder de combate calculado
 */
function getTeamPower(userId) {
  return db
    .prepare(
      `SELECT ut.slot, uc.id as user_character_id, uc.hp, uc.max_hp, uc.atk, uc.def, uc.speed,
              c.name, c.rarity, c.element, c.role,
              c.image_url, c.image_idle_url, c.gif_attack_url, c.gif_defend_url,
              c.gif_hit_url, c.gif_victory_url, c.gif_defeat_url
       FROM user_teams ut
       JOIN user_characters uc ON ut.user_character_id = uc.id
       JOIN characters c ON uc.character_id = c.id
       WHERE ut.user_id = ?
       ORDER BY ut.slot`
    )
    .all(userId);
}

/**
 * Simula uma batalha entre dois times
 */
function simulateBattle(attackerTeam, defenderTeam) {
  const log = [];
  const events = [];
  const attackerAlive = attackerTeam.map((c) => ({ ...c, currentHp: c.max_hp || c.hp }));
  const defenderAlive = defenderTeam.map((c) => ({ ...c, currentHp: c.max_hp || c.hp }));

  const maxTurns = 30;
  let attackerWon = false;

  for (let turn = 1; turn <= maxTurns; turn++) {
    // Ataque do atacante
    for (const unit of attackerAlive) {
      if (unit.currentHp <= 0) continue;
      const target = defenderAlive.find((d) => d.currentHp > 0);
      if (!target) {
        attackerWon = true;
        break;
      }
      const damage = Math.max(1, Math.floor(unit.atk - target.def * 0.3));
      target.currentHp -= damage;
      log.push(`Turno ${turn}: ${unit.name} ataca ${target.name} (-${formatNumber(damage)})`);
      events.push({
        type: 'attack',
        turn,
        attacker: unit.name,
        attacker_id: unit.user_character_id,
        target: target.name,
        target_id: target.user_character_id,
        damage,
        damage_formatted: formatNumber(damage),
        target_hp: Math.max(0, Math.floor(target.currentHp)),
      });
      if (target.currentHp <= 0) {
        log.push(`${target.name} foi derrotado!`);
        events.push({
          type: 'defeated',
          turn,
          target: target.name,
          target_id: target.user_character_id,
          target_hp: 0,
        });
      }
    }

    if (attackerWon) break;
    if (!defenderAlive.some((d) => d.currentHp > 0)) {
      attackerWon = true;
      break;
    }

    // Ataque do defensor
    for (const unit of defenderAlive) {
      if (unit.currentHp <= 0) continue;
      const target = attackerAlive.find((a) => a.currentHp > 0);
      if (!target) break;
      const damage = Math.max(1, Math.floor(unit.atk - target.def * 0.3));
      target.currentHp -= damage;
      log.push(`Turno ${turn}: ${unit.name} ataca ${target.name} (-${formatNumber(damage)})`);
      events.push({
        type: 'attack',
        turn,
        attacker: unit.name,
        attacker_id: unit.user_character_id,
        target: target.name,
        target_id: target.user_character_id,
        damage,
        damage_formatted: formatNumber(damage),
        target_hp: Math.max(0, Math.floor(target.currentHp)),
      });
      if (target.currentHp <= 0) {
        log.push(`${target.name} foi derrotado!`);
        events.push({
          type: 'defeated',
          turn,
          target: target.name,
          target_id: target.user_character_id,
          target_hp: 0,
        });
      }
    }

    if (!attackerAlive.some((a) => a.currentHp > 0)) break;
  }

  if (attackerWon) {
    return { attackerWon: true, log, events };
  }

  const attackerHasAlive = attackerAlive.some((a) => a.currentHp > 0);
  const defenderHasAlive = defenderAlive.some((d) => d.currentHp > 0);

  return {
    attackerWon: attackerHasAlive && !defenderHasAlive,
    log,
    events,
  };
}

module.exports = { getRanking, getOpponents, challengePvP };
