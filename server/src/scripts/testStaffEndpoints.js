import mongoose from 'mongoose';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Organization from '../models/Organization.js';
import Department from '../models/Department.js';
import Counter from '../models/Counter.js';
import Token from '../models/Token.js';
import Service from '../models/Service.js';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'smartqueue_super_secret_jwt_key_2026_change_in_prod';

async function testStaffEndpoints() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/smartqueue');

  // Staff user: Sam Alan (sam09@gmail.com)
  const staff = await User.findOne({ email: 'sam09@gmail.com' }).populate('organizationId').populate('departmentId').populate('counterId');
  console.log('Staff User in DB:', {
    id: staff._id,
    name: staff.name,
    email: staff.email,
    role: staff.role,
    organizationId: staff.organizationId?._id,
    departmentId: staff.departmentId?._id,
    counterId: staff.counterId?._id
  });

  const token = jwt.sign(
    { id: staff._id, role: staff.role, organizationId: staff.organizationId?._id },
    JWT_SECRET,
    { expiresIn: '1d' }
  );

  console.log('\n--- 1. Testing GET /api/auth/me ---');
  const meRes = await fetch('http://localhost:5000/api/auth/me', {
    headers: { Authorization: `Bearer ${token}` }
  });
  const meData = await meRes.json();
  console.log('meData:', JSON.stringify(meData, null, 2));

  console.log('\n--- 2. Testing GET /api/counters ---');
  const countersRes = await fetch('http://localhost:5000/api/counters', {
    headers: { Authorization: `Bearer ${token}` }
  });
  const countersData = await countersRes.json();
  console.log('countersData:', JSON.stringify(countersData, null, 2));

  console.log('\n--- 3. Testing GET /api/queue ---');
  const queueRes1 = await fetch(`http://localhost:5000/api/queue?organizationId=${staff.organizationId?._id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  console.log('GET /api/queue status:', queueRes1.status);
  const queueData1 = await queueRes1.json();
  console.log('queueData1:', queueData1);

  console.log('\n--- 4. Testing GET /api/tokens/queue ---');
  const queueRes2 = await fetch(`http://localhost:5000/api/tokens/queue?organizationId=${staff.organizationId?._id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  console.log('GET /api/tokens/queue status:', queueRes2.status);
  const queueData2 = await queueRes2.json();
  console.log('queueData2:', queueData2);

  // Check Token E001 details in DB
  const e001 = await Token.findOne({ tokenNumber: 'E001' });
  console.log('\n--- Token E001 in DB ---');
  console.log('E001:', e001);

  process.exit(0);
}

testStaffEndpoints().catch(err => {
  console.error(err);
  process.exit(1);
});
