const express = require('express');
const { getRanking, getPublicProfile, getOpponents, challengePvP } = require('../controllers/pvpController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Todas as rotas de PvP exigem autenticação
router.use(authenticate);

// GET /api/pvp/ranking - Ranking global
router.get('/ranking', getRanking);

// GET /api/pvp/profile/:id - Perfil público
router.get('/profile/:id', getPublicProfile);

// GET /api/pvp/opponents - Oponentes disponíveis
router.get('/opponents', getOpponents);

// POST /api/pvp/battle - Desafiar jogador
router.post('/battle', challengePvP);

module.exports = router;
