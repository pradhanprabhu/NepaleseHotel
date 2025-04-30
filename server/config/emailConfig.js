const nodemailer = require('nodemailer');
require('dotenv').config();

// Debug environment variables
console.log('Email Configuration:', {
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
  secure: false,
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

const sendBookingConfirmation = async (user, booking) => {
  try {
    console.log('Attempting to send booking confirmation email:', {
      to: user.email,
      bookingId: booking._id,
      paymentMethod: booking.paymentMethod
    });
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: 'Booking Confirmation - Nepalese Hotel',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2c3e50;">Booking Confirmation</h2>
          <p>Dear ${user.name},</p>
          <p>Your booking has been confirmed. Here are the details:</p>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3 style="color: #2c3e50; margin-top: 0;">Booking Details</h3>
            <p><strong>Booking ID:</strong> ${booking._id}</p>
            <p><strong>Check-in Date:</strong> ${new Date(booking.checkIn).toLocaleDateString()}</p>
            <p><strong>Check-out Date:</strong> ${new Date(booking.checkOut).toLocaleDateString()}</p>
            <p><strong>Total Days:</strong> ${booking.totalDays}</p>
            <p><strong>Number of Guests:</strong> ${booking.guests}</p>
            <p><strong>Total Amount:</strong> ₹${booking.totalAmount}</p>
            <p><strong>Payment Method:</strong> ${booking.paymentMethod.toUpperCase()}</p>
            <p><strong>Payment Status:</strong> <span style="color: ${booking.paymentMethod === 'cash' ? '#ffc107' : '#28a745'}">${booking.paymentMethod === 'cash' ? 'PENDING' : 'PAID'}</span></p>
          </div>

          ${booking.paymentMethod === 'cash' ? `
          <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="color: #856404; margin: 0;">
              <strong>Note:</strong> This is a cash payment booking. Please bring the payment amount when you arrive at the hotel.
            </p>
          </div>
          ` : ''}

          <p>Thank you for choosing Nepalese Hotel. We look forward to serving you!</p>
          
          <p>Best regards,<br>Nepalese Hotel Team</p>
        </div>
      `
    };

    console.log('Sending email with options:', {
      from: mailOptions.from,
      to: mailOptions.to,
      subject: mailOptions.subject
    });

    const info = await transporter.sendMail(mailOptions);
    console.log('Booking confirmation email sent successfully:', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending booking confirmation email:', error);
    throw error;
  }
};

module.exports = {
  sendBookingConfirmation
}; 