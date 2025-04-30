const express = require('express');
const router = express.Router();
const Room = require('../models/Room');
const { auth, admin } = require('../middleware/authMiddleware');
const Booking = require('../models/Booking');

// Get all rooms
router.get('/', async (req, res) => {
  try {
    const rooms = await Room.find({});
    res.json(rooms);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single room
router.get('/:id', async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }
    res.json(room);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin routes
// Create new room (Admin only)
router.post('/', async (req, res) => {
  try {
    const room = new Room({
      name: req.body.name,
      type:req.body.type,
      description: req.body.description,
      price: req.body.price,
      capacity: req.body.capacity,
      amenities: req.body.amenities,
      images: req.body.images,
      availability: req.body.availability
    });

    const newRoom = await room.save();
    res.status(201).json(newRoom);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update room (Admin only)
// PUT /api/rooms/:id — Update a room
router.put('/:id', async (req, res) => {
  try {
    const roomId = req.params.id;
    const updates = req.body;
   console.log(updates)
    const updatedRoom = await Room.findByIdAndUpdate(roomId, updates, {
      new: true, // return the updated document
      runValidators: true, // validate before update
    });

    if (!updatedRoom) {
      return res.status(404).json({ message: 'Room not found' });
    }

    res.json(updatedRoom);
  } catch (error) {
    console.error('Error updating room:', error);
    res.status(500).json({ message: 'Server error' });
  }
});
;


// Delete room (Admin only)
router.delete('/:id', auth, admin, async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    await room.deleteOne();
    res.json({ message: 'Room deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Check room availability for a specific date
router.get('/:id/availability', async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) {
      return res.status(400).json({ message: 'Date parameter is required' });
    }

    const room = await Room.findById(req.params.id);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    // Check if there are any bookings for this room on the given date
    const booking = await Booking.findOne({
      room: req.params.id,
      checkIn: { $lte: date },
      checkOut: { $gt: date },
      status: 'confirmed'
    });

    res.json({
      available: !booking,
      message: booking ? 'Room is booked for this date' : 'Room is available'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 