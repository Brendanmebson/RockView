const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const District = require('../models/District');
const ZonalSupervisor = require('../models/ZonalSupervisor');
const AreaSupervisor = require('../models/AreaSupervisor');
const CithCentre = require('../models/CithCentre');
const User = require('../models/User');
const WeeklyReport = require('../models/WeeklyReport');
const Message = require('../models/Message');
const Notification = require('../models/Notification');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected for seeding');
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

const clearNonAdminData = async () => {
  try {
    console.log('🧹 Clearing existing data (keeping admins)...');
    
    // Clear all organizational data
    await District.deleteMany({});
    await ZonalSupervisor.deleteMany({});
    await AreaSupervisor.deleteMany({});
    await CithCentre.deleteMany({});
    
    // Clear all reports and communications
    await WeeklyReport.deleteMany({});
    await Message.deleteMany({});
    await Notification.deleteMany({});
    
    // Clear all non-admin users
    const deletedUsers = await User.deleteMany({ role: { $ne: 'admin' } });
    
    console.log(`✅ Cleared ${deletedUsers.deletedCount} non-admin users`);
    console.log('✅ Cleared all organizational data');
    
    // Show remaining admins
    const remainingAdmins = await User.find({ role: 'admin' }).select('name email');
    console.log('🔐 Remaining admins:', remainingAdmins.map(a => a.name));
    
  } catch (error) {
    console.error('Error clearing data:', error);
    throw error;
  }
};

const seedOrganizationalData = async () => {
  try {
    console.log('🌱 Creating organizational structure...');
    
    // Corrected District data from your image
    const districtData = [
      { name: 'AJAH', districtNumber: 1, zones: 3, areas: 8, centers: 20 },
      { name: 'CHEVRON', districtNumber: 2, zones: 2, areas: 5, centers: 15 },
      { name: 'LEKKI', districtNumber: 3, zones: 2, areas: 5, centers: 12 },
      { name: 'AYOS', districtNumber: 4, zones: 2, areas: 4, centers: 12 },
      { name: 'IKEJA-IKORODU', districtNumber: 5, zones: 2, areas: 3, centers: 10 },
      { name: 'FESTAC-OSHODI', districtNumber: 6, zones: 2, areas: 4, centers: 19 },
    ];

    // Create Districts
    console.log('📍 Creating districts...');
    const districts = await District.create(
      districtData.map(d => ({
        name: d.name,
        districtNumber: d.districtNumber,
        pastorName: 'Unassigned',
        description: `${d.name} District - ${d.zones} zones, ${d.areas} areas, ${d.centers} centers`
      }))
    );
    console.log(`✅ Created ${districts.length} districts`);

    // Create Zones, Areas, and Centers for each district
    let totalZones = 0, totalAreas = 0, totalCenters = 0;

    for (const districtInfo of districtData) {
      const district = districts.find(d => d.name === districtInfo.name);
      if (!district) continue;

      console.log(`🏢 Processing ${districtInfo.name}...`);

      // Create Areas for this district first
      const districtAreas = [];
      for (let a = 1; a <= districtInfo.areas; a++) {
        const area = await AreaSupervisor.create({
          name: `${districtInfo.name} Area ${a}`,
          districtId: district._id,
          supervisorName: 'Unassigned'
        });
        districtAreas.push(area);
        totalAreas++;
      }

      // Create Zones and distribute areas among them
      const areasPerZone = Math.ceil(districtInfo.areas / districtInfo.zones);
      
      for (let z = 1; z <= districtInfo.zones; z++) {
        const startAreaIndex = (z - 1) * areasPerZone;
        const endAreaIndex = Math.min(z * areasPerZone, districtAreas.length);
        const zoneAreaIds = districtAreas.slice(startAreaIndex, endAreaIndex).map(area => area._id);
        
        if (zoneAreaIds.length > 0) {
          const zone = await ZonalSupervisor.create({
            name: `${districtInfo.name} Zone ${z}`,
            districtId: district._id,
            areaSupervisorIds: zoneAreaIds,
            supervisorName: 'Unassigned'
          });
          totalZones++;
        }
      }

      // Create Centers distributed across areas
      const centersPerArea = Math.ceil(districtInfo.centers / districtInfo.areas);
      let centerCounter = 1;
      
      for (const area of districtAreas) {
        const centersForThisArea = Math.min(centersPerArea, districtInfo.centers - (centerCounter - 1));
        
        for (let c = 1; c <= centersForThisArea; c++) {
          if (centerCounter <= districtInfo.centers) {
            await CithCentre.create({
              name: `${districtInfo.name} Centre ${centerCounter}`,
              location: `${districtInfo.name} Location ${centerCounter}`,
              areaSupervisorId: area._id,
              leaderName: 'Unassigned'
            });
            totalCenters++;
            centerCounter++;
          }
        }
      }

      console.log(`  ✅ ${districtInfo.name}: ${districtInfo.zones} zones, ${districtInfo.areas} areas, ${districtInfo.centers} centers`);
    }

    console.log('\n📊 Summary:');
    console.log(`   Districts: ${districts.length}`);
    console.log(`   Zones: ${totalZones}`);
    console.log(`   Areas: ${totalAreas}`);
    console.log(`   Centers: ${totalCenters}`);
    console.log('\n✅ Organizational structure created successfully!');

  } catch (error) {
    console.error('Error seeding data:', error);
    throw error;
  }
};

const verifyData = async () => {
  try {
    console.log('\n🔍 Verifying created data...');
    
    const districts = await District.countDocuments();
    const zones = await ZonalSupervisor.countDocuments();
    const areas = await AreaSupervisor.countDocuments();
    const centers = await CithCentre.countDocuments();
    const admins = await User.countDocuments({ role: 'admin' });
    
    console.log('📈 Final counts:');
    console.log(`   Districts: ${districts}`);
    console.log(`   Zonal Supervisors: ${zones}`);
    console.log(`   Area Supervisors: ${areas}`);
    console.log(`   CITH Centres: ${centers}`);
    console.log(`   Admins: ${admins}`);
    
    // Expected totals from your image
    const expectedDistricts = 6; // AJAH, CHEVRON, LEKKI, AYOS, IKEJA-IKORODU, FESTAC-OSHODI
    const expectedZones = 13;
    const expectedAreas = 29;
    const expectedCenters = 88;
    
    console.log('\n🎯 Expected vs Actual:');
    console.log(`   Districts: ${districts}/${expectedDistricts} ${districts === expectedDistricts ? '✅' : '❌'}`);
    console.log(`   Zones: ${zones}/${expectedZones} ${zones === expectedZones ? '✅' : '❌'}`);
    console.log(`   Areas: ${areas}/${expectedAreas} ${areas === expectedAreas ? '✅' : '❌'}`);
    console.log(`   Centers: ${centers}/${expectedCenters} ${centers === expectedCenters ? '✅' : '❌'}`);

    // Show district breakdown
    console.log('\n📋 District Breakdown:');
    const allDistricts = await District.find().lean();
    for (const district of allDistricts) {
      const districtZones = await ZonalSupervisor.countDocuments({ districtId: district._id });
      const districtAreas = await AreaSupervisor.countDocuments({ districtId: district._id });
      const districtCenters = await CithCentre.countDocuments({ 
        areaSupervisorId: { 
          $in: await AreaSupervisor.find({ districtId: district._id }).distinct('_id') 
        } 
      });
      
      console.log(`   ${district.name}: ${districtZones} zones, ${districtAreas} areas, ${districtCenters} centers`);
    }

  } catch (error) {
    console.error('Error verifying data:', error);
  }
};

const main = async () => {
  try {
    await connectDB();
    
    console.log('🚀 Starting data reset and seeding process...\n');
    console.log('📊 Creating structure from your image:');
    console.log('   AJAH: 3 zones, 8 areas, 20 centers');
    console.log('   CHEVRON: 2 zones, 5 areas, 15 centers');
    console.log('   LEKKI: 2 zones, 5 areas, 12 centers');
    console.log('   AYOS: 2 zones, 4 areas, 12 centers');
    console.log('   IKEJA-IKORODU: 2 zones, 3 areas, 10 centers');
    console.log('   FESTAC-OSHODI: 2 zones, 4 areas, 19 centers');
    console.log('   TOTAL: 13 zones, 29 areas, 88 centers\n');
    
    await clearNonAdminData();
    console.log('');
    
    await seedOrganizationalData();
    console.log('');
    
    await verifyData();
    
    console.log('\n🎉 Process completed successfully!');
    console.log('💡 You can now start registering users to fill the positions.');
    console.log('🔗 Combined districts created: IKEJA-IKORODU and FESTAC-OSHODI');
    
  } catch (error) {
    console.error('❌ Process failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n📡 Database connection closed');
    process.exit(0);
  }
};

// Run the script
main();