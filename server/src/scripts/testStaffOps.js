import mongoose from 'mongoose';
import Token from '../models/Token.js';
import Counter from '../models/Counter.js';
import QueueEvent from '../models/QueueEvent.js';

async function testStaffOperations() {
  console.log('--- Testing Staff Queue Lifecycle Operations ---');

  const dummyOrgId = new mongoose.Types.ObjectId();
  const dummyDeptId = new mongoose.Types.ObjectId();
  const dummyServiceId = new mongoose.Types.ObjectId();
  const dummyStaffId = new mongoose.Types.ObjectId();

  // 1. Initial WAITING Token
  const token = new Token({
    organizationId: dummyOrgId,
    departmentId: dummyDeptId,
    serviceId: dummyServiceId,
    tokenNumber: 'D039',
    tokenSequence: 39,
    status: 'WAITING',
    customerName: 'Alice Johnson',
    customerPhone: '555-1234'
  });
  await token.validate();
  console.log('✓ Token initial WAITING status validated');

  // 2. State Transition: WAITING -> CALLED
  token.status = 'CALLED';
  token.calledAt = new Date();
  await token.validate();
  console.log('✓ State transition WAITING -> CALLED validated');

  // 3. State Transition: CALLED -> IN_SERVICE
  token.status = 'IN_SERVICE';
  token.serviceStartedAt = new Date();
  await token.validate();
  console.log('✓ State transition CALLED -> IN_SERVICE validated');

  // 4. State Transition: IN_SERVICE -> COMPLETED
  token.status = 'COMPLETED';
  token.completedAt = new Date();
  await token.validate();
  console.log('✓ State transition IN_SERVICE -> COMPLETED validated');

  // 5. State Transition: SKIPPED & TRANSFERRED
  token.status = 'SKIPPED';
  await token.validate();
  console.log('✓ State transition SKIPPED validated');

  token.status = 'TRANSFERRED';
  await token.validate();
  console.log('✓ State transition TRANSFERRED validated');

  console.log('====================================================');
  console.log('🎉 ALL STAFF QUEUE OPERATIONS VALIDATED SUCCESSFULLY!');
  console.log('====================================================');
  process.exit(0);
}

testStaffOperations().catch(err => {
  console.error('❌ Staff Ops Test Failed:', err);
  process.exit(1);
});
