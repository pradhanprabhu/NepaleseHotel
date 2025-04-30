const express = require('express');
const router = express.Router();
const { auth, admin } = require('../middleware/authMiddleware');
const Room = require('../models/Room');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const { sendBookingConfirmation } = require('../config/emailConfig');

// Get all bookings for current user
router.get('/', auth, async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user._id })
      .populate('room', 'name price')
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all bookings (admin only)
router.get('/admin', auth, admin, async (req, res) => {
  try {
    console.log('Fetching admin bookings...');
    const bookings = await Booking.find()
      .populate('room', 'name')
      .populate('user', 'name')
      .sort({ createdAt: -1 });
    console.log('Admin bookings:', bookings);
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create a new booking
router.post('/', auth, async (req, res) => {
  try {
    const {
      room,
      checkIn,
      checkOut,
      totalAmount,
      totalDays,
      guests,
      paymentMethod,
      paymentDetails
    } = req.body;

    // Validate required fields
    if (!room || !checkIn || !checkOut || !totalAmount || !totalDays || !guests || !paymentMethod) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Create new booking
    const booking = new Booking({
      room,
      user: req.user._id,
      checkIn,
      checkOut,
      totalAmount,
      totalDays,
      guests,
      paymentMethod,
      paymentDetails,
      status: 'pending' // Always set initial status as pending
    });

    await booking.save();

    // Create payment record for all payment methods
      const payment = new Payment({
        booking: booking._id,
        user: req.user._id,
        amount: totalAmount,
      paymentMethod,
      status: paymentMethod === 'cash' ? 'pending' : 'completed',
      paymentDetails: paymentDetails || {}
      });

      await payment.save();

      // Update booking with payment reference
      booking.paymentId = payment._id;
      await booking.save();

    // Send booking confirmation email for all payment methods and statuses
    try {
      console.log('Attempting to send booking confirmation email for booking:', {
        bookingId: booking._id,
        userId: req.user._id,
        paymentMethod: booking.paymentMethod,
        paymentStatus: payment.status
      });
      await sendBookingConfirmation(req.user, booking);
      console.log('Booking confirmation email sent successfully');
    } catch (emailError) {
      console.error('Error sending booking confirmation email:', emailError);
      // Don't fail the booking if email fails
    }

    res.status(201).json(booking);
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({ message: 'Error creating booking' });
  }
});

// Get booking by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('room', 'name price')
      .populate('user', 'name email');
      
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Only allow admin or booking owner to view
    if (!req.user.isAdmin && booking.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Ensure user can only access their own bookings
    if (booking.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to view this booking' });
    }
    
    res.json(booking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update booking
router.put('/:id', auth, admin, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check if user is admin
    if (req.user.isAdmin) {
      // Admin can update check-in, check-out, guests, and status
      const { checkIn, checkOut, guests, status } = req.body;
      
      // Validate status if provided
      if (status && !['pending', 'confirmed'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status value' });
      }

      // Update fields if provided
      if (checkIn) booking.checkIn = checkIn;
      if (checkOut) booking.checkOut = checkOut;
      if (guests) booking.guests = Number(guests);
      if (status) {
        booking.status = status;
        
        // Update associated payment status if it exists
        if (booking.paymentId) {
          const payment = await Payment.findById(booking.paymentId);
          if (payment) {
            payment.status = status === 'confirmed' ? 'completed' : 'pending';
            await payment.save();
          }
        }
      }
    } else {
      // Regular users can only update status of their own bookings
      if (booking.user.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Not authorized to update this booking' });
      }
      const { status } = req.body;
      booking.status = status;
    }

    const updatedBooking = await booking.save();
    res.json(updatedBooking);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete booking
router.delete('/:id', auth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    // Allow admin to delete any booking, users can only delete their own
    if (!req.user.isAdmin && booking.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this booking' });
    }
    
    await booking.deleteOne();
    res.json({ message: 'Booking deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
