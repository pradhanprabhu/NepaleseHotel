const nodemailer = require('nodemailer');
require('dotenv').config();

// Debug environment variables
console.log('Environment Variables:', {
  EMAIL_USER: process.env.EMAIL_USER,
  EMAIL_PASSWORD: process.env.EMAIL_PASSWORD ? 'Password is set' : 'Password is missing',
  NODE_ENV: process.env.NODE_ENV
});

if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
  console.error('Missing email configuration. Please check your .env file.');
  throw new Error('Missing email configuration');
}

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  },
  tls: {
    rejectUnauthorized: false
  }
});

// Verify transporter configuration
transporter.verify(function(error, success) {
  if (error) {
    console.error('SMTP Configuration Error:', error);
  } else {
    console.log('SMTP Server is ready to take our messages');
  }
});

const sendVerificationEmail = async (email, code) => {
  try {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Nepalese Hotel - Verify Your Email Address',
    html: `
      <p>Namaste!</p>
      <p>Thank you for choosing Nepalese Hotel.</p>
      <p>To complete your registration, please verify your email address using the code below:</p>
      <p style="font-size: 24px; font-weight: bold; text-align: center; margin: 20px 0;">${code}</p>
      <p>We look forward to welcoming you!</p>
      <p>Warm regards,<br>Nepalese Hotel Team</p>
    `
  };

    console.log('Sending verification email to:', email);
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending verification email:', error);
    throw error;
  }
};

const sendPasswordResetEmail = async (email, code) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Nepalese Hotel - Password Reset Verification',
    html: `
      <p>Namaste!</p>
      <p>You have requested to reset your password for Nepalese Hotel.</p>
      <p>Please use the following verification code to reset your password:</p>
      <p style="font-size: 24px; font-weight: bold; text-align: center; margin: 20px 0;">${code}</p>
      <p>This code will expire in 1 hour.</p>
      <p>If you did not request this password reset, please ignore this email.</p>
      <p>Warm regards,<br>Nepalese Hotel Team</p>
    `
  };

  await transporter.sendMail(mailOptions);
};

module.exports = { sendVerificationEmail, sendPasswordResetEmail };
