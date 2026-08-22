const express = require('express');
const { getShop, buyItem, sellCharacter } = require('../controllers/shopController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Todas as rotas da loja exigem autenticação
router.use(authenticate);

// GET /api/shop - Listar itens da loja e preços de venda
router.get('/', getShop);

// POST /api/shop/buy - Comprar item
router.post('/buy', buyItem);

// POST /api/shop/sell - Vender personagem
router.post('/sell', sellCharacter);

module.exports = router;