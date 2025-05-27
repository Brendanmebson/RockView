// backend/scripts/resetAssignments.js
require('dotenv').config();
const mongoose = require('mongoose');
const District = require('../models/District');
const AreaSupervisor = require('../models/AreaSupervisor');
const CithCentre = require('../models/CithCentre');
const User = require('../models/User');

const resetAssignments = async () => {
  try {
    console.log('Connecting to MongoDB...');
    
    // Check if MONGODB_URI exists
    if (!process.env.MONGODB_URI) {
      console.error('MONGODB_URI is not defined in environment variables');
      process.exit(1);
    }
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB successfully!');
    
    // Update all districts to show default names (these will show as "Unassigned" via the API)
    const districtUpdateResult = await District.updateMany({}, {
      pastorName: 'Pastor TBD'
    });
    console.log(`Updated ${districtUpdateResult.modifiedCount} district pastor names to default`);
    
    // Update all area supervisors to show default names
    const areaUpdateResult = await AreaSupervisor.updateMany({}, {
      supervisorName: 'Supervisor TBD'
    });
    console.log(`Updated ${areaUpdateResult.modifiedCount} area supervisor names to default`);
    
    // Update all CITH centres to show default names
    const centreUpdateResult = await CithCentre.updateMany({}, {
      leaderName: 'Leader TBD'
    });
    console.log(`Updated ${centreUpdateResult.modifiedCount} CITH centre leader names to default`);
    
    // Check admin users
    const adminUsers = await User.find({ role: 'admin' });
    console.log(`Found ${adminUsers.length} admin users, keeping them`);
    
    // Clear role assignments for non-admin users (keep users but make them unassigned)
    const userUpdateResult = await User.updateMany(
      { role: { $ne: 'admin' } },
      { 
        $unset: { 
          cithCentreId: "",
          areaSupervisorId: "",
          districtId: ""
        }
      }
    );
    console.log(`Cleared role assignments for ${userUpdateResult.modifiedCount} non-admin users`);
    
    // Get final counts
    const districtsCount = await District.countDocuments();
    const areasCount = await AreaSupervisor.countDocuments();
    const centresCount = await CithCentre.countDocuments();
    const usersCount = await User.countDocuments();
    const adminCount = await User.countDocuments({ role: 'admin' });
    
    console.log('\n=== RESET SUMMARY ===');
    console.log(`📍 Districts: ${districtsCount} (all showing as "Unassigned")`);
    console.log(`👥 Area Supervisors: ${areasCount} (all showing as "Unassigned")`);
    console.log(`⛪ CITH Centres: ${centresCount} (all showing as "Unassigned")`);
    console.log(`👤 Total Users: ${usersCount}`);
    console.log(`🔐 Admin Users: ${adminCount}`);
    console.log(`🔄 Unassigned Users: ${usersCount - adminCount}`);
    
    console.log('\n✅ All assignments have been reset!');
    console.log('📝 Now all positions will show as "Unassigned" until you assign people to them.');
    console.log('🚀 You can now use the admin panel to assign users to specific positions.');
    
    await mongoose.connection.close();
    console.log('Database connection closed.');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error resetting assignments:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
};

// Execute the function
resetAssignments();