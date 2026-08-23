const express = require('express');
const { createFeedback } = require('../controllers/feedbackController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);
router.post('/', createFeedback);

module.exports = router;