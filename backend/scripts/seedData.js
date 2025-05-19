const mongoose = require('mongoose');
const District = require('../models/District');
const AreaSupervisor = require('../models/AreaSupervisor');
const CithCentre = require('../models/CithCentre');
require('dotenv').config();

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    // Clear existing data
    await District.deleteMany({});
    await AreaSupervisor.deleteMany({});
    await CithCentre.deleteMany({});
    
    // Create Districts
    const district1 = await District.create({
      name: 'District Alpha',
      districtNumber: 1,
      pastorName: 'Pastor John',
    });
    
    const district2 = await District.create({
      name: 'District Beta',
      districtNumber: 2,
      pastorName: 'Pastor Jane',
    });
    
    // Create Area Supervisors
    const supervisor1 = await AreaSupervisor.create({
      name: 'Area 1 - Alpha',
      districtId: district1._id,
      supervisorName: 'Supervisor Mike',
    });
    
    const supervisor2 = await AreaSupervisor.create({
      name: 'Area 2 - Alpha',
      districtId: district1._id,
      supervisorName: 'Supervisor Sarah',
    });
    
    // Create CITH Centres
    await CithCentre.create({
      name: 'CITH Centre 1',
      areaSupervisorId: supervisor1._id,
      location: 'Downtown',
      leaderName: 'Leader David',
    });
    
    await CithCentre.create({
      name: 'CITH Centre 2',
      areaSupervisorId: supervisor1._id,
      location: 'Uptown',
      leaderName: 'Leader Mary',
    });
    
    console.log('Seed data created successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

seedData();