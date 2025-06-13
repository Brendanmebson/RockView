const mongoose = require('mongoose');
const District = require('../models/District');
require('dotenv').config();

const quickSeed = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Check if districts exist
    const existingDistricts = await District.countDocuments();
    console.log(`Found ${existingDistricts} districts`);
    
    if (existingDistricts === 0) {
      // Create basic districts
      const districts = [
        { name: 'Festac District', districtNumber: 1, pastorName: 'Unassigned' },
        { name: 'Ikeja District', districtNumber: 2, pastorName: 'Unassigned' },
        { name: 'Lekki District', districtNumber: 3, pastorName: 'Unassigned' },
        { name: 'Surulere District', districtNumber: 4, pastorName: 'Unassigned' },
        { name: 'Victoria Island District', districtNumber: 5, pastorName: 'Unassigned' },
        { name: 'Yaba District', districtNumber: 6, pastorName: 'Unassigned' }
      ];
      
      await District.insertMany(districts);
      console.log('Created 6 districts');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

quickSeed();