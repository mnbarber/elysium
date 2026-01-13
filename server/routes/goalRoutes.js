const express = require('express');
const router = express.Router();
const goalController = require('../controllers/goalController');
const auth = require('../middleware/auth');

router.post('/goals', auth, goalController.createGoal);
router.get('/goals/user/:userId', goalController.getUserGoals);
router.get('/goals', auth, goalController.getUserGoals);
router.put('/goals/:goalId', auth, goalController.updateGoal);
router.delete('/goals/:goalId', auth, goalController.deleteGoal);

module.exports = router;