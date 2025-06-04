// backend/scripts/updateUserAssignments.js - Updated with better error handling
const mongoose = require('mongoose');
const User = require('../models/User');
const CithCentre = require('../models/CithCentre');
const AreaSupervisor = require('../models/AreaSupervisor');
const District = require('../models/District');
require('dotenv').config();

const updateUserAssignments = async () => {
  try {
    console.log('Checking environment variables...');
    console.log('MONGODB_URI exists:', !!process.env.MONGODB_URI);
    
    if (!process.env.MONGODB_URI) {
      console.error('❌ MONGODB_URI not found in environment variables');
      console.log('Current working directory:', process.cwd());
      console.log('Looking for .env file...');
      process.exit(1);
    }

    console.log('Attempting to connect to MongoDB...');
    console.log('Connection string prefix:', process.env.MONGODB_URI.substring(0, 20) + '...');
    
    // Try with additional connection options
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, // 5 second timeout
      socketTimeoutMS: 45000, // 45 second socket timeout
      family: 4 // Use IPv4, skip trying IPv6
    });
    
    console.log('✅ Connected to MongoDB successfully');

    console.log('Updating user assignments...');

    // Get all users and update their respective entities
    const users = await User.find({});
    console.log(`Found ${users.length} users to process`);
    
    if (users.length === 0) {
      console.log('⚠️ No users found in database');
      process.exit(0);
    }
    
    // First, reset all entities to unassigned state
    console.log('Resetting all entities to unassigned state...');
    await District.updateMany({}, { pastorName: 'Unassigned' });
    await AreaSupervisor.updateMany({}, { 
      supervisorName: 'Unassigned',
      contactEmail: null,
      contactPhone: null 
    });
    await CithCentre.updateMany({}, { 
      leaderName: 'Unassigned',
      contactEmail: null,
      contactPhone: null 
    });

    // Track processed centres to handle multiple leaders
    const processedCentres = new Set();
    
    for (const user of users) {
      console.log(`Processing user: ${user.name} (${user.role})`);
      
      if (user.role === 'district_pastor' && user.districtId) {
        try {
          const result = await District.findByIdAndUpdate(user.districtId, {
            pastorName: user.name
          });
          if (result) {
            console.log(`✓ Updated district pastor: ${user.name}`);
          } else {
            console.log(`⚠️ District not found for ${user.name}`);
          }
        } catch (error) {
          console.error(`✗ Error updating district for ${user.name}:`, error.message);
        }
      } else if (user.role === 'area_supervisor' && user.areaSupervisorId) {
        try {
          const result = await AreaSupervisor.findByIdAndUpdate(user.areaSupervisorId, {
            supervisorName: user.name,
            contactEmail: user.email,
            contactPhone: user.phone
          });
          if (result) {
            console.log(`✓ Updated area supervisor: ${user.name}`);
          } else {
            console.log(`⚠️ Area supervisor not found for ${user.name}`);
          }
        } catch (error) {
          console.error(`✗ Error updating area supervisor for ${user.name}:`, error.message);
        }
      } else if (user.role === 'cith_centre' && user.cithCentreId) {
        try {
          // Only process each centre once to get all leaders
          if (!processedCentres.has(user.cithCentreId.toString())) {
            // Get all users assigned to this centre
            const centreUsers = await User.find({
              role: 'cith_centre',
              cithCentreId: user.cithCentreId
            });
            
            if (centreUsers.length > 0) {
              const result = await CithCentre.findByIdAndUpdate(user.cithCentreId, {
                leaderName: centreUsers.map(u => u.name).join(', '),
                contactEmail: centreUsers[0].email,
                contactPhone: centreUsers[0].phone
              });
              if (result) {
                console.log(`✓ Updated CITH centre with ${centreUsers.length} leader(s): ${centreUsers.map(u => u.name).join(', ')}`);
              } else {
                console.log(`⚠️ CITH centre not found for ${user.name}`);
              }
              processedCentres.add(user.cithCentreId.toString());
            }
          }
        } catch (error) {
          console.error(`✗ Error updating CITH centre for ${user.name}:`, error.message);
        }
      }
    }

    // Generate summary report
    console.log('\n=== ASSIGNMENT SUMMARY ===');
    
    const totalDistricts = await District.countDocuments();
    const assignedDistricts = await District.countDocuments({ pastorName: { $ne: 'Unassigned' } });
    console.log(`Districts: ${assignedDistricts}/${totalDistricts} assigned`);
    
    const totalAreas = await AreaSupervisor.countDocuments();
    const assignedAreas = await AreaSupervisor.countDocuments({ supervisorName: { $ne: 'Unassigned' } });
    console.log(`Area Supervisors: ${assignedAreas}/${totalAreas} assigned`);
    
    const totalCentres = await CithCentre.countDocuments();
    const assignedCentres = await CithCentre.countDocuments({ leaderName: { $ne: 'Unassigned' } });
    console.log(`CITH Centres: ${assignedCentres}/${totalCentres} assigned`);
    
    const totalUsers = await User.countDocuments();
    const adminUsers = await User.countDocuments({ role: 'admin' });
    console.log(`Total Users: ${totalUsers} (${adminUsers} admins, ${totalUsers - adminUsers} regular users)`);
    
    console.log('\n✅ User assignments updated successfully!');
    console.log('📝 Now all entities show current assignment status based on registered users');
    console.log('🔄 You can now view the updated assignments in your admin dashboard');
    
    await mongoose.connection.close();
    console.log('Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating assignments:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      code: error.code,
      syscall: error.syscall,
      hostname: error.hostname
    });
    
    if (error.code === 'ESERVFAIL' || error.code === 'ENOTFOUND') {
      console.log('\n🔧 DNS/Network troubleshooting steps:');
      console.log('1. Check your internet connection');
      console.log('2. Try using a different DNS server (8.8.8.8, 1.1.1.1)');
      console.log('3. Check if your firewall is blocking the connection');
      console.log('4. Try connecting from a different network');
      console.log('5. Verify your MongoDB Atlas cluster is running');
    }
    
    process.exit(1);
  }
};

updateUserAssignments();