const express = require('express');
const router = express.Router();
const Place = require('../models/placeModel');
const { auth, admin } = require('../middleware/authMiddleware');

// Get all places
router.get('/', async (req, res) => {
  try {
    let places = await Place.find();
    console.log('Places data:', places);

    // If no places exist, create sample places
    if (!places || places.length === 0) {
      const samplePlaces = [
        {
          name: 'Pashupatinath Temple',
          description: 'One of the most sacred Hindu temples of Nepal dedicated to Lord Shiva. Located on the banks of the Bagmati River, it is the largest temple complex in Nepal.',
          location: 'Kathmandu',
          category: 'Religious',
          distance: 5,
          bestTime: 'October to March',
          images: [
            'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Pashupatinath_Temple.jpg/1200px-Pashupatinath_Temple.jpg',
            'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Pashupatinath_Temple-2.jpg/800px-Pashupatinath_Temple-2.jpg'
          ]
        },
        {
          name: 'Boudhanath Stupa',
          description: 'The largest stupa in Nepal and the holiest Tibetan Buddhist temple outside Tibet. It is the center of Tibetan Buddhism in Nepal.',
          location: 'Kathmandu',
          category: 'Religious',
          distance: 7,
          bestTime: 'September to November',
          images: [
            'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Boudhanath_Stupa.jpg/1200px-Boudhanath_Stupa.jpg',
            'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Boudhanath_Stupa-2.jpg/800px-Boudhanath_Stupa-2.jpg'
          ]
        }
      ];

      places = await Place.insertMany(samplePlaces);
      console.log('Created sample places:', places);
    }

    res.json(places);
  } catch (error) {
    console.error('Error fetching places:', error);
    res.status(500).json({ message: 'Error fetching places' });
  }
});

// Get a single place by ID
router.get('/:id', async (req, res) => {
  try {
    const place = await Place.findById(req.params.id);
    if (place) {
      res.json(place);
    } else {
      res.status(404).json({ message: 'Place not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error fetching place' });
  }
});

// Create a new place
router.post('/', async (req, res) => {
  const { name, description, location, category, distance, bestTime, images } = req.body;
  const place = new Place({
    name,
    description,
    location,
    category,
    distance,
    bestTime,
    images,
  });

  try {
    const createdPlace = await place.save();
    res.status(201).json(createdPlace);
  } catch (error) {
    res.status(400).json({ message: 'Error creating place' });
  }
});

// Update a place
router.put('/:id', async (req, res) => {
  try {
    const place = await Place.findById(req.params.id);
    if (place) {
      place.name = req.body.name || place.name;
      place.description = req.body.description || place.description;
      place.location = req.body.location || place.location;
      place.category = req.body.category || place.category;
      place.distance = req.body.distance || place.distance;
      place.bestTime = req.body.bestTime || place.bestTime;
      place.images = req.body.images || place.images;

      const updatedPlace = await place.save();
      res.json(updatedPlace);
    } else {
      res.status(404).json({ message: 'Place not found' });
    }
  } catch (error) {
    res.status(400).json({ message: 'Error updating place' });
  }
});


// Delete a place
router.delete('/:id', auth, admin, async (req, res) => {
  try {
    const place = await Place.findById(req.params.id);
    if (place) {
      await Place.findByIdAndDelete(req.params.id); // Using findByIdAndDelete instead of remove()
      res.json({ message: 'Place removed' });
    } else {
      res.status(404).json({ message: 'Place not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error deleting place' });
  }
});

module.exports = router; 