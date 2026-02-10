import nodemailer from 'nodemailer';
import logger from '../utils/logger.js';

// Create transporter
const createTransporter = () => {
    return nodemailer.createTransport({
        service: process.env.EMAIL_SERVICE || 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD
        }
    });
};

// Send OTP email
export const sendPasswordResetOTP = async (email, otp, userName) => {
    try {
        const transporter = createTransporter();

        const mailOptions = {
            from: process.env.EMAIL_FROM || '"MenuSphere" <noreply@menusphere.com>',
            to: email,
            subject: 'Password Reset OTP - MenuSphere',
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                        .otp-box { background: white; border: 2px dashed #667eea; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px; }
                        .otp-code { font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 8px; }
                        .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px; }
                        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>🔐 Password Reset Request</h1>
                        </div>
                        <div class="content">
                            <p>Hello <strong>${userName}</strong>,</p>
                            <p>We received a request to reset your password. Use the OTP below to proceed:</p>
                            
                            <div class="otp-box">
                                <p style="margin: 0; color: #666; font-size: 14px;">Your OTP Code</p>
                                <div class="otp-code">${otp}</div>
                                <p style="margin: 10px 0 0 0; color: #999; font-size: 12px;">Valid for 10 minutes</p>
                            </div>

                            <div class="warning">
                                <strong>⚠️ Security Notice:</strong><br>
                                • Do not share this OTP with anyone<br>
                                • This code expires in 10 minutes<br>
                                • If you didn't request this, please ignore this email
                            </div>

                            <p>If you need help, contact our support team.</p>
                            <p>Best regards,<br><strong>MenuSphere Team</strong></p>
                        </div>
                        <div class="footer">
                            <p>© ${new Date().getFullYear()} MenuSphere. All rights reserved.</p>
                            <p>This is an automated email, please do not reply.</p>
                        </div>
                    </div>
                </body>
                </html>
            `,
            text: `Hello ${userName},\n\nYour password reset OTP is: ${otp}\n\nThis code is valid for 10 minutes.\n\nIf you didn't request this, please ignore this email.\n\nBest regards,\nMenuSphere Team`
        };

        const info = await transporter.sendMail(mailOptions);
        logger.info(`Password reset email sent: ${info.messageId}`);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        logger.error(`Email sending error: ${error.message}`);

        // Development fallback: Log OTP to console if email fails
        if (process.env.NODE_ENV === 'development') {
            logger.warn('⚠️  EMAIL FAILED (Using Dev Fallback)');
            logger.warn(`📧 To: ${email}`);
            logger.warn(`🔑 OTP: ${otp}`);
            return { success: true, messageId: 'dev-fallback' };
        }

        throw new Error('Failed to send password reset email');
    }
};

// Send welcome email (optional)
export const sendWelcomeEmail = async (email, userName) => {
    try {
        const transporter = createTransporter();

        const mailOptions = {
            from: process.env.EMAIL_FROM || '"MenuSphere" <noreply@menusphere.com>',
            to: email,
            subject: 'Welcome to MenuSphere! 🎉',
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px; text-align: center; border-radius: 10px 10px 0 0; }
                        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>🎉 Welcome to MenuSphere!</h1>
                        </div>
                        <div class="content">
                            <p>Hello <strong>${userName}</strong>,</p>
                            <p>Thank you for joining MenuSphere - your all-in-one smart restaurant management platform!</p>
                            <p>You can now enjoy features like QR menu, table ordering, real-time KDS, and much more.</p>
                            <p>If you have any questions, feel free to reach out to our support team.</p>
                            <p>Best regards,<br><strong>MenuSphere Team</strong></p>
                        </div>
                    </div>
                </body>
                </html>
            `
        };

        await transporter.sendMail(mailOptions);
    } catch (error) {
        logger.error(`Welcome email error: ${error.message}`);
        // Don't throw - welcome email failure shouldn't block registration
    }
};
