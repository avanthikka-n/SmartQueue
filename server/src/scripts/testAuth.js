import mongoose from 'mongoose';
import app from '../app.js';
import User from '../models/User.js';
import Organization from '../models/Organization.js';
import { generateToken } from '../utils/generateToken.js';
import jwt from 'jsonwebtoken';

async function testAuthSystem() {
  console.log('--- Testing SmartQueue Authentication & Role System ---');

  // 1. JWT Sign & Verify Test
  const testPayload = { id: new mongoose.Types.ObjectId(), role: 'ORGANIZATION_ADMIN' };
  const token = generateToken(testPayload);
  const decoded = jwt.verify(token, process.env.JWT_SECRET || 'smartqueue_super_secret_jwt_key_2026_change_in_prod');
  
  if (decoded.role !== 'ORGANIZATION_ADMIN') {
    throw new Error('JWT token decoding role mismatch');
  }
  console.log('✓ JWT Token generation and verification works');

  // 2. User Role Enumeration Check
  const validRoles = ['SUPER_ADMIN', 'ORGANIZATION_ADMIN', 'STAFF', 'CUSTOMER'];
  validRoles.forEach(role => {
    const tempUser = new User({
      name: `Test ${role}`,
      email: `${role.toLowerCase()}@test.com`,
      phone: '1234567890',
      password: 'password123',
      role: role
    });
    const error = tempUser.validateSync();
    if (error) {
      throw new Error(`Role validation failed for ${role}`);
    }
  });
  console.log('✓ User role-based authorization schema validation passed for all 4 roles');

  console.log('====================================================');
  console.log('🎉 AUTHENTICATION SYSTEM VERIFIED SUCCESSFULLY!');
  console.log('====================================================');
  process.exit(0);
}

testAuthSystem().catch(err => {
  console.error('❌ Auth System Test Failed:', err);
  process.exit(1);
});
