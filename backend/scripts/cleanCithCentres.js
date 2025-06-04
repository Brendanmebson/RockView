// backend/scripts/cleanCithCentres.js
const mongoose = require('mongoose');
const CithCentre = require('../models/CithCentre');
const AreaSupervisor = require('../models/AreaSupervisor');
const District = require('../models/District');
const User = require('../models/User');
require('dotenv').config();

const cleanAllPrePopulatedData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clean CITH Centres
    console.log('Cleaning CITH Centres...');
    const centres = await CithCentre.find();
    
    for (const centre of centres) {
      const assignedUsers = await User.find({ 
        role: 'cith_centre', 
        cithCentreId: centre._id 
      });

      if (assignedUsers.length === 0) {
        // No users assigned, clear pre-populated contact info
        centre.contactEmail = null;
        centre.contactPhone = null;
        centre.leaderName = 'Unassigned';
      } else {
        // Users are assigned, update with actual user info
        const primaryLeader = assignedUsers[0];
        centre.contactEmail = primaryLeader.email;
        centre.contactPhone = primaryLeader.phone;
        centre.leaderName = assignedUsers.map(user => user.name).join(', ');
      }
      
      await centre.save();
      console.log(`Updated centre: ${centre.name} - ${assignedUsers.length > 0 ? 'Assigned' : 'Unassigned'}`);
    }

    // Clean Area Supervisors
    console.log('Cleaning Area Supervisors...');
    const areas = await AreaSupervisor.find();
    
    for (const area of areas) {
      const assignedUser = await User.findOne({ 
        role: 'area_supervisor', 
        areaSupervisorId: area._id 
      });

      if (!assignedUser) {
        // No user assigned, clear pre-populated contact info
        area.contactEmail = null;
        area.contactPhone = null;
        area.supervisorName = 'Unassigned';
      } else {
        // User is assigned, update with actual user info
        area.contactEmail = assignedUser.email;
        area.contactPhone = assignedUser.phone;
        area.supervisorName = assignedUser.name;
      }
      
      await area.save();
      console.log(`Updated area: ${area.name} - ${assignedUser ? 'Assigned' : 'Unassigned'}`);
    }

    // Clean Districts
    console.log('Cleaning Districts...');
    const districts = await District.find();
    
    for (const district of districts) {
      const assignedUser = await User.findOne({ 
        role: 'district_pastor', 
        districtId: district._id 
      });

      if (!assignedUser) {
        // No user assigned, set to default
        district.pastorName = 'Unassigned';
      } else {
        // User is assigned, update with actual user info
        district.pastorName = assignedUser.name;
      }
      
      await district.save();
      console.log(`Updated district: ${district.name} - ${assignedUser ? 'Assigned' : 'Unassigned'}`);
    }

    // Summary
    const totalCentres = await CithCentre.countDocuments();
    const assignedCentres = await CithCentre.countDocuments({ leaderName: { $ne: 'Unassigned' } });
    
    const totalAreas = await AreaSupervisor.countDocuments();
    const assignedAreas = await AreaSupervisor.countDocuments({ supervisorName: { $ne: 'Unassigned' } });
    
    const totalDistricts = await District.countDocuments();
    const assignedDistricts = await District.countDocuments({ pastorName: { $ne: 'Unassigned' } });

    console.log('\n=== CLEANUP SUMMARY ===');
    console.log(`CITH Centres: ${assignedCentres}/${totalCentres} assigned`);
    console.log(`Area Supervisors: ${assignedAreas}/${totalAreas} assigned`);
    console.log(`Districts: ${assignedDistricts}/${totalDistricts} assigned`);
    console.log('\n✅ Cleanup completed successfully!');
    console.log('📝 Contact information now shows only registered users');
    
    process.exit(0);
  } catch (error) {
    console.error('Error during cleanup:', error);
    process.exit(1);
  }
};

cleanAllPrePopulatedData();