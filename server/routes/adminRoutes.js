const express = require('express');
const { getPlayers, grantCurrency, deletePlayer } = require('../controllers/adminController');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate, requireAdmin);
router.get('/players', getPlayers);
router.post('/players/:id/currency', grantCurrency);
router.delete('/players/:id', deletePlayer);

module.exports = router;