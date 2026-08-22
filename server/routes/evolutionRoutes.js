const express = require('express');
const { getCharacterEvolutions, evolveCharacter } = require('../controllers/evolutionController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Todas as rotas de evolução exigem autenticação
router.use(authenticate);

// GET /api/evolution/character/:id - Evoluções disponíveis do personagem
router.get('/character/:id', getCharacterEvolutions);

// POST /api/evolution/evolve - Evoluir personagem
router.post('/evolve', evolveCharacter);

module.exports = router;
