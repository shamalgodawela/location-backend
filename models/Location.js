const mongoose = require('mongoose');

// Define the schema for location data
const LocationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId, 
    required: true,
    ref: 'User' 
  },
  latitude: {
    type: Number,
    required: true,
  },
  longitude: {
    type: Number,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now, 
  },
});

const Location = mongoose.model('Location', LocationSchema);

module.exports = Location;
