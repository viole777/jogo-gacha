const express = require('express');
const {
  getDailyLogin,
  claimDailyLogin,
  getMissions,
  claimMission,
} = require('../controllers/missionController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Todas as rotas de missões exigem autenticação
router.use(authenticate);

// GET /api/missions - Listar missões do jogador
router.get('/', getMissions);

// GET /api/missions/daily-login - Status do login diário
router.get('/daily-login', getDailyLogin);

// POST /api/missions/daily-login/claim - Reivindicar recompensa diária
router.post('/daily-login/claim', claimDailyLogin);

// POST /api/missions/:id/claim - Reivindicar recompensa de missão
router.post('/:id/claim', claimMission);

module.exports = router;
