const Goal = require('../models/goal');
const Library = require('../models/library');

// create a new goal
const createGoal = async (req, res) => {
  try {
    const { type, targetValue, timeframe } = req.body;

    if (!type || !targetValue || !timeframe) {
      return res.status(400).json({ error: 'Type, target value, and timeframe are required' });
    }

    const now = new Date();
    let startDate = new Date();
    let endDate = new Date();

    switch (timeframe) {
      case 'week':
        startDate.setDate(now.getDate() - now.getDay());
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
        break;
      case 'all-time':
        startDate = new Date(2020, 0, 1);
        endDate = new Date(2099, 11, 31, 23, 59, 59, 999);
        break;
      default:
        return res.status(400).json({ error: 'Invalid timeframe' });
    }

    const goal = new Goal({
      userId: req.userId,
      type,
      targetValue,
      timeframe,
      startDate,
      endDate,
      isActive: true
    });

    await goal.save();

    res.status(201).json({
      message: 'Goal created successfully',
      goal
    });
  } catch (error) {
    console.error('Error creating goal:', error);
    res.status(500).json({ error: 'Error creating goal' });
  }
};

// get user's goals with progress
const getUserGoals = async (req, res) => {
  try {
    const userId = req.params.userId || req.userId;

    const goals = await Goal.find({ userId, isActive: true });
    console.log('Fetched goals for user:', userId, goals);

    const library = await Library.findOne({ userId });

    if (!library) {
      return res.json({ goals: [] });
    }

    const goalsWithProgress = goals.map(goal => {
      let currentValue = 0;

      if (goal.type === 'books') {
        const booksRead = library.read.filter(book => {
          if (!book.completedAt) return false;
          const completedDate = new Date(book.completedAt);
          return completedDate >= goal.startDate && completedDate <= goal.endDate;
        });
        currentValue = booksRead.length;
      } else if (goal.type === 'pages') {
        const booksRead = library.read.filter(book => {
          if (!book.completedAt) return false;
          const completedDate = new Date(book.completedAt);
          return completedDate >= goal.startDate && completedDate <= goal.endDate;
        });
        currentValue = booksRead.reduce((sum, book) => sum + (book.numberOfPages || 0), 0);
      }

      const progress = Math.min((currentValue / goal.targetValue) * 100, 100);

      return {
        ...goal.toObject(),
        currentValue,
        progress: Math.round(progress)
      };
    });

    res.json({ goals: goalsWithProgress });
  } catch (error) {
    console.error('Error fetching goals:', error);
    res.status(500).json({ error: 'Error fetching goals' });
  }
};

const updateGoal = async (req, res) => {
  try {
    const { goalId } = req.params;
    const { targetValue, isActive } = req.body;

    const goal = await Goal.findOne({ _id: goalId, userId: req.userId });

    if (!goal) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    if (targetValue !== undefined) {
      goal.targetValue = targetValue;
    }

    if (isActive !== undefined) {
      goal.isActive = isActive;
    }

    await goal.save();

    res.json({
      message: 'Goal updated successfully',
      goal
    });
  } catch (error) {
    console.error('Error updating goal:', error);
    res.status(500).json({ error: 'Error updating goal' });
  }
};

// delete a goal
const deleteGoal = async (req, res) => {
  try {
    const { goalId } = req.params;

    const goal = await Goal.findOneAndDelete({ _id: goalId, userId: req.userId });

    if (!goal) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    res.json({ message: 'Goal deleted successfully' });
  } catch (error) {
    console.error('Error deleting goal:', error);
    res.status(500).json({ error: 'Error deleting goal' });
  }
};

module.exports = {
  createGoal,
  getUserGoals,
  updateGoal,
  deleteGoal
};