const { sendContactEmail } = require('../utils/emailService');

// handle contact form submission
const submitContactForm = async (req, res) => {
    try {
        const { name, email, subject, message } = req.body;

        console.log('Contact form submission received');

        if (!name || !email || !subject || !message) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: 'Invalid email address' });
        }

        const result = await sendContactEmail(name, email, subject, message);

        if (!result.success) {
            return res.status(500).json({ error: 'Error sending message' });
        }

        console.log('Contact form email sent successfully');

        res.json({
            message: 'Message sent successfully! We\'ll get back to you soon.'
        });

    } catch (error) {
        console.error('Error in submitContactForm:', error);
        res.status(500).json({ error: 'Error sending message' });
    }
};

module.exports = {
    submitContactForm
};