const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import models first to ensure they are registered
require('./models/Booking');
require('./models/Payment');
require('./models/Room');
require('./models/User');

// Import routes after models
const userRoute = require('./routes/usersRoute');
const roomRoute = require('./routes/roomRoute');
const bookingRoute = require('./routes/bookingsRoute');
const placeRoute = require('./routes/placeRoute');
const paymentsRoute = require('./routes/paymentsRoute');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    // Verify models are registered
    console.log('Registered models:', Object.keys(mongoose.models));
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Routes
app.use('/api/users', userRoute);
app.use('/api/rooms', roomRoute);
app.use('/api/bookings', bookingRoute);
app.use('/api/places', placeRoute);
app.use('/api/payments', paymentsRoute);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 