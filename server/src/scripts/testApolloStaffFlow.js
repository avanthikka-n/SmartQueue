import mongoose from 'mongoose';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Organization from '../models/Organization.js';
import Department from '../models/Department.js';
import Service from '../models/Service.js';
import Counter from '../models/Counter.js';
import Token from '../models/Token.js';
import QueueEvent from '../models/QueueEvent.js';

dotenv.config();

const BASE = 'http://localhost:5000/api';
const JWT_SECRET = process.env.JWT_SECRET || 'smartqueue_super_secret_jwt_key_2026_change_in_prod';

const log = (msg) => console.log(msg);
const pass = (n, m) => console.log(`✓ Test ${n} Passed: ${m}`);
const fail = (n, m, e) => { console.error(`✗ Test ${n} FAILED: ${m}`); console.error('  Error:', e); process.exit(1); };

async function run() {
  log('\n=== Apollo Hospital Staff Console End-to-End Test ===\n');
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/smartqueue');

  // 1. Staff Login
  const staff = await User.findOne({ email: 'sam09@gmail.com' });
  if (!staff) fail(1, 'Staff sam09@gmail.com not found');

  const staffToken = jwt.sign(
    { id: staff._id, role: staff.role, organizationId: staff.organizationId },
    JWT_SECRET,
    { expiresIn: '1d' }
  );

  // 2. Fetch User Profile
  const meRes = await fetch(`${BASE}/auth/me`, {
    headers: { Authorization: `Bearer ${staffToken}` }
  });
  const meData = await meRes.json();
  if (meData.success && meData.user.counterId && meData.user.counterId.name === 'Counter 1') {
    pass(1, `Staff profile contains assigned counter: ${meData.user.counterId.name} (${meData.user.departmentId?.name})`);
  } else {
    fail(1, 'Staff profile missing counter assignment', meData);
  }

  // 3. Fetch Counters for Apollo
  const countersRes = await fetch(`${BASE}/counters`, {
    headers: { Authorization: `Bearer ${staffToken}` }
  });
  const countersData = await countersRes.json();
  const counter1 = countersData.counters?.find(c => c.counterNumber === 1 && c.name === 'Counter 1');
  if (counter1) {
    pass(2, `Counters fetched successfully. Found Counter 1 (ID: ${counter1._id})`);
  } else {
    fail(2, 'Counter 1 not found in counters list', countersData);
  }

  // 4. Fetch Queue - verify E001 is in waiting queue
  const queueRes = await fetch(`${BASE}/tokens/queue?organizationId=${staff.organizationId}`, {
    headers: { Authorization: `Bearer ${staffToken}` }
  });
  const queueData = await queueRes.json();
  const tokenE001 = queueData.waitingQueue?.find(t => t.tokenNumber === 'E001');
  if (tokenE001 && tokenE001.status === 'WAITING') {
    pass(3, `Waiting queue contains Token E001 (Service: ${tokenE001.serviceId?.name}, Priority: ${tokenE001.priority})`);
  } else {
    fail(3, 'Token E001 not found in waiting queue', queueData);
  }

  // 5. Staff calls Token E001
  const callRes = await fetch(`${BASE}/tokens/${tokenE001._id}/call`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${staffToken}`
    },
    body: JSON.stringify({ counterId: counter1._id })
  });
  const callData = await callRes.json();
  if (callData.success && callData.token.status === 'CALLED') {
    pass(4, `Token E001 called to Counter 1. Status: ${callData.token.status}`);
  } else {
    fail(4, 'Failed to call Token E001', callData);
  }

  // 6. Check Customer Token Status API
  const custTokenRes = await fetch(`${BASE}/tokens/${tokenE001._id}`);
  const custTokenData = await custTokenRes.json();
  if (custTokenData.success && custTokenData.token.status === 'CALLED' && custTokenData.counterNumber === 1) {
    pass(5, `Customer view updated: Status '${custTokenData.token.status}', Serving at Counter #${custTokenData.counterNumber}`);
  } else {
    fail(5, 'Customer view did not reflect called status', custTokenData);
  }

  // 7. Verify Duplicate Call Prevention (concurrency protection)
  const dupCallRes = await fetch(`${BASE}/tokens/${tokenE001._id}/call`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${staffToken}`
    },
    body: JSON.stringify({ counterId: counter1._id })
  });
  const dupCallData = await dupCallRes.json();
  if (dupCallRes.status === 400) {
    pass(6, `Duplicate call rejected with 400: "${dupCallData.message}"`);
  } else {
    fail(6, 'Duplicate call was not rejected', dupCallData);
  }

  // 8. Staff Starts Service
  const startRes = await fetch(`${BASE}/tokens/${tokenE001._id}/start`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${staffToken}` }
  });
  const startData = await startRes.json();
  if (startData.success && startData.token.status === 'IN_SERVICE') {
    pass(7, `Service started for Token E001. Status: ${startData.token.status}`);
  } else {
    fail(7, 'Failed to start service', startData);
  }

  // 9. Staff Completes Service
  const completeRes = await fetch(`${BASE}/tokens/${tokenE001._id}/complete`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${staffToken}` }
  });
  const completeData = await completeRes.json();
  if (completeData.success && completeData.token.status === 'COMPLETED') {
    pass(8, `Service completed for Token E001. Status: ${completeData.token.status}`);
  } else {
    fail(8, 'Failed to complete service', completeData);
  }

  // 10. Verify Counter is Available again in DB
  const updatedCounter = await Counter.findById(counter1._id);
  if (updatedCounter.status === 'available' && updatedCounter.currentTokenId === null) {
    pass(9, `Counter 1 status reset to available and ready for next customer`);
  } else {
    fail(9, 'Counter status was not reset after completion', updatedCounter);
  }

  log('\n=== All 9 Tests Passed! Apollo Staff Console Flow Fully Functional ===\n');
  process.exit(0);
}

run().catch(err => {
  console.error('Error in test run:', err);
  process.exit(1);
});
