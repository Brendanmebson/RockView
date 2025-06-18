// backend/scripts/createDefaultZones.js
const mongoose = require('mongoose');
const District = require('../models/District');
const ZonalSupervisor = require('../models/ZonalSupervisor');
require('dotenv').config();

const createDefaultZones = async () => {
  try {
    console.log('Connecting to MongoDB...');
    
    if (!process.env.MONGODB_URI) {
      console.error('MONGODB_URI is not defined in the environment variables');
      process.exit(1);
    }
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB successfully!');
    
    // Get all districts
    const districts = await District.find({});
    console.log(`Found ${districts.length} districts`);
    
    for (const district of districts) {
      console.log(`Processing district: ${district.name}`);
      
      // Check if zones already exist for this district
      const existingZones = await ZonalSupervisor.find({ districtId: district._id });
      
      if (existingZones.length === 0) {
        // Create Zone 1
        const zone1 = await ZonalSupervisor.create({
          name: `${district.name} Zone 1`,
          districtId: district._id,
          areaSupervisorIds: [], // Will be populated later when areas are assigned
          supervisorName: 'Unassigned',
          contactEmail: null,
          contactPhone: null
        });
        
        // Create Zone 2
        const zone2 = await ZonalSupervisor.create({
          name: `${district.name} Zone 2`,
          districtId: district._id,
          areaSupervisorIds: [], // Will be populated later when areas are assigned
          supervisorName: 'Unassigned',
          contactEmail: null,
          contactPhone: null
        });
        
        console.log(`Created zones for ${district.name}:`);
        console.log(`- ${zone1.name}`);
        console.log(`- ${zone2.name}`);
      } else {
        console.log(`District ${district.name} already has ${existingZones.length} zone(s)`);
      }
    }
    
    // Verify results
    const totalZones = await ZonalSupervisor.countDocuments();
    console.log(`\n✅ Script completed successfully!`);
    console.log(`Total zones in database: ${totalZones}`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating default zones:', error);
    process.exit(1);
  }
};

// Run the script
createDefaultZones();