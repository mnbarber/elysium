const mongoose = require('mongoose');

const goalSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        enum: ['books', 'pages'],
        required: true
    },
    targetValue: {
        type: Number,
        required: true,
        min: 1
    },
    timeframe: {
        type: String,
        enum: ['week', 'month', 'year', 'all-time'],
        required: true
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

goalSchema.index({ userId: 1, isActive: 1 });

module.exports = mongoose.model('Goal', goalSchema);