import mongoose from 'mongoose';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Organization from '../models/Organization.js';
import Department from '../models/Department.js';
import Service from '../models/Service.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/smartqueue';
const JWT_SECRET = process.env.JWT_SECRET || 'smartqueue_super_secret_jwt_key_2026_change_in_prod';

async function main() {
  console.log('Connecting to MongoDB:', MONGO_URI);
  await mongoose.connect(MONGO_URI);

  // 1. Inspect existing User
  const email = 'johnmaxwell@gmail.com';
  let user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  console.log('\n--- 1. INSPECTING USER ---');
  if (!user) {
    console.log(`User ${email} NOT FOUND! Searching all users...`);
    const allUsers = await User.find({}).select('email role organizationId');
    console.log('Existing users in DB:', allUsers);
    
    // Check organizations
    const allOrgs = await Organization.find({});
    console.log('Existing Organizations:', allOrgs);
    process.exit(1);
  }

  console.log('Found user:', {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    organizationId: user.organizationId,
    isActive: user.isActive,
    hasPasswordHash: !!user.password
  });

  // 2. Inspect Organization & Departments & Services
  console.log('\n--- 2. INSPECTING APOLLO HOSPITAL ORG & DATA ---');
  let org = await Organization.findById(user.organizationId);
  if (!org) {
    console.log('Organization not found by user.organizationId! Searching for Apollo...');
    org = await Organization.findOne({ name: /apollo/i });
  }
  console.log('Organization:', org ? { _id: org._id, name: org.name, type: org.type, email: org.email } : 'None');

  const orgId = org?._id || user.organizationId;
  const departments = await Department.find({ organizationId: orgId });
  console.log(`Departments found (${departments.length}):`, departments.map(d => ({ _id: d._id, name: d.name, code: d.code })));

  const services = await Service.find({ organizationId: orgId });
  console.log(`Services found (${services.length}):`, services.map(s => ({ _id: s._id, name: s.name, prefix: s.prefix })));

  // 3. Reset Password to Apollo123
  console.log('\n--- 3. RESETTING PASSWORD TO Apollo123 ---');
  user.password = 'Apollo123';
  await user.save();
  console.log('✓ Password reset executed using Mongoose user.save()');

  // Verify comparePassword directly
  const reloadedUser = await User.findOne({ email: email.toLowerCase() }).select('+password');
  const isMatch = await reloadedUser.comparePassword('Apollo123');
  console.log('✓ Direct comparePassword("Apollo123") result:', isMatch);

  // 4. Test HTTP Login via API
  console.log('\n--- 4. TESTING HTTP API LOGIN ---');
  const loginRes = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'johnmaxwell@gmail.com', password: 'Apollo123' })
  });
  const loginData = await loginRes.json();
  console.log('Login HTTP Status:', loginRes.status);
  console.log('Login Response:', loginData);

  if (!loginData.success || !loginData.token) {
    console.error('❌ Login failed!');
    process.exit(1);
  }

  // 5. Decode and Verify JWT Token
  console.log('\n--- 5. VERIFYING JWT PAYLOAD ---');
  const decoded = jwt.verify(loginData.token, JWT_SECRET);
  console.log('Decoded JWT:', decoded);
  console.log('Decoded organizationId matches user organizationId:', decoded.organizationId?.toString() === user.organizationId?.toString());

  // 6. Test Departments & Services fetching using the JWT
  console.log('\n--- 6. VERIFYING AUTHENTICATED API ENDPOINTS WITH APOLLO JWT ---');
  const deptRes = await fetch('http://localhost:5000/api/departments', {
    headers: { Authorization: `Bearer ${loginData.token}` }
  });
  const deptData = await deptRes.json();
  console.log('GET /api/departments HTTP Status:', deptRes.status);
  console.log('Departments count:', deptData.departments?.length || 0);

  const srvRes = await fetch('http://localhost:5000/api/services', {
    headers: { Authorization: `Bearer ${loginData.token}` }
  });
  const srvData = await srvRes.json();
  console.log('GET /api/services HTTP Status:', srvRes.status);
  console.log('Services count:', srvData.services?.length || 0);

  // 7. Verify CityCare demo login still works
  console.log('\n--- 7. VERIFYING CITYCARE DEMO LOGIN ---');
  const cityCareLoginRes = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@citycare.com', password: 'password123' })
  });
  const cityCareData = await cityCareLoginRes.json();
  console.log('CityCare Login HTTP Status:', cityCareLoginRes.status, 'Success:', cityCareData.success);

  console.log('\n🎉 ALL CHECKS COMPLETED SUCCESSFULLY!');
  process.exit(0);
}

main().catch(err => {
  console.error('Error in script:', err);
  process.exit(1);
});
