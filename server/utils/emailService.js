const nodemailer = require('nodemailer');
const SMTPConnection = require('nodemailer/lib/smtp-connection');

const sendPasswordResetEmail = async (email, resetToken, username) => {
    try {
        if (process.env.NODE_ENV !== 'production') {
            const resetUrl = `http://localhost:3000/reset-password/${resetToken}`;

            console.log('\n===========================================');
            console.log('PASSWORD RESET EMAIL');
            console.log('===========================================');
            console.log(`To: ${email}`);
            console.log(`Username: ${username}`);
            console.log(`Reset URL: ${resetUrl}`);
            console.log('===========================================\n');

            // Return success without actually sending email
            return { success: true, messageId: 'dev-mode' };
        }

        // Production: Use real email service
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD
            }
        });

        const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

        const mailOptions = {
            from: process.env.EMAIL_USER || 'noreply@elysium.com',
            to: email,
            subject: 'Password Reset Request - Elysium',
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body {
                            font-family: Arial, sans-serif;
                            line-height: 1.6;
                            color: #333;
                        }
                        .container {
                            max-width: 600px;
                            margin: 0 auto;
                            padding: 20px;
                        }
                        .header {
                            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                            color: white;
                            padding: 30px;
                            text-align: center;
                            border-radius: 8px 8px 0 0;
                        }
                        .content {
                            background: white;
                            padding: 30px;
                            border: 1px solid #ddd;
                            border-top: none;
                            border-radius: 0 0 8px 8px;
                        }
                        .button {
                            display: inline-block;
                            padding: 14px 28px;
                            background: #667eea;
                            color: white;
                            text-decoration: none;
                            border-radius: 8px;
                            font-weight: 600;
                            margin: 20px 0;
                        }
                        .footer {
                            text-align: center;
                            margin-top: 30px;
                            color: #666;
                            font-size: 14px;
                        }
                        .warning {
                            background: #fff3cd;
                            border: 1px solid #ffc107;
                            padding: 15px;
                            border-radius: 6px;
                            margin-top: 20px;
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>elysium</h1>
                            <p>Password Reset Request</p>
                        </div>
                        <div class="content">
                            <p>Hi ${username},</p>
                            
                            <p>We received a request to reset your password. Click the button below to create a new password:</p>
                            
                            <div style="text-align: center;">
                                <a href="${resetUrl}" class="button">Reset Password</a>
                            </div>
                            
                            <p>Or copy and paste this link into your browser:</p>
                            <p style="word-break: break-all; color: #667eea;">${resetUrl}</p>
                            
                            <div class="warning">
                                <strong>Important:</strong>
                                <ul>
                                    <li>This link will expire in 1 hour</li>
                                    <li>If you didn't request this, please ignore this email</li>
                                    <li>Your password will not change unless you click the link and set a new one</li>
                                </ul>
                            </div>
              
                            <p>If you're having trouble, reply to this email for support.</p>
                            
                            <p>Best regards,<br>The Elysium Team</p>
                        </div>
                        <div class="footer">
                            <p>This is an automated message, please do not reply directly to this email.</p>
                        </div>
                    </div>
                </body>
                </html>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Error sending email:', error);
        return { success: false, error: error.message };
    }
};

module.exports = {
    sendPasswordResetEmail
};