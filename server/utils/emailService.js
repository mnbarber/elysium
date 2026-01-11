const sgMail = require('@sendgrid/mail');

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

            return { success: true, messageId: 'dev-mode' };
        }

        sgMail.setApiKey(process.env.SENDGRID_API_KEY);

        const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

        const msg = {
            from: process.env.SENDGRID_FROM_EMAIL || 'noreply@elysium.com',
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
                            
                            <div style="text-align: center; margin: 30px 0;">
                                <a href="${resetUrl}" style="display: inline-block; padding: 14px 28px; background: #667eea; color: white !important; text-decoration: none; border-radius: 8px; font-weight: 600;">Reset Password</a>
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

        const response = await sgMail.send(msg);
        console.log('Email sent successfully:', response[0].statusCode);
        return { success: true, messageId: response[0].headers['x-message-id'] };
    } catch (error) {
        console.error('Error sending email:', error);
        return { success: false, error: error.message };
    }
};

const sendContactEmail = async (name, email, subject, message) => {
    try {
        // in development, just log to console
        if (process.env.NODE_ENV !== 'production') {
            console.log('\n===========================================');
            console.log('📧 CONTACT FORM SUBMISSION');
            console.log('===========================================');
            console.log(`From: ${name} (${email})`);
            console.log(`Subject: ${subject}`);
            console.log(`Message: ${message}`);
            console.log('===========================================\n');

            return { success: true, messageId: 'dev-mode' };
        }

        sgMail.setApiKey(process.env.SENDGRID_API_KEY);

        const msg = {
            to: process.env.CONTACT_EMAIL || 'elysiumbookshelp@gmail.com',
            from: process.env.SENDGRID_FROM_EMAIL,
            replyTo: email,
            subject: `Contact Form: ${subject}`,
            html: `
        <!DOCTYPE html>
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0;">Elysium Contact Form</h1>
              <p style="margin: 10px 0 0 0;">New message received</p>
            </div>
            <div style="background: white; padding: 30px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 8px 8px;">
              <div style="margin-bottom: 20px;">
                <strong style="color: #667eea;">From:</strong>
                <p style="margin: 5px 0;">${name}</p>
              </div>

              <div style="margin-bottom: 20px;">
                <strong style="color: #667eea;">Email:</strong>
                <p style="margin: 5px 0;">${email}</p>
              </div>

              <div style="margin-bottom: 20px;">
                <strong style="color: #667eea;">Subject:</strong>
                <p style="margin: 5px 0;">${subject}</p>
              </div>

              <div style="margin-bottom: 20px;">
                <strong style="color: #667eea;">Message:</strong>
                <div style="margin: 10px 0; padding: 15px; background: #f8f9fa; border-radius: 6px; white-space: pre-wrap;">${message}</div>
              </div>

              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 14px;">
                <p>You can reply directly to this email to respond to ${name}.</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `
        };

        const response = await sgMail.send(msg);
        console.log('Contact email sent successfully:', response[0].statusCode);
        return { success: true, messageId: response[0].headers['x-message-id'] };

    } catch (error) {
        console.error('Error sending contact email:', error);
        if (error.response) {
            console.error('SendGrid error body:', error.response.body);
        }
        return { success: false, error: error.message };
    }
};

module.exports = {
    sendPasswordResetEmail,
    sendContactEmail
};