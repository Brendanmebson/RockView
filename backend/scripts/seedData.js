const mongoose = require('mongoose');
const District = require('../models/District');
const AreaSupervisor = require('../models/AreaSupervisor');
const CithCentre = require('../models/CithCentre');
const User = require('../models/User');
require('dotenv').config();

const seedData = async () => {
  try {
    console.log('Connecting to MongoDB...');
    
    // Check if MONGODB_URI is defined
    if (!process.env.MONGODB_URI) {
      console.error('MONGODB_URI is not defined in the environment variables');
      console.log('Please check your .env file to ensure MONGODB_URI is set correctly');
      process.exit(1);
    }
    
    // Safe way to show part of connection string without error
    const connectionPreview = process.env.MONGODB_URI.length > 20 
      ? `${process.env.MONGODB_URI.substring(0, 20)}...` 
      : process.env.MONGODB_URI;
    console.log(`Using connection string: ${connectionPreview}`);
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB successfully!');
    
    // Clear existing data
    console.log('Clearing existing data...');
    await District.deleteMany({});
    await AreaSupervisor.deleteMany({});
    await CithCentre.deleteMany({});
    await User.deleteMany({ role: { $ne: 'admin' } }); // Keep admin accounts
    console.log('Existing data cleared successfully.');
    
    // Create Festac District
    console.log('Creating districts...');
    const festacDistrict = await District.create({
      name: 'Festac District',
      districtNumber: 1,
      pastorName: 'Pastor Johnson',
      description: 'Festac Town and surrounding areas'
    });
    
    // Create Other Districts
    const ikejaDistrict = await District.create({
      name: 'Ikeja District',
      districtNumber: 2,
      pastorName: 'Pastor Williams',
      description: 'Ikeja and surrounding areas'
    });
    
    const lekkiDistrict = await District.create({
      name: 'Lekki District',
      districtNumber: 3,
      pastorName: 'Pastor James',
      description: 'Lekki and surrounding areas'
    });
    
    const surelereDistrict = await District.create({
      name: 'Surulere District',
      districtNumber: 4,
      pastorName: 'Pastor Thomas',
      description: 'Surulere and surrounding areas'
    });
    
    const viDistrict = await District.create({
      name: 'Victoria Island District',
      districtNumber: 5,
      pastorName: 'Pastor Phillips',
      description: 'Victoria Island and surrounding areas'
    });
    
    const yabaDistrict = await District.create({
      name: 'Yaba District',
      districtNumber: 6,
      pastorName: 'Pastor Samuel',
      description: 'Yaba and surrounding areas'
    });
    
    const createdDistricts = [
      festacDistrict, 
      ikejaDistrict, 
      lekkiDistrict, 
      surelereDistrict, 
      viDistrict, 
      yabaDistrict
    ];
    
    console.log(`Created ${createdDistricts.length} districts`);
    console.log('District IDs:', createdDistricts.map(d => d._id.toString()));
    
    // Create Area Supervisors for Festac
    console.log('Creating area supervisors...');
    const festacArea1 = await AreaSupervisor.create({
      name: 'Festac Area 1',
      districtId: festacDistrict._id,
      supervisorName: 'Supervisor Michael',
      contactEmail: 'michael@church.org',
      contactPhone: '+234 800 123 4567',
    });
    
    const festacArea2 = await AreaSupervisor.create({
      name: 'Festac Area 2',
      districtId: festacDistrict._id,
      supervisorName: 'Supervisor Sarah',
      contactEmail: 'sarah@church.org',
      contactPhone: '+234 800 123 4568',
    });
    
    const festacArea3 = await AreaSupervisor.create({
      name: 'Festac Area 3',
      districtId: festacDistrict._id,
      supervisorName: 'Supervisor Daniel',
      contactEmail: 'daniel@church.org',
      contactPhone: '+234 800 123 4569',
    });
    
    const festacArea4 = await AreaSupervisor.create({
      name: 'Festac Area 4',
      districtId: festacDistrict._id,
      supervisorName: 'Supervisor Elizabeth',
      contactEmail: 'elizabeth@church.org',
      contactPhone: '+234 800 123 4570',
    });
    
    // Create Area Supervisors for other districts (abbreviated)
    const ikejaArea1 = await AreaSupervisor.create({
      name: 'Ikeja Area 1',
      districtId: ikejaDistrict._id,
      supervisorName: 'Supervisor David',
    });
    
    const lekkiArea1 = await AreaSupervisor.create({
      name: 'Lekki Area 1',
      districtId: lekkiDistrict._id,
      supervisorName: 'Supervisor Rachel',
    });
    
    const createdAreaSupervisors = [
      festacArea1, 
      festacArea2, 
      festacArea3, 
      festacArea4, 
      ikejaArea1, 
      lekkiArea1
    ];
    
    console.log(`Created ${createdAreaSupervisors.length} area supervisors`);
    console.log('Area Supervisor IDs:', createdAreaSupervisors.map(a => a._id.toString()));
    
    // Create Festac CITH Centres
    console.log('Creating CITH centres...');
    const festacCentres = [
      // Area 1 Centres
      { 
        name: 'Agric Ojo', 
        areaSupervisorId: festacArea1._id, 
        location: 'Ojo Road', 
        leaderName: 'Leader David',
        contactEmail: 'david@church.org',
        contactPhone: '+234 800 111 1111',
      },
      { 
        name: 'FHA Satellite', 
        areaSupervisorId: festacArea1._id, 
        location: 'Satellite Town', 
        leaderName: 'Leader Mary',
        contactEmail: 'mary@church.org',
        contactPhone: '+234 800 111 1112',
      },
      { 
        name: 'Community Road', 
        areaSupervisorId: festacArea1._id, 
        location: 'Community Road', 
        leaderName: 'Leader James',
        contactEmail: 'james@church.org',
        contactPhone: '+234 800 111 1113',
      },
      { 
        name: 'Navy Town', 
        areaSupervisorId: festacArea1._id, 
        location: 'Navy Town', 
        leaderName: 'Leader Elizabeth',
        contactEmail: 'elizabeth@church.org',
        contactPhone: '+234 800 111 1114',
      },
      
      // Area 2 Centres
      { 
        name: 'Navy Town 2', 
        areaSupervisorId: festacArea2._id, 
        location: 'Navy Town Extension', 
        leaderName: 'Leader Michael',
        contactEmail: 'michael@church.org',
        contactPhone: '+234 800 111 1115',
      },
      { 
        name: 'Alakija', 
        areaSupervisorId: festacArea2._id, 
        location: 'Alakija', 
        leaderName: 'Leader Jennifer',
        contactEmail: 'jennifer@church.org',
        contactPhone: '+234 800 111 1116',
      },
      { 
        name: 'Festac 1', 
        areaSupervisorId: festacArea2._id, 
        location: 'Festac Town', 
        leaderName: 'Leader Robert',
        contactEmail: 'robert@church.org',
        contactPhone: '+234 800 111 1117',
      },
      { 
        name: 'Amuwo 1', 
        areaSupervisorId: festacArea2._id, 
        location: 'Amuwo Odofin', 
        leaderName: 'Leader Patricia',
        contactEmail: 'patricia@church.org',
        contactPhone: '+234 800 111 1118',
      },
      
      // Area 3 Centres
      { 
        name: 'Amuwo 2', 
        areaSupervisorId: festacArea3._id, 
        location: 'Amuwo Extension', 
        leaderName: 'Leader John',
        contactEmail: 'john@church.org',
        contactPhone: '+234 800 111 1119',
      },
      { 
        name: 'Ago 1', 
        areaSupervisorId: festacArea3._id, 
        location: 'Ago Palace Way', 
        leaderName: 'Leader Linda',
        contactEmail: 'linda@church.org',
        contactPhone: '+234 800 111 1120',
      },
      { 
        name: 'Isolo', 
        areaSupervisorId: festacArea3._id, 
        location: 'Isolo', 
        leaderName: 'Leader Susan',
        contactEmail: 'susan@church.org',
        contactPhone: '+234 800 111 1121',
      },
      { 
        name: 'Parkview Ago', 
        areaSupervisorId: festacArea3._id, 
        location: 'Ago Parkview', 
        leaderName: 'Leader William',
        contactEmail: 'william@church.org',
        contactPhone: '+234 800 111 1122',
      },
      
      // Area 4 Centres
      { 
        name: 'Ago 2', 
        areaSupervisorId: festacArea4._id, 
        location: 'Ago Extension', 
        leaderName: 'Leader Thomas',
        contactEmail: 'thomas@church.org',
        contactPhone: '+234 800 111 1123',
      },
      { 
        name: 'Jakande', 
        areaSupervisorId: festacArea4._id, 
        location: 'Jakande Estate', 
        leaderName: 'Leader Karen',
        contactEmail: 'karen@church.org',
        contactPhone: '+234 800 111 1124',
      },
      { 
        name: 'Ilasa', 
        areaSupervisorId: festacArea4._id, 
        location: 'Ilasa', 
        leaderName: 'Leader Richard',
        contactEmail: 'richard@church.org',
        contactPhone: '+234 800 111 1125',
      },
      { 
        name: 'Ajao Estate', 
        areaSupervisorId: festacArea4._id, 
        location: 'Ajao Estate', 
        leaderName: 'Leader Barbara',
        contactEmail: 'barbara@church.org',
        contactPhone: '+234 800 111 1126',
      },
      { 
        name: 'CITH on Wheels', 
        areaSupervisorId: festacArea4._id, 
        location: 'Mobile', 
        leaderName: 'Leader Joseph',
        contactEmail: 'joseph@church.org',
        contactPhone: '+234 800 111 1127',
      },
    ];
    
    // Create sample centres for other districts
    const otherCentres = [
      // Ikeja District
      { 
        name: 'Ikeja GRA', 
        areaSupervisorId: ikejaArea1._id, 
        location: 'GRA Ikeja', 
        leaderName: 'Leader Paul',
      },
      { 
        name: 'Allen Avenue', 
        areaSupervisorId: ikejaArea1._id, 
        location: 'Allen Avenue', 
        leaderName: 'Leader Natalie',
      },
      { 
        name: 'Oregun', 
        areaSupervisorId: ikejaArea1._id, 
        location: 'Oregun Road', 
        leaderName: 'Leader Mark',
      },
      
      // Lekki District
      { 
        name: 'Lekki Phase 1', 
        areaSupervisorId: lekkiArea1._id, 
        location: 'Lekki Phase 1', 
        leaderName: 'Leader Rebecca',
      },
      { 
        name: 'Chevron Drive', 
        areaSupervisorId: lekkiArea1._id, 
        location: 'Chevron Drive', 
        leaderName: 'Leader Andrew',
      },
      { 
        name: 'Ajah', 
        areaSupervisorId: lekkiArea1._id, 
        location: 'Ajah', 
        leaderName: 'Leader Grace',
      },
    ];

    // Create all centres
    const allCentres = [...festacCentres, ...otherCentres];
    const createdCentres = [];
    
    console.log(`Creating ${allCentres.length} centres...`);
    for (const centre of allCentres) {
      try {
        const createdCentre = await CithCentre.create(centre);
        createdCentres.push(createdCentre);
      } catch (error) {
        console.error(`Error creating centre '${centre.name}':`, error);
      }
    }
    console.log(`Successfully created ${createdCentres.length} centres`);
    
    // Create user accounts for district pastors, area supervisors, and CITH centre leaders
    console.log('Creating user accounts...');
    
    // District Pastors
    await User.create({
      username: 'festacpastor',
      email: 'festacpastor@church.org',
      password: 'Church123',
      name: 'Pastor Johnson',
      role: 'district_pastor',
      districtId: festacDistrict._id,
      isActive: true
    });
    
    await User.create({
      username: 'ikejapastor',
      email: 'ikejapastor@church.org',
      password: 'Church123',
      name: 'Pastor Williams',
      role: 'district_pastor',
      districtId: ikejaDistrict._id,
      isActive: true
    });
    
    // Area Supervisors
    await User.create({
      username: 'festacarea1',
      email: 'festacarea1@church.org',
      password: 'Church123',
      name: 'Supervisor Michael',
      role: 'area_supervisor',
      areaSupervisorId: festacArea1._id,
      isActive: true
    });
    
    await User.create({
      username: 'festacarea2',
      email: 'festacarea2@church.org',
      password: 'Church123',
      name: 'Supervisor Sarah',
      role: 'area_supervisor',
      areaSupervisorId: festacArea2._id,
      isActive: true
    });
    
    // Centre Leaders (creating accounts for a few sample centres)
    await User.create({
      username: 'agricojo',
      email: 'agricojo@church.org',
      password: 'Church123',
      name: 'Leader David',
      role: 'cith_centre',
      cithCentreId: createdCentres[0]._id, // Agric Ojo
      isActive: true
    });
    
    await User.create({
      username: 'fhasatellite',
      email: 'fhasatellite@church.org',
      password: 'Church123',
      name: 'Leader Mary',
      role: 'cith_centre',
      cithCentreId: createdCentres[1]._id, // FHA Satellite
      isActive: true
    });
    
    await User.create({
      username: 'navytown',
      email: 'navytown@church.org',
      password: 'Church123',
      name: 'Leader Elizabeth',
      role: 'cith_centre',
      cithCentreId: createdCentres[3]._id, // Navy Town
      isActive: true
    });
    
    await User.create({
      username: 'festac1',
      email: 'festac1@church.org',
      password: 'Church123',
      name: 'Leader Robert',
      role: 'cith_centre',
      cithCentreId: createdCentres[6]._id, // Festac 1
      isActive: true
    });
    
    console.log('User accounts created successfully');
    
    // Create an admin user if one doesn't exist
    const adminExists = await User.findOne({ role: 'admin' });
    if (!adminExists) {
      await User.create({
        username: 'admin',
        email: 'admin@church.org',
        password: 'Admin123',
        name: 'System Administrator',
        role: 'admin',
        isActive: true
      });
      console.log('Admin user created');
    }
    
    // Verify data was created successfully
    const districtsCount = await District.countDocuments();
    const areasCount = await AreaSupervisor.countDocuments();
    const centresCount = await CithCentre.countDocuments();
    const usersCount = await User.countDocuments();
    
    console.log('===== DATA VERIFICATION =====');
    console.log(`Districts in database: ${districtsCount}`);
    console.log(`Area Supervisors in database: ${areasCount}`);
    console.log(`CITH Centres in database: ${centresCount}`);
    console.log(`Users in database: ${usersCount}`);
    
    console.log('Seed data created successfully!');
    console.log(`Created ${festacCentres.length} centres for Festac District`);
    console.log(`Created ${otherCentres.length} centres for other districts`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

seedData();