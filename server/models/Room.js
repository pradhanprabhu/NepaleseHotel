// const mongoose = require('mongoose');

// const roomSchema = new mongoose.Schema({
//   name: {
//     type: String,
//     required: true
//   },
//   type: {
//     type: String,
//     required: true
//   },
//   description: {
//     type: String,
//     required: true
//   },
//   price: {
//     type: Number,
//     required: true
//   },
//   capacity: {
//     type: Number,
//     required: true,
//     min: [1, 'Room capacity must be at least 1']
//   },
//   amenities: [{
//     type: String
//   }],
//   images: [{
//     type: String
//   }],
//   availability: {
//     type: Boolean,  
//     require:true
//   }
// }, {
//   timestamps: true
// });

// const Room = mongoose.model('Room', roomSchema);

// module.exports = Room;

const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Room name is required'],
    trim: true
  },
  type: {
    type: String,
    required: [true, 'Room type is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Description is required']
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [1000, 'Room price must be at least ₹1000'],
    max:[50000 , 'Room price must not exceed ₹50000']
  },
  capacity: {
    type: Number,
    required: [true, 'Capacity is required'],
    min: [1, 'Room capacity must be at least 1'],
    max: [10, 'Room capacity must not exceed 10']
  },
  amenities: {
    type: String,
    required:[true, 'Amenities is required'],
    trim: true
  },
  images: [{
    type: String,
    required: [true, 'Images is required'],
    trim: true
  }],
  availability: {
    type: Boolean,
    required: [true, 'Availability is required'],
    default: true
  }
}, {
  timestamps: true
});

const Room = mongoose.models.Room || mongoose.model('Room', roomSchema);

module.exports = Room;
