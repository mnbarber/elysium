const mongoose = require('mongoose');
const Quote = require('../models/quote');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI)
    .then(async () => {
        console.log('Connected to MongoDB');

        const existing = await Quote.findOne({
            text: "One must always be careful of books, and what is inside them, for words have the power to change us."
        });

        if (!existing) {
            const quote = new Quote({
                text: "One must always be careful of books, and what is inside them, for words have the power to change us.",
                author: "Cassandra Clare",
                bookTitle: "Clockwork Angel",
                submittedBy: '694ae11e126fc259f3adc29b', // Replace with your actual user ID
                status: 'approved'
            });

            await quote.save();
            console.log('Initial quote created!');
        } else {
            console.log('Quote already exists');
        }

        process.exit();
    })
    .catch(err => {
        console.error('Error:', err);
        process.exit(1);
    });