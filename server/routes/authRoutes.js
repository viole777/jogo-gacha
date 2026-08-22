const express = require('express');
const { register, login, me } = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// POST /api/auth/register - Registro de novo jogador
router.post('/register', register);

// POST /api/auth/login - Login de jogador
router.post('/login', login);

// GET /api/auth/me - Perfil do jogador autenticado
router.get('/me', authenticate, me);

module.exports = router;