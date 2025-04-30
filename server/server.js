import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Routes imports
import roomsRoute from './routes/roomsRoute.js';
import usersRoute from './routes/usersRoute.js';
import bookingsRoute from './routes/bookingsRoute.js';
import paymentsRoute from './routes/paymentsRoute.js';
import placesRoute from './routes/placesRoute.js';
import contactRoute from './routes/contactRoute.js';
import { EsewaInitiatePayment, paymentStatus } from './controllers/esewa.controller.js';

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
console.log('Attempting to connect to MongoDB...');
console.log('Connection string:', process.env.MONGODB_URI);

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log('Successfully connected to MongoDB');
  // Verify the database name
  console.log('Database name:', mongoose.connection.db.databaseName);
})
.catch(err => {
  console.error('Could not connect to MongoDB:', err);
  process.exit(1);
});

// Routes
app.use('/api/rooms', roomsRoute);
app.use('/api/users', usersRoute);
app.use('/api/bookings', bookingsRoute);
app.use('/api/payments', paymentsRoute);
app.use('/api/places', placesRoute);
app.use('/api/contact', contactRoute);

// eSewa Payment Routes
app.post('/api/esewa/initiate', EsewaInitiatePayment);
app.post('/api/esewa/status', paymentStatus);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err : undefined
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
}); 