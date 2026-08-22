const express = require('express');
const { getBanners, getBannerDetails, pull } = require('../controllers/gachaController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// GET /api/banners - Listar banners ativos
router.get('/', getBanners);

// GET /api/banners/:id - Detalhes do banner
router.get('/:id', getBannerDetails);

// POST /api/banners/:id/pull - Realizar pull (requer autenticação)
router.post('/:id/pull', authenticate, pull);

module.exports = router;