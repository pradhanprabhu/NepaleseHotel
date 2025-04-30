const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');

// Debug environment variables
console.log('Email Configuration:', {
  EMAIL_USER: process.env.EMAIL_USER,
  EMAIL_PASSWORD: process.env.EMAIL_PASSWORD ? 'Password is set' : 'Password is missing',
  NODE_ENV: process.env.NODE_ENV
});

// Configure transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

router.post('/send', async (req, res) => {
  const { name, email, subject, message } = req.body;
  
  if (!name || !email || !subject || !message) {
    return res.status(400).json({ 
      success: false, 
      message: 'All fields are required' 
    });
  }

  // Check if email configuration is set up
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    console.error('Email configuration missing');
    return res.status(500).json({ 
      success: false, 
      message: 'Email service is not configured. Please contact the administrator.' 
    });
  }

  try {
    // Verify email configuration
    await transporter.verify();

    const mailOptions = {
      from: `"${name}" <${email}>`, // Send from user's email with their name
      to: process.env.EMAIL_USER, // Send to admin's email
      replyTo: email, // Allow admin to reply directly to user
      subject: `New Contact Message: ${subject}`,
      html: `
        <h3>New Contact Message</h3>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <p><strong>Message:</strong> ${message}</p>
      `
    };

    await transporter.sendMail(mailOptions);
    
    res.status(200).json({ 
      success: true, 
      message: 'Message sent successfully' 
    });
  } catch (error) {
    console.error('Email sending error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to send message. Please try again later.' 
    });
  }
});

module.exports = router;