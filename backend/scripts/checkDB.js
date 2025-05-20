// backend/scripts/checkDB.js
const mongoose = require('mongoose');
const District = require('../models/District');
const AreaSupervisor = require('../models/AreaSupervisor');
const CithCentre = require('../models/CithCentre');
const User = require('../models/User');
require('dotenv').config();

const checkDB = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    const districts = await District.find();
    console.log(`Found ${districts.length} districts:`);
    districts.forEach(district => {
      console.log(`- ${district.name} (ID: ${district._id})`);
    });
    
    const areaSupervisors = await AreaSupervisor.find().populate('districtId');
    console.log(`\nFound ${areaSupervisors.length} area supervisors:`);
    areaSupervisors.forEach(area => {
      console.log(`- ${area.name} (ID: ${area._id}) in district: ${area.districtId?.name || 'Unknown'}`);
    });
    
    const cithCentres = await CithCentre.find().populate('areaSupervisorId');
    console.log(`\nFound ${cithCentres.length} CITH centres:`);
    cithCentres.forEach(centre => {
      console.log(`- ${centre.name} (ID: ${centre._id}) under area: ${centre.areaSupervisorId?.name || 'Unknown'}`);
    });
    
    const users = await User.find().select('-password');
    console.log(`\nFound ${users.length} users:`);
    users.forEach(user => {
      console.log(`- ${user.name} (${user.email}) with role: ${user.role}`);
    });
    
    const adminCount = await User.countDocuments({ role: 'admin' });
    const districtPastorCount = await User.countDocuments({ role: 'district_pastor' });
    const areaSupervisorCount = await User.countDocuments({ role: 'area_supervisor' });
    const cithCentreCount = await User.countDocuments({ role: 'cith_centre' });
    
    console.log('\nUser role breakdown:');
    console.log(`- Admins: ${adminCount}`);
    console.log(`- District Pastors: ${districtPastorCount}`);
    console.log(`- Area Supervisors: ${areaSupervisorCount}`);
    console.log(`- CITH Centre Leaders: ${cithCentreCount}`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error checking database:', error);
    process.exit(1);
  }
};

checkDB();