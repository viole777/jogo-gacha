const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../database');
const { jwtSecret, jwtExpiresIn } = require('../config/env');
const { addItem } = require('./inventoryController');

/**
 * Registro de novo jogador
 * POST /api/auth/register
 */
function register(req, res) {
  const { username, email, password } = req.body;

  // Validação básica
  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Username, email e senha são obrigatórios' });
  }

  if (username.length < 3 || username.length > 20) {
    return res.status(400).json({ error: 'Username deve ter entre 3 e 20 caracteres' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Senha deve ter pelo menos 6 caracteres' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Email inválido' });
  }

  // Verifica se username ou email já existem
  const existing = db
    .prepare('SELECT id FROM users WHERE username = ? OR email = ?')
    .get(username, email);

  if (existing) {
    return res.status(409).json({ error: 'Username ou email já cadastrado' });
  }

  // Hash da senha com bcrypt (custo 10)
  const passwordHash = bcrypt.hashSync(password, 10);

  // Cria o usuário
  const result = db
    .prepare('INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)')
    .run(username, email, passwordHash);

  const userId = result.lastInsertRowid;

  // Cria o registro no ranking
  db.prepare('INSERT INTO rankings (user_id, rating) VALUES (?, 1000)').run(userId);

  // Itens iniciais de boas-vindas (alimentos + poção)
  addItem(userId, '🍜 Miojo Ramen', 'food', 3, 'common', { xp: 150, heal_percent: 25 });
  addItem(userId, '🍖 Picanha do Anja', 'food', 1, 'rare', { xp: 500, heal_percent: 40 });
  addItem(userId, 'Poção de Cura', 'potion', 2, 'common', { heal: 100000 });

  // Gera o token JWT
  const token = jwt.sign({ userId }, jwtSecret, { expiresIn: jwtExpiresIn });

  return res.status(201).json({
    message: 'Conta criada com sucesso!',
    token,
    user: {
      id: userId,
      username,
      email,
      gems: 1000,
      gold: 5000,
      level: 1,
      is_admin: 0,
    },
  });
}

/**
 * Login de jogador
 * POST /api/auth/login
 */
function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email e senha são obrigatórios' });
  }

  // Busca o usuário pelo email
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

  if (!user) {
    return res.status(401).json({ error: 'Credenciais inválidas' });
  }

  // Verifica a senha
  const passwordMatch = bcrypt.compareSync(password, user.password_hash);

  if (!passwordMatch) {
    return res.status(401).json({ error: 'Credenciais inválidas' });
  }

  // Atualiza o último login
  db.prepare('UPDATE users SET last_login = CURRENT_TIMESTAMP, last_seen = CURRENT_TIMESTAMP WHERE id = ?').run(user.id);

  // Gera o token JWT
  const token = jwt.sign({ userId: user.id }, jwtSecret, { expiresIn: jwtExpiresIn });

  return res.json({
    message: 'Login realizado com sucesso!',
    token,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      gems: user.gems,
      gold: user.gold,
      level: user.level,
      xp: user.xp,
      is_admin: user.is_admin,
    },
  });
}

/**
 * Perfil do jogador autenticado
 * GET /api/auth/me
 */
function me(req, res) {
  const user = db
    .prepare(
      `SELECT id, username, email, gems, gold, level, xp, avatar_url, is_admin, last_login, created_at
       FROM users WHERE id = ?`
    )
    .get(req.user.id);

  if (!user) {
    return res.status(404).json({ error: 'Usuário não encontrado' });
  }

  return res.json({ user });
}

module.exports = { register, login, me };
