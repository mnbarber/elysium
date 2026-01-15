const mongoose = require('mongoose');
const Activity = require('../models/activity');
require('dotenv').config();

const migrateActivities = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/elysium');
        console.log('Connected to MongoDB');

        const result = await Activity.updateMany(
            { isPublic: { $exists: false } },
            { $set: { isPublic: true } }
        );

        console.log(`Migration complete! Updated ${result.modifiedCount} activities.`);

        await mongoose.connection.close();
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
};

migrateActivities();