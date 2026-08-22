const express = require('express');
const { getInventory, useItem } = require('../controllers/inventoryController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Todas as rotas de inventário exigem autenticação
router.use(authenticate);

// GET /api/inventory - Listar itens do inventário
router.get('/', getInventory);

// POST /api/inventory/use - Usar um item
router.post('/use', useItem);

module.exports = router;