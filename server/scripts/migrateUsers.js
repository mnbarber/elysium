const mongoose = require('mongoose');
const User = require('../models/user');
require('dotenv').config();

const migrateUsers = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/elysium');
        console.log('Connected to MongoDB');

        const result = await User.updateMany(
            { isPublic: { $exists: false } },
            { $set: { isPublic: true } }
        );

        console.log(`Migration complete! Updated ${result.modifiedCount} users.`);

        await mongoose.connection.close();
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
};

migrateUsers();