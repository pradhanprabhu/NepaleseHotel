const mongoose = require('mongoose');

const placeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Place name is required'],
    trim: true,
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
  },
  location: {
    type: String,
    required: [true, 'Location is required'],
    trim: true,
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true,
  },
  distance: {
    type: Number,
    required: [true, 'Distance is required'],
    min: [0, 'Distance must be a positive number'],
  },
  bestTime: {
    type: String,
    required: [true, 'Best time is required'],
    trim: true,
  },
  images: [
    {
      type: String,
      trim: true,
    },
  ],
});

const Place = mongoose.model('Place', placeSchema);

module.exports = Place;
