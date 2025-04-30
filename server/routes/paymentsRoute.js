const express = require('express');
const router = express.Router();
const { auth, admin } = require('../middleware/authMiddleware');
const Payment = require('../models/Payment');
const EsewaTransaction = require('../models/EsewaTransaction');
const Booking = require('../models/Booking');
const mongoose = require('mongoose');
const { sendBookingConfirmation } = require('../config/emailConfig');

// Get all payments (admin only)
router.get('/admin', auth, admin, async (req, res) => {
  try {
    console.log('Fetching admin payments...');
    
    // Check if Payment model is properly registered
    if (!mongoose.models.Payment) {
      throw new Error('Payment model is not registered');
    }

    const payments = await Payment.find()
      .populate({
        path: 'user',
        select: 'name email',
        model: 'User'
      })
      .populate({
        path: 'booking',
        select: 'room checkIn checkOut',
        model: 'Booking'
      })
      .sort({ createdAt: -1 });
    
    console.log('Payments found:', payments.length);
    res.json(payments);
  } catch (error) {
    console.error('Error in /admin route:', error);
    res.status(500).json({ 
      message: 'Failed to fetch payment details',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Update payment status (admin only)
router.put('/:id/status', auth, admin, async (req, res) => {
  try {
    const { status } = req.body;
    console.log('Updating payment status:', { id: req.params.id, status });
    
    const payment = await Payment.findById(req.params.id)
      .populate('user')
      .populate('booking');

    if (!payment) {
      console.log('Payment not found:', req.params.id);
      return res.status(404).json({ message: 'Payment not found' });
    }

    // Allow status changes for all payment types when admin is making the change
    payment.status = status;
    await payment.save();
    console.log('Payment status updated successfully');

    // Update associated booking status
    const booking = await Booking.findOne({ paymentId: payment._id });
    if (booking) {
      booking.status = status === 'completed' ? 'confirmed' : 'pending';
      await booking.save();
      console.log('Booking status updated successfully');

      // Send booking confirmation email for completed payments
      if (status === 'completed') {
        try {
          await sendBookingConfirmation(payment.user, booking);
          console.log('Booking confirmation email sent successfully');
        } catch (emailError) {
          console.error('Error sending booking confirmation email:', emailError);
          // Don't throw error here, just log it
        }
      }
    }

    res.json(payment);
  } catch (error) {
    console.error('Error updating payment status:', error);
    res.status(500).json({ 
      message: 'Failed to update payment status',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Create a new payment
router.post('/', auth, async (req, res) => {
  try {
    console.log('Received payment request:', {
      body: req.body,
      user: req.user._id
    });

    const { 
      bookingId, 
      amount, 
      paymentMethod, 
      status, 
      paymentDetails,
      // Booking details for direct payment
      room,
      checkIn,
      checkOut,
      totalAmount,
      totalDays,
      guests
    } = req.body;

    let booking;

    // If bookingId is not provided, create a new booking
    if (!bookingId) {
      console.log('Creating new booking with details:', {
        room,
        checkIn,
        checkOut,
        totalAmount,
        totalDays,
        guests,
        paymentMethod
      });

      if (!room || !checkIn || !checkOut || !totalAmount || !totalDays || !guests) {
        console.error('Missing booking details:', {
          room: !!room,
          checkIn: !!checkIn,
          checkOut: !!checkOut,
          totalAmount: !!totalAmount,
          totalDays: !!totalDays,
          guests: !!guests
        });
        return res.status(400).json({ 
          message: 'Missing booking details',
          details: 'Room, check-in, check-out, amount, days, and guests are required'
        });
      }

      try {
        booking = new Booking({
          room,
          user: req.user._id,
          checkIn,
          checkOut,
          totalAmount,
          totalDays,
          guests,
          paymentMethod,
          status: paymentMethod === 'cash' ? 'pending' : 'confirmed'
        });

        await booking.save();
        console.log('Booking created successfully:', booking._id);
      } catch (bookingError) {
        console.error('Error creating booking:', bookingError);
        throw new Error(`Failed to create booking: ${bookingError.message}`);
      }
    } else {
      try {
        booking = await Booking.findById(bookingId);
        if (!booking) {
          console.error('Booking not found:', bookingId);
          return res.status(404).json({ message: 'Booking not found' });
        }
        console.log('Found existing booking:', booking._id);
      } catch (findError) {
        console.error('Error finding booking:', findError);
        throw new Error(`Failed to find booking: ${findError.message}`);
      }
    }

    // Create payment record
    try {
      console.log('Creating payment record:', {
        booking: booking._id,
        amount: amount || totalAmount,
        paymentMethod,
        status
      });

      const payment = new Payment({
        booking: booking._id,
        user: req.user._id,
        amount: amount || totalAmount,
        paymentMethod,
        status: paymentMethod === 'cash' ? 'pending' : 'completed',
        paymentDetails: paymentMethod === 'cash' ? {} : paymentDetails
      });

      const savedPayment = await payment.save();
      console.log('Payment created successfully:', savedPayment._id);

      // Update booking with payment reference
      booking.paymentId = savedPayment._id;
      await booking.save();
      console.log('Booking updated with payment reference');

      res.status(201).json({
        payment: savedPayment,
        booking: booking
      });
    } catch (paymentError) {
      console.error('Error creating payment:', paymentError);
      throw new Error(`Failed to create payment: ${paymentError.message}`);
    }
  } catch (error) {
    console.error('Payment creation error:', {
      message: error.message,
      stack: error.stack,
      details: error
    });
    res.status(500).json({ 
      message: 'Failed to process payment',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Get payment details
router.get('/:id', auth, async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('booking')
      .populate('user', '-password');

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    // Check if user owns this payment
    if (payment.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to view this payment' });
    }

    res.json(payment);
  } catch (error) {
    console.error('Payment fetch error:', error);
    res.status(500).json({ message: 'Failed to fetch payment details' });
  }
});

// Get user's payments
router.get('/user/payments', auth, async (req, res) => {
  try {
    const payments = await Payment.find({ user: req.user._id })
      .populate('booking')
      .sort({ createdAt: -1 });

    res.json(payments);
  } catch (error) {
    console.error('Payments fetch error:', error);
    res.status(500).json({ message: 'Failed to fetch payments' });
  }
});

// Cancel booking
router.put('/:id/cancel', auth, async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('booking')
      .populate('user');

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    // Check if user owns this payment
    if (payment.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to cancel this booking' });
    }

    // Update payment status to failed
    payment.status = 'failed';
    await payment.save();

    // Update booking status to cancelled
    if (payment.booking) {
      payment.booking.status = 'cancelled';
      await payment.booking.save();
    }

    res.json({ 
      message: 'Booking cancelled successfully',
      payment,
      booking: payment.booking
    });
  } catch (error) {
    console.error('Error cancelling booking:', error);
    res.status(500).json({ 
      message: 'Failed to cancel booking',
      error: error.message
    });
  }
});

// Delete payment (admin only)
router.delete('/:id', auth, admin, async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('booking');

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    // Delete the payment
    await payment.deleteOne();

    // If there's an associated booking, update its status
    if (payment.booking) {
      payment.booking.status = 'cancelled';
      await payment.booking.save();
    }

    res.json({ message: 'Payment deleted successfully' });
  } catch (error) {
    console.error('Error deleting payment:', error);
    res.status(500).json({ 
      message: 'Failed to delete payment',
      error: error.message
    });
  }
});

// Esewa Transaction Routes

// Create Esewa transaction
router.post('/esewa', auth, async (req, res) => {
  try {
    const { bookingId, amount, transactionId, paymentDetails } = req.body;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    const esewaTransaction = new EsewaTransaction({
      user: req.user._id,
      booking: bookingId,
      amount,
      transactionId,
      paymentDetails,
      status: 'pending'
    });

    const savedTransaction = await esewaTransaction.save();

    // Update booking with payment reference
    booking.paymentId = savedTransaction._id;
    await booking.save();

    res.status(201).json({
      transaction: savedTransaction,
      booking: booking
    });
  } catch (error) {
    console.error('Esewa transaction creation error:', error);
    res.status(500).json({ 
      message: 'Failed to process Esewa transaction',
      error: error.message
    });
  }
});

// Update Esewa transaction status
router.put('/esewa/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body;
    const transaction = await EsewaTransaction.findById(req.params.id)
      .populate('user')
      .populate('booking');

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    // Check if user owns this transaction
    if (transaction.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this transaction' });
    }

    transaction.status = status;
    await transaction.save();

    // Update associated booking status
    const booking = await Booking.findOne({ paymentId: transaction._id });
    if (booking) {
      booking.status = status === 'completed' ? 'confirmed' : 'pending';
      await booking.save();

      // Send booking confirmation email for completed transactions
      if (status === 'completed') {
        try {
          await sendBookingConfirmation(transaction.user, booking);
        } catch (emailError) {
          console.error('Error sending booking confirmation email:', emailError);
        }
      }
    }

    res.json(transaction);
  } catch (error) {
    console.error('Error updating Esewa transaction status:', error);
    res.status(500).json({ 
      message: 'Failed to update transaction status',
      error: error.message
    });
  }
});

// Get Esewa transaction details
router.get('/esewa/:id', auth, async (req, res) => {
  try {
    const transaction = await EsewaTransaction.findById(req.params.id)
      .populate('booking')
      .populate('user', '-password');

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    // Check if user owns this transaction
    if (transaction.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to view this transaction' });
    }

    res.json(transaction);
  } catch (error) {
    console.error('Error fetching Esewa transaction:', error);
    res.status(500).json({ message: 'Failed to fetch transaction details' });
  }
});

// Get user's Esewa transactions
router.get('/esewa/user/transactions', auth, async (req, res) => {
  try {
    const transactions = await EsewaTransaction.find({ user: req.user._id })
      .populate('booking')
      .sort({ createdAt: -1 });

    res.json(transactions);
  } catch (error) {
    console.error('Error fetching user Esewa transactions:', error);
    res.status(500).json({ message: 'Failed to fetch transactions' });
  }
});

// Get all Esewa transactions (admin only)
router.get('/esewa/admin/transactions', auth, admin, async (req, res) => {
  try {
    const transactions = await EsewaTransaction.find()
      .populate('user', 'name email')
      .populate('booking')
      .sort({ createdAt: -1 });

    res.json(transactions);
  } catch (error) {
    console.error('Error fetching admin Esewa transactions:', error);
    res.status(500).json({ message: 'Failed to fetch transactions' });
  }
});

module.exports = router;
