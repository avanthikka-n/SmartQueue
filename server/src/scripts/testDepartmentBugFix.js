import mongoose from 'mongoose';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import app from '../app.js';
import User from '../models/User.js';
import Organization from '../models/Organization.js';
import Department from '../models/Department.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/smartqueue';
const JWT_SECRET = process.env.JWT_SECRET || 'smartqueue_super_secret_jwt_key_2026_change_in_prod';

async function runTest() {
  try {
    console.log('--- Connecting to DB ---');
    await mongoose.connect(MONGO_URI);
    console.log('✓ Connected to DB');

    // 1. Find or create a test organization
    let org = await Organization.findOne({ name: 'BugFix Test Organization' });
    if (!org) {
      org = await Organization.create({
        name: 'BugFix Test Organization',
        type: 'bank'
      });
    }

    // 2. Find or create an admin user for this organization
    let user = await User.findOne({ email: 'admin@bugfixtest.com' });
    if (!user) {
      user = await User.create({
        name: 'Test Org Admin',
        email: 'admin@bugfixtest.com',
        phone: '+1 555-0100',
        password: 'hashedpassword123',
        role: 'ORGANIZATION_ADMIN',
        organizationId: org._id
      });
    }

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '1d' });

    // 3. Ensure "Cash Counter" exists in this organization
    let cashDept = await Department.findOne({ organizationId: org._id, name: 'Cash Counter' });
    if (!cashDept) {
      cashDept = await Department.create({
        organizationId: org._id,
        name: 'Cash Counter',
        description: 'Teller cash services'
      });
    }

    console.log('\n--- Test 1: GET /api/departments with Bearer token (no query param) ---');
    const getRes = await request(app)
      .get('/api/departments')
      .set('Authorization', `Bearer ${token}`);

    console.log('Status:', getRes.status);
    console.log('Success:', getRes.body.success);
    console.log('Count:', getRes.body.count);
    console.log('Departments:', getRes.body.departments?.map(d => d.name));

    if (getRes.status !== 200 || !getRes.body.departments?.some(d => d.name === 'Cash Counter')) {
      throw new Error(`Test 1 Failed! Expected 200 and 'Cash Counter' in departments, got status ${getRes.status}`);
    }
    console.log('✓ Test 1 Passed: Authenticated GET /api/departments returns 200 OK and includes Cash Counter!');

    console.log('\n--- Test 2: POST /api/departments with duplicate "Cash Counter" ---');
    const dupRes = await request(app)
      .post('/api/departments')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Cash Counter', description: 'Duplicate attempt' });

    console.log('Status:', dupRes.status);
    console.log('Message:', dupRes.body.message);

    if (dupRes.status !== 400 || !dupRes.body.message?.includes('already exists')) {
      throw new Error(`Test 2 Failed! Expected 400 with duplicate message, got ${dupRes.status}: ${JSON.stringify(dupRes.body)}`);
    }
    console.log('✓ Test 2 Passed: Duplicate validation works as expected!');

    console.log('\n--- Test 3: POST /api/departments creating "Customer Support" ---');
    // Delete any old "Customer Support" if left from prior run
    await Department.deleteOne({ organizationId: org._id, name: 'Customer Support' });

    const newRes = await request(app)
      .post('/api/departments')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Customer Support', description: 'Help desk & inquiries' });

    console.log('Status:', newRes.status);
    console.log('Created Dept:', newRes.body.department?.name);

    if (newRes.status !== 201 || newRes.body.department?.name !== 'Customer Support') {
      throw new Error(`Test 3 Failed! Expected 201 Created, got ${newRes.status}`);
    }
    console.log('✓ Test 3 Passed: "Customer Support" created successfully!');

    console.log('\n--- Test 4: Re-fetching GET /api/departments to verify immediate appearance ---');
    const getRes2 = await request(app)
      .get('/api/departments')
      .set('Authorization', `Bearer ${token}`);

    console.log('Updated Depts:', getRes2.body.departments?.map(d => d.name));
    if (!getRes2.body.departments?.some(d => d.name === 'Customer Support') ||
        !getRes2.body.departments?.some(d => d.name === 'Cash Counter')) {
      throw new Error(`Test 4 Failed! Both departments should appear.`);
    }
    console.log('✓ Test 4 Passed: Both "Cash Counter" and "Customer Support" appear in department list!');

    console.log('\n--- Test 5: Public GET /api/departments?organizationId=... ---');
    const publicRes = await request(app)
      .get(`/api/departments?organizationId=${org._id}`);

    console.log('Public Status:', publicRes.status);
    console.log('Public Depts:', publicRes.body.departments?.map(d => d.name));
    if (publicRes.status !== 200) {
      throw new Error(`Test 5 Failed! Expected 200 OK for public org query.`);
    }
    console.log('✓ Test 5 Passed: Public customer query with organizationId works!');

    console.log('\n--- Test 6: Unauthenticated GET /api/departments without org ID ---');
    const anonRes = await request(app)
      .get('/api/departments');

    console.log('Anon Status:', anonRes.status);
    if (anonRes.status !== 400) {
      throw new Error(`Test 6 Failed! Expected 400 for anonymous request without org ID.`);
    }
    console.log('✓ Test 6 Passed: Anonymous request without org ID correctly returns 400!');

    console.log('\n🎉 ALL TESTS PASSED SUCCESSFULLY! 🎉');

    // Clean up Customer Support for clean state if needed, or leave it
    await Department.deleteOne({ organizationId: org._id, name: 'Customer Support' });
    await Department.deleteOne({ organizationId: org._id, name: 'Cash Counter' });
    await User.deleteOne({ _id: user._id });
    await Organization.deleteOne({ _id: org._id });

    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error('❌ Test failed:', err);
    process.exit(1);
  }
}

runTest();
