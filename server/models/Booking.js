const mongoose = require('mongoose');

// Delete the model if it exists
if (mongoose.models.Booking) {
  delete mongoose.models.Booking;
}

const bookingSchema = new mongoose.Schema({
  room: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  checkIn: {
    type: Date,
    required: true
  },
  checkOut: {
    type: Date,
    required: true
  },
  totalAmount: {
    type: Number,
    required: true
  },
  totalDays: {
    type: Number,
    required: true
  },
  guests: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'esewa', 'khalti', 'mastercard'],
    required: true
  },
  paymentDetails: {
    phoneNumber: String,
    transactionId: String,
    // Mastercard specific fields
    cardNumber: String, // Last 4 digits only
    cardHolder: String,
    expiryDate: String
  },
  paymentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment'
  }
}, {
  timestamps: true
});

// Create the model
const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;
