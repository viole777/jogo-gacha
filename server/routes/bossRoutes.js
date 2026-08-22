const express = require('express');
const { getBosses, fightBoss } = require('../controllers/bossController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Todas as rotas de bosses exigem autenticação
router.use(authenticate);

// GET /api/bosses - Listar bosses
router.get('/', getBosses);

// POST /api/bosses/:id/fight - Lutar contra um boss
router.post('/:id/fight', fightBoss);

module.exports = router;
