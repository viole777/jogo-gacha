const express = require('express');
const {
  getAccount,
  getCharacters,
  getTeam,
  setTeam,
  updateAvatar,
  toggleFavorite,
  toggleLock,
  deleteCharacter,
} = require('../controllers/accountController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Todas as rotas de conta exigem autenticação
router.use(authenticate);

// GET /api/account - Dados completos da conta
router.get('/', getAccount);

// GET /api/account/characters - Personagens da bag (máx. 20)
router.get('/characters', getCharacters);

// PUT /api/account/characters/:id/favorite - Favoritar/desfavoritar
router.put('/characters/:id/favorite', toggleFavorite);

// PUT /api/account/characters/:id/lock - Bloquear/desbloquear
router.put('/characters/:id/lock', toggleLock);

// DELETE /api/account/characters/:id - Deletar personagem
router.delete('/characters/:id', deleteCharacter);

// GET /api/account/team - Time ativo (máx. 3)
router.get('/team', getTeam);

// PUT /api/account/team - Montar time
router.put('/team', setTeam);

// PUT /api/account/avatar - Atualizar avatar
router.put('/avatar', updateAvatar);

module.exports = router;
