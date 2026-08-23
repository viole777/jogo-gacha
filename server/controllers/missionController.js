const db = require('../database');

// Recompensas do login diário por streak
const DAILY_REWARDS = [
  { day: 1, gems: 50, gold: 500 },
  { day: 2, gems: 75, gold: 750 },
  { day: 3, gems: 100, gold: 1000 },
  { day: 4, gems: 150, gold: 1500 },
  { day: 5, gems: 200, gold: 2000 },
  { day: 6, gems: 250, gold: 2500 },
  { day: 7, gems: 500, gold: 5000 },
];

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function yesterdayStr() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

function ensureUserMissions(userId) {
  const missions = db.prepare('SELECT id FROM missions').all();
  const insert = db.prepare(
    'INSERT OR IGNORE INTO user_missions (user_id, mission_id) VALUES (?, ?)'
  );
  db.transaction(() => {
    for (const mission of missions) insert.run(userId, mission.id);
  })();
}

/**
 * Status do login diário (qual dia do streak, pode reivindicar?)
 * GET /api/missions/daily-login
 */
function getDailyLogin(req, res) {
  let row = db
    .prepare('SELECT * FROM user_daily_logins WHERE user_id = ?')
    .get(req.user.id);

  if (!row) {
    db.prepare('INSERT INTO user_daily_logins (user_id) VALUES (?)').run(req.user.id);
    row = db
      .prepare('SELECT * FROM user_daily_logins WHERE user_id = ?')
      .get(req.user.id);
  }

  const today = todayStr();
  const canClaim = row.last_claim !== today;
  // Streak: se o último claim foi ontem, continua; se foi antes, zera
  let streak = row.streak;
  if (canClaim) {
    if (row.last_claim !== yesterdayStr()) {
      streak = 0;
    }
  }

  const nextDay = (streak % 7) + 1;
  const reward = DAILY_REWARDS.find((r) => r.day === nextDay) || DAILY_REWARDS[0];

  return res.json({
    can_claim: canClaim,
    streak,
    total_days: row.total_days,
    next_day: nextDay,
    next_reward: reward,
    rewards: DAILY_REWARDS,
    last_claim: row.last_claim,
  });
}

/**
 * Reivindica a recompensa diária
 * POST /api/missions/daily-login/claim
 */
function claimDailyLogin(req, res) {
  let row = db
    .prepare('SELECT * FROM user_daily_logins WHERE user_id = ?')
    .get(req.user.id);

  if (!row) {
    db.prepare('INSERT INTO user_daily_logins (user_id) VALUES (?)').run(req.user.id);
    row = db
      .prepare('SELECT * FROM user_daily_logins WHERE user_id = ?')
      .get(req.user.id);
  }

  const today = todayStr();
  if (row.last_claim === today) {
    return res.status(400).json({ error: 'Você já reivindicou a recompensa hoje!' });
  }

  // Calcula streak
  let streak = row.streak;
  if (row.last_claim !== yesterdayStr()) {
    streak = 0;
  }
  streak += 1;

  const day = ((streak - 1) % 7) + 1;
  const reward = DAILY_REWARDS.find((r) => r.day === day) || DAILY_REWARDS[0];

  // Credita as recompensas
  db.prepare('UPDATE users SET gems = gems + ?, gold = gold + ? WHERE id = ?').run(
    reward.gems,
    reward.gold,
    req.user.id
  );

  // Atualiza o registro
  db.prepare(
    `UPDATE user_daily_logins
     SET last_claim = ?, streak = ?, total_days = total_days + 1, updated_at = CURRENT_TIMESTAMP
     WHERE user_id = ?`
  ).run(today, streak, req.user.id);

  return res.json({
    message: `Recompensa do dia ${day} reivindicada! +${reward.gems} gems, +${reward.gold} gold`,
    day,
    streak,
    reward,
  });
}

/**
 * Lista as missões do jogador (diárias, semanais, história)
 * GET /api/missions
 */
function getMissions(req, res) {
  // Garante que o jogador tem registro para todas as missões ativas
  ensureUserMissions(req.user.id);

  const userMissions = db
    .prepare(
      `SELECT m.id, m.name, m.description, m.type, m.objective_type, m.objective_target,
              m.reward_gems, m.reward_gold,
              um.progress, um.is_completed, um.claimed_at
       FROM missions m
       JOIN user_missions um ON m.id = um.mission_id
       WHERE um.user_id = ?
       ORDER BY m.type, m.id`
    )
    .all(req.user.id);

  const grouped = {
    daily: userMissions.filter((m) => m.type === 'daily'),
    weekly: userMissions.filter((m) => m.type === 'weekly'),
    story: userMissions.filter((m) => m.type === 'story'),
  };

  return res.json({
    missions: userMissions,
    grouped,
  });
}

/**
 * Reivindica a recompensa de uma missão completada
 * POST /api/missions/:id/claim
 */
function claimMission(req, res) {
  const missionId = req.params.id;

  ensureUserMissions(req.user.id);

  const row = db
    .prepare(
      `SELECT m.id, m.name, m.reward_gems, m.reward_gold,
              um.progress, um.is_completed, um.claimed_at
       FROM missions m
       JOIN user_missions um ON m.id = um.mission_id
       WHERE m.id = ? AND um.user_id = ?`
    )
    .get(missionId, req.user.id);

  if (!row) {
    return res.status(404).json({ error: 'Missão não encontrada' });
  }

  if (!row.is_completed) {
    return res.status(400).json({ error: 'Missão ainda não completada' });
  }

  if (row.claimed_at) {
    return res.status(400).json({ error: 'Recompensa já reivindicada' });
  }

  const claim = db.transaction(() => {
    const updated = db.prepare(
      `UPDATE user_missions
       SET claimed_at = CURRENT_TIMESTAMP
       WHERE user_id = ? AND mission_id = ? AND is_completed = 1 AND claimed_at IS NULL`
    ).run(req.user.id, missionId);
    if (updated.changes !== 1) throw new Error('Recompensa já reivindicada');
    db.prepare('UPDATE users SET gems = gems + ?, gold = gold + ? WHERE id = ?').run(
      row.reward_gems,
      row.reward_gold,
      req.user.id
    );
  });
  try {
    claim();
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }

  return res.json({
    message: `Missão "${row.name}" completada! +${row.reward_gems} gems, +${row.reward_gold} gold`,
    reward_gems: row.reward_gems,
    reward_gold: row.reward_gold,
  });
}

/**
 * Registra progresso de missão (usado internamente)
 * @param {number} userId - ID do jogador
 * @param {string} objectiveType - Tipo de objetivo (ex: 'pull', 'battle', 'boss')
 * @param {number} amount - Quanto progresso adicionar
 */
function registerProgress(userId, objectiveType, amount = 1) {
  ensureUserMissions(userId);
  const missions = db.prepare('SELECT id FROM missions WHERE objective_type = ?').all(objectiveType);

  const update = db.prepare(
    `UPDATE user_missions
     SET progress = MIN(progress + ?, (SELECT objective_target FROM missions WHERE id = mission_id))
     WHERE user_id = ? AND mission_id = ?`
  );

  const updateAndComplete = db.transaction(() => {
    for (const mission of missions) {
      update.run(amount, userId, mission.id);
    }
    db.prepare(
      `UPDATE user_missions
       SET is_completed = 1
       WHERE user_id = ? AND progress >= (SELECT objective_target FROM missions WHERE id = mission_id)`
    ).run(userId);
  });
  updateAndComplete();
}

/**
 * Semeia as missões padrão (usado no seed)
 */
function seedMissions() {
  const count = db.prepare('SELECT COUNT(*) as count FROM missions').get();
  if (count.count > 0) return;

  const insert = db.prepare(
    `INSERT INTO missions (name, description, type, objective_type, objective_target, reward_gems, reward_gold)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  );

  const missions = [
    // Diárias
    ['Puxar no Gacha', 'Faça 1 pull em qualquer banner', 'daily', 'pull', 1, 20, 200],
    ['Puxar 5x no Gacha', 'Faça 5 pulls em qualquer banner', 'daily', 'pull', 5, 50, 500],
    ['Derrote um Boss', 'Vença 1 batalha de boss', 'daily', 'boss', 1, 30, 300],
    ['Alimente um Personagem', 'Use 1 alimento em um personagem', 'daily', 'feed', 1, 20, 200],
    ['Evolua um Personagem', 'Evolua 1 personagem', 'daily', 'evolve', 1, 50, 500],
    ['Batalha PvP', 'Participe de 1 batalha PvP', 'daily', 'pvp', 1, 40, 400],

    // Semanais
    ['Colecionador', 'Puxe 20 personagens', 'weekly', 'pull', 20, 200, 2000],
    ['Caçador de Bosses', 'Derrote 5 bosses', 'weekly', 'boss', 5, 300, 3000],
    ['Gladiador', 'Vença 5 batalhas PvP', 'weekly', 'pvp_win', 5, 500, 5000],

    // História
    ['Primeiro Pull', 'Faça seu primeiro pull gacha', 'story', 'pull', 1, 100, 1000],
    ['Primeira Vitória de Boss', 'Derrote seu primeiro boss', 'story', 'boss', 1, 100, 1000],
    ['Primeira Evolução', 'Evolua um personagem pela primeira vez', 'story', 'evolve', 1, 150, 1500],
  ];

  const insertAll = db.transaction(() => {
    for (const m of missions) {
      insert.run(...m);
    }
  });
  insertAll();
}

module.exports = {
  getDailyLogin,
  claimDailyLogin,
  getMissions,
  claimMission,
  registerProgress,
  seedMissions,
};
