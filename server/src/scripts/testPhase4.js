import mongoose from 'mongoose';
import Organization from '../models/Organization.js';
import Department from '../models/Department.js';
import Service from '../models/Service.js';
import Counter from '../models/Counter.js';
import User from '../models/User.js';

async function testPhase4Entities() {
  console.log('--- Testing Phase 4 Organization/Dept/Service/Counter/Staff CRUD logic ---');

  // 1. Create Organization
  const org = new Organization({
    name: 'CityCare Test Hospital',
    type: 'hospital',
    email: 'contact@citycare.com'
  });
  await org.validate();
  console.log('✓ Organization model validation passed');

  // 2. Create Department
  const dept = new Department({
    organizationId: org._id,
    name: 'Cardiology'
  });
  await dept.validate();
  console.log('✓ Department model validation passed');

  // 3. Create Service
  const service = new Service({
    organizationId: org._id,
    departmentId: dept._id,
    name: 'ECG Consultation',
    prefix: 'CAR',
    estimatedServiceTime: 15
  });
  await service.validate();
  console.log('✓ Service model validation passed');

  // 4. Create Counter
  const counter = new Counter({
    organizationId: org._id,
    departmentId: dept._id,
    name: 'Desk 1',
    counterNumber: 1
  });
  await counter.validate();
  console.log('✓ Counter model validation passed');

  // 5. Create Staff User
  const staff = new User({
    name: 'Dr. John Doe',
    email: 'staff.doctor@citycare.com',
    phone: '555-9988',
    password: 'password123',
    role: 'STAFF',
    organizationId: org._id,
    departmentId: dept._id,
    counterId: counter._id
  });
  await staff.validate();
  console.log('✓ Staff user account validation passed');

  console.log('====================================================');
  console.log('🎉 PHASE 4 ENTITY VALIDATION PASSED SUCCESSFULLY!');
  console.log('====================================================');
  process.exit(0);
}

testPhase4Entities().catch(err => {
  console.error('❌ Phase 4 Test Failed:', err);
  process.exit(1);
});
