import nodemailer from 'nodemailer';

// Send contact sales email
export const sendContactEmail = async (req, res) => {
    try {
        const { name, email, restaurantName, phone, message } = req.body;

        // Validation
        if (!name || !email || !message) {
            return res.status(400).json({
                success: false,
                error: 'Name, email, and message are required fields'
            });
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid email address'
            });
        }

        // Message length validation
        if (message.length < 10) {
            return res.status(400).json({
                success: false,
                error: 'Message must be at least 10 characters long'
            });
        }

        // Create transporter
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD
            }
        });

        // Email content
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: 'chefosteam@gmail.com',
            replyTo: email,
            subject: `🔔 New Contact Sales Inquiry from ${name}`,
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
                        .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
                        .field { margin-bottom: 15px; }
                        .label { font-weight: bold; color: #555; }
                        .value { margin-top: 5px; }
                        .message-box { background: white; padding: 15px; border-left: 4px solid #fbbf24; margin-top: 10px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h2 style="margin: 0;">📧 New Contact Sales Inquiry</h2>
                        </div>
                        <div class="content">
                            <div class="field">
                                <div class="label">👤 Name:</div>
                                <div class="value">${name}</div>
                            </div>
                            <div class="field">
                                <div class="label">📧 Email:</div>
                                <div class="value"><a href="mailto:${email}">${email}</a></div>
                            </div>
                            ${restaurantName ? `
                            <div class="field">
                                <div class="label">🏪 Restaurant Name:</div>
                                <div class="value">${restaurantName}</div>
                            </div>
                            ` : ''}
                            ${phone ? `
                            <div class="field">
                                <div class="label">📱 Phone:</div>
                                <div class="value">${phone}</div>
                            </div>
                            ` : ''}
                            <div class="field">
                                <div class="label">💬 Message:</div>
                                <div class="message-box">${message.replace(/\n/g, '<br>')}</div>
                            </div>
                            <hr style="margin: 20px 0; border: none; border-top: 1px solid #ddd;">
                            <p style="color: #666; font-size: 12px;">
                                This inquiry was submitted from the ChefOS landing page contact form.
                            </p>
                        </div>
                    </div>
                </body>
                </html>
            `
        };

        // Send email
        await transporter.sendMail(mailOptions);

        res.status(200).json({
            success: true,
            message: 'Your inquiry has been sent successfully! We\'ll get back to you soon.'
        });

    } catch (error) {
        console.error('------- CONTACT EMAIL ERROR DETAILS -------');
        console.error('Error Code:', error.code);
        console.error('Error Message:', error.message);
        console.error('Response:', error.response);
        console.error('Stack:', error.stack);
        console.error('EMAIL_USER Env Var:', process.env.EMAIL_USER ? 'Set' : 'Missing');
        console.error('EMAIL_PASSWORD Env Var:', process.env.EMAIL_PASSWORD ? 'Set' : 'Missing');
        console.error('-------------------------------------------');

        res.status(500).json({
            success: false,
            error: 'Failed to send your inquiry. Please try again later.'
        });
    }
};
