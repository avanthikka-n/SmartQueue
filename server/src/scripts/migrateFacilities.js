import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Organization from '../models/Organization.js';
import Facility from '../models/Facility.js';
import Department from '../models/Department.js';
import Service from '../models/Service.js';
import Counter from '../models/Counter.js';
import User from '../models/User.js';
import Token from '../models/Token.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/smartqueue';

export const runMigration = async () => {
  console.log('🔄 Starting non-destructive Facility migration...');
  const isDirectRun = mongoose.connection.readyState === 0;
  if (isDirectRun) {
    await mongoose.connect(MONGO_URI);
    console.log('✓ Connected to MongoDB');
  }

  const organizations = await Organization.find({});
  console.log(`Found ${organizations.length} organizations to inspect.`);

  for (const org of organizations) {
    // 1. Find or create default Facility for this organization
    let facility = await Facility.findOne({ organizationId: org._id });
    if (!facility) {
      facility = await Facility.create({
        organizationId: org._id,
        name: `${org.name} (Main Facility)`,
        type: org.type || 'other',
        description: org.description || `Primary facility location for ${org.name}`,
        address: org.address || 'Main Facility Location',
        phone: org.phone || '',
        email: org.email || '',
        workingHours: {
          open: '08:00',
          close: '18:00',
          days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
        },
        isActive: org.isActive !== undefined ? org.isActive : true
      });
      console.log(`✓ Created default Facility for ${org.name}: ${facility.name} (${facility._id})`);
    } else {
      console.log(`ℹ Facility already exists for ${org.name}: ${facility.name} (${facility._id})`);
    }

    // 2. Backfill Departments
    const deptsUpdated = await Department.updateMany(
      { organizationId: org._id, facilityId: null },
      { $set: { facilityId: facility._id } }
    );
    if (deptsUpdated.modifiedCount > 0) {
      console.log(`  → Backfilled ${deptsUpdated.modifiedCount} departments with facilityId.`);
    }

    // 3. Backfill Services
    const servicesUpdated = await Service.updateMany(
      { organizationId: org._id, facilityId: null },
      { $set: { facilityId: facility._id } }
    );
    if (servicesUpdated.modifiedCount > 0) {
      console.log(`  → Backfilled ${servicesUpdated.modifiedCount} services with facilityId.`);
    }

    // 4. Backfill Counters
    const countersUpdated = await Counter.updateMany(
      { organizationId: org._id, facilityId: null },
      { $set: { facilityId: facility._id } }
    );
    if (countersUpdated.modifiedCount > 0) {
      console.log(`  → Backfilled ${countersUpdated.modifiedCount} counters with facilityId.`);
    }

    // 5. Backfill Staff Users
    const staffUpdated = await User.updateMany(
      { organizationId: org._id, role: 'STAFF', facilityId: null },
      { $set: { facilityId: facility._id } }
    );
    if (staffUpdated.modifiedCount > 0) {
      console.log(`  → Backfilled ${staffUpdated.modifiedCount} staff users with facilityId.`);
    }

    // 6. Backfill Tokens
    const tokensUpdated = await Token.updateMany(
      { organizationId: org._id, facilityId: null },
      { $set: { facilityId: facility._id } }
    );
    if (tokensUpdated.modifiedCount > 0) {
      console.log(`  → Backfilled ${tokensUpdated.modifiedCount} tokens with facilityId.`);
    }
  }

  console.log('✅ Facility hierarchy migration completed successfully!');
  if (isDirectRun) {
    await mongoose.disconnect();
  }
};

if (process.argv[1]?.endsWith('migrateFacilities.js')) {
  runMigration().catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
  });
}
