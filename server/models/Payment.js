const mongoose = require('mongoose');

// Delete the model if it exists
if (mongoose.models.Payment) {
  delete mongoose.models.Payment;
}

const paymentSchema = new mongoose.Schema({
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  paymentMethod: {
    type: String,
    enum: ['esewa', 'khalti', 'cash', 'mastercard'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending'
  },
  paymentDetails: {
    transactionId: String,
    phoneNumber: String,
    // Mastercard specific fields
    cardNumber: String, // Last 4 digits only
    cardHolder: String,
    expiryDate: String
  }
}, {
  timestamps: true
});

// Add a pre-save middleware to ensure cash payments are always pending
paymentSchema.pre('save', function(next) {
  if (this.paymentMethod === 'cash') {
    this.status = 'pending';
  }
  next();
});

// Create the model
const Payment = mongoose.model('Payment', paymentSchema);

module.exports = Payment;
