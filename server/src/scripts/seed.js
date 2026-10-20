/**
 * seed.js — Comprehensive Seed Script for SmartQueue Platform
 *
 * Populates two full multi-tenant enterprise organizations:
 *   1. CityCare General Hospital (Healthcare Flow: OPD -> Lab -> Pharmacy)
 *   2. Metro National Bank (Finance Flow: Teller -> Accounts -> Loans)
 *   3. Global Super Admin Account
 *
 * Run: node src/scripts/seed.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

import User from '../models/User.js';
import Organization from '../models/Organization.js';
import Department from '../models/Department.js';
import Service from '../models/Service.js';
import Counter from '../models/Counter.js';
import Token from '../models/Token.js';
import TokenSequence from '../models/TokenSequence.js';
import Appointment from '../models/Appointment.js';
import Feedback from '../models/Feedback.js';
import QueueEvent from '../models/QueueEvent.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/smartqueue';

const hashPassword = async (pwd) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(pwd, salt);
};

const runSeed = async () => {
  try {
    console.log('🌱 Connecting to MongoDB for seeding...');
    await mongoose.connect(MONGO_URI);
    console.log('✓ Connected to MongoDB:', MONGO_URI);

    console.log('🧹 Cleaning existing collections...');
    await Promise.all([
      User.deleteMany({}),
      Organization.deleteMany({}),
      Department.deleteMany({}),
      Service.deleteMany({}),
      Counter.deleteMany({}),
      Token.deleteMany({}),
      TokenSequence.deleteMany({}),
      Appointment.deleteMany({}),
      Feedback.deleteMany({}),
      QueueEvent.deleteMany({})
    ]);
    console.log('✓ Cleaned existing database records');

    const defaultPassword = 'password123';

    // ──────────────────────────────────────────────────────────────────────────
    // 1. GLOBAL SUPER ADMIN
    // ──────────────────────────────────────────────────────────────────────────
    const superAdmin = await User.create({
      name: 'Global Platform Admin',
      email: 'superadmin@smartqueue.com',
      password: defaultPassword,
      role: 'SUPER_ADMIN',
      phone: '+1 800-555-0001'
    });
    console.log('✓ Created Super Admin:', superAdmin.email);

    // ──────────────────────────────────────────────────────────────────────────
    // 2. ORGANIZATION 1: CITYCARE GENERAL HOSPITAL
    // ──────────────────────────────────────────────────────────────────────────
    const hospital = await Organization.create({
      name: 'CityCare General Hospital',
      type: 'hospital',
      description: 'Premier tertiary care hospital with multi-speciality OPD and emergency services.',
      address: '450 Healthcare Boulevard, Metro City',
      phone: '+1 555-0199',
      email: 'contact@citycare.com',
      settings: {
        tokenResetFrequency: 'daily',
        allowAppointments: true,
        maxTokensPerCustomerDay: 5,
        smsNotificationsEnabled: true
      }
    });

    const hospAdmin = await User.create({
      name: 'Dr. Arthur Pendelton',
      email: 'admin@citycare.com',
      password: defaultPassword,
      role: 'ORGANIZATION_ADMIN',
      organizationId: hospital._id,
      phone: '+1 555-0101'
    });

    // Departments for Hospital
    const deptOpd = await Department.create({
      organizationId: hospital._id,
      name: 'Outpatient Department (OPD)',
      code: 'OPD',
      description: 'General consultations and specialty clinics'
    });

    const deptLab = await Department.create({
      organizationId: hospital._id,
      name: 'Diagnostic Laboratory',
      code: 'LAB',
      description: 'Blood work, pathology, and diagnostic testing'
    });

    const deptPharmacy = await Department.create({
      organizationId: hospital._id,
      name: 'Hospital Pharmacy',
      code: 'RX',
      description: 'Prescription fulfillment and medications'
    });

    // Services for Hospital (Linked multi-step workflow)
    const srvPharmacy = await Service.create({
      organizationId: hospital._id,
      departmentId: deptPharmacy._id,
      name: 'Prescription Fulfillment',
      prefix: 'RX',
      estimatedServiceTime: 5,
      description: 'Medicine dispensing & pharmacist consultation'
    });

    const srvLab = await Service.create({
      organizationId: hospital._id,
      departmentId: deptLab._id,
      name: 'Blood Test & Diagnostics',
      prefix: 'LAB',
      estimatedServiceTime: 10,
      nextServiceId: srvPharmacy._id,
      description: 'Routine blood profiles and sample collection'
    });

    const srvOpd = await Service.create({
      organizationId: hospital._id,
      departmentId: deptOpd._id,
      name: 'General Physician Consultation',
      prefix: 'GP',
      estimatedServiceTime: 15,
      nextServiceId: srvLab._id,
      description: 'Comprehensive health checkup & diagnosis'
    });

    const srvPediatric = await Service.create({
      organizationId: hospital._id,
      departmentId: deptOpd._id,
      name: 'Pediatric Care',
      prefix: 'PED',
      estimatedServiceTime: 20,
      description: 'Child health, immunization & consultation'
    });

    // Counters for Hospital
    const cntrOpd1 = await Counter.create({
      organizationId: hospital._id,
      departmentId: deptOpd._id,
      name: 'OPD Consultation Room 1',
      counterNumber: 1,
      status: 'available'
    });

    const cntrOpd2 = await Counter.create({
      organizationId: hospital._id,
      departmentId: deptOpd._id,
      name: 'OPD Consultation Room 2',
      counterNumber: 2,
      status: 'available'
    });

    const cntrLab1 = await Counter.create({
      organizationId: hospital._id,
      departmentId: deptLab._id,
      name: 'Blood Collection Booth A',
      counterNumber: 1,
      status: 'available'
    });

    const cntrRx1 = await Counter.create({
      organizationId: hospital._id,
      departmentId: deptPharmacy._id,
      name: 'Dispensary Window 1',
      counterNumber: 1,
      status: 'available'
    });

    // Staff Users for Hospital
    const staffDoc = await User.create({
      name: 'Dr. Emily Watson',
      email: 'doctor.smith@citycare.com',
      password: defaultPassword,
      role: 'STAFF',
      organizationId: hospital._id,
      departmentId: deptOpd._id,
      counterId: cntrOpd1._id,
      phone: '+1 555-0102'
    });

    const staffNurse = await User.create({
      name: 'Nurse Sarah Connor',
      email: 'nurse.sarah@citycare.com',
      password: defaultPassword,
      role: 'STAFF',
      organizationId: hospital._id,
      departmentId: deptLab._id,
      counterId: cntrLab1._id,
      phone: '+1 555-0103'
    });

    // Assign staff to counters
    await Counter.findByIdAndUpdate(cntrOpd1._id, { $push: { assignedStaff: staffDoc._id } });
    await Counter.findByIdAndUpdate(cntrLab1._id, { $push: { assignedStaff: staffNurse._id } });

    console.log('✓ Created CityCare Hospital facility structure');

    // ──────────────────────────────────────────────────────────────────────────
    // 3. ORGANIZATION 2: METRO NATIONAL BANK
    // ──────────────────────────────────────────────────────────────────────────
    const bank = await Organization.create({
      name: 'Metro National Bank',
      type: 'bank',
      description: 'Full-service commercial and retail banking institution with premier customer counters.',
      address: '700 Financial Plaza, Downtown',
      phone: '+1 555-0200',
      email: 'support@metrobank.com',
      settings: {
        tokenResetFrequency: 'daily',
        allowAppointments: true,
        maxTokensPerCustomerDay: 4
      }
    });

    const bankAdmin = await User.create({
      name: 'Marcus Sterling',
      email: 'admin@metrobank.com',
      password: defaultPassword,
      role: 'ORGANIZATION_ADMIN',
      organizationId: bank._id,
      phone: '+1 555-0201'
    });

    const deptRetail = await Department.create({
      organizationId: bank._id,
      name: 'Retail & Teller Services',
      code: 'RET',
      description: 'Cash deposits, withdrawals, and utility payments'
    });

    const deptLoans = await Department.create({
      organizationId: bank._id,
      name: 'Loans & Mortgages',
      code: 'LN',
      description: 'Home, vehicle, and commercial credit applications'
    });

    const srvCash = await Service.create({
      organizationId: bank._id,
      departmentId: deptRetail._id,
      name: 'Cash Deposit & Withdrawal',
      prefix: 'CASH',
      estimatedServiceTime: 5,
      description: 'Quick counter transactions'
    });

    const srvAccounts = await Service.create({
      organizationId: bank._id,
      departmentId: deptRetail._id,
      name: 'Account Services & KYC',
      prefix: 'ACC',
      estimatedServiceTime: 15,
      description: 'New account opening & updates'
    });

    const srvLoans = await Service.create({
      organizationId: bank._id,
      departmentId: deptLoans._id,
      name: 'Home & Personal Loans',
      prefix: 'LOAN',
      estimatedServiceTime: 25,
      description: 'Loan counseling & documentation'
    });

    const cntrTeller1 = await Counter.create({
      organizationId: bank._id,
      departmentId: deptRetail._id,
      name: 'Teller Window 1',
      counterNumber: 1,
      status: 'available'
    });

    const cntrTeller2 = await Counter.create({
      organizationId: bank._id,
      departmentId: deptRetail._id,
      name: 'Teller Window 2',
      counterNumber: 2,
      status: 'available'
    });

    const staffTeller = await User.create({
      name: 'John Miller',
      email: 'teller.john@metrobank.com',
      password: defaultPassword,
      role: 'STAFF',
      organizationId: bank._id,
      departmentId: deptRetail._id,
      counterId: cntrTeller1._id,
      phone: '+1 555-0202'
    });

    await Counter.findByIdAndUpdate(cntrTeller1._id, { $push: { assignedStaff: staffTeller._id } });

    console.log('✓ Created Metro National Bank facility structure');

    // ──────────────────────────────────────────────────────────────────────────
    // 4. DEMO TOKENS FOR CITYCARE HOSPITAL
    // ──────────────────────────────────────────────────────────────────────────
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];

    // Token 1: In Service at OPD Room 1
    const token1 = await Token.create({
      organizationId: hospital._id,
      departmentId: deptOpd._id,
      serviceId: srvOpd._id,
      tokenNumber: 'GP001',
      tokenSequence: 1,
      status: 'IN_SERVICE',
      priority: 'SENIOR_CITIZEN',
      priorityWeight: 60,
      customerName: 'Eleanor Vance (Elderly)',
      customerPhone: '+1 555-8901',
      counterId: cntrOpd1._id,
      staffId: staffDoc._id,
      calledAt: new Date(Date.now() - 10 * 60000),
      serviceStartedAt: new Date(Date.now() - 8 * 60000)
    });

    await Counter.findByIdAndUpdate(cntrOpd1._id, { status: 'busy', currentTokenId: token1._id });

    // Token 2: Called at Blood Collection
    const token2 = await Token.create({
      organizationId: hospital._id,
      departmentId: deptLab._id,
      serviceId: srvLab._id,
      tokenNumber: 'LAB001',
      tokenSequence: 1,
      status: 'CALLED',
      priority: 'APPOINTMENT',
      priorityWeight: 40,
      customerName: 'David Miller (Appt)',
      customerPhone: '+1 555-8902',
      counterId: cntrLab1._id,
      staffId: staffNurse._id,
      calledAt: new Date(Date.now() - 2 * 60000)
    });

    await Counter.findByIdAndUpdate(cntrLab1._id, { status: 'busy', currentTokenId: token2._id });

    // Token 3: Emergency waiting in OPD
    const token3 = await Token.create({
      organizationId: hospital._id,
      departmentId: deptOpd._id,
      serviceId: srvOpd._id,
      tokenNumber: 'GP002',
      tokenSequence: 2,
      status: 'WAITING',
      priority: 'EMERGENCY',
      priorityWeight: 100,
      customerName: 'Chloe Bennett (Urgent)',
      customerPhone: '+1 555-8903',
      estimatedWaitTime: 5
    });

    // Token 4: Normal waiting in OPD
    const token4 = await Token.create({
      organizationId: hospital._id,
      departmentId: deptOpd._id,
      serviceId: srvOpd._id,
      tokenNumber: 'GP003',
      tokenSequence: 3,
      status: 'WAITING',
      priority: 'NORMAL',
      priorityWeight: 10,
      customerName: 'Michael Chang',
      customerPhone: '+1 555-8904',
      estimatedWaitTime: 20
    });

    // Token 5: Completed with 5-star Feedback
    const token5 = await Token.create({
      organizationId: hospital._id,
      departmentId: deptOpd._id,
      serviceId: srvOpd._id,
      tokenNumber: 'GP000',
      tokenSequence: 0,
      status: 'COMPLETED',
      priority: 'NORMAL',
      priorityWeight: 10,
      customerName: 'Sophia Taylor',
      customerPhone: '+1 555-8905',
      counterId: cntrOpd1._id,
      staffId: staffDoc._id,
      calledAt: new Date(Date.now() - 35 * 60000),
      serviceStartedAt: new Date(Date.now() - 32 * 60000),
      completedAt: new Date(Date.now() - 15 * 60000)
    });

    await Feedback.create({
      organizationId: hospital._id,
      departmentId: deptOpd._id,
      serviceId: srvOpd._id,
      tokenId: token5._id,
      customerName: 'Sophia Taylor',
      rating: 5,
      comment: 'Excellent doctor and prompt service! The live token display was very clear.'
    });

    // Demo Appointment
    await Appointment.create({
      organizationId: hospital._id,
      departmentId: deptOpd._id,
      serviceId: srvPediatric._id,
      customerName: 'Lucas Grey (Child Checkup)',
      customerPhone: '+1 555-8906',
      appointmentDate: new Date(),
      appointmentTime: '10:30 AM',
      status: 'BOOKED'
    });

    console.log('✓ Populated demo tokens, feedback, and appointments for CityCare Hospital');

    // ──────────────────────────────────────────────────────────────────────────
    // 5. DEMO TOKENS FOR METRO NATIONAL BANK
    // ──────────────────────────────────────────────────────────────────────────
    const bankToken1 = await Token.create({
      organizationId: bank._id,
      departmentId: deptRetail._id,
      serviceId: srvCash._id,
      tokenNumber: 'CASH001',
      tokenSequence: 1,
      status: 'IN_SERVICE',
      priority: 'NORMAL',
      priorityWeight: 10,
      customerName: 'Samuel Jackson',
      customerPhone: '+1 555-7701',
      counterId: cntrTeller1._id,
      staffId: staffTeller._id,
      calledAt: new Date(Date.now() - 4 * 60000),
      serviceStartedAt: new Date(Date.now() - 3 * 60000)
    });

    const bankToken2 = await Token.create({
      organizationId: bank._id,
      departmentId: deptRetail._id,
      serviceId: srvAccounts._id,
      tokenNumber: 'ACC001',
      tokenSequence: 1,
      status: 'WAITING',
      priority: 'PRIORITY',
      priorityWeight: 40,
      customerName: 'Victoria Sterling (Gold Member)',
      customerPhone: '+1 555-7702',
      estimatedWaitTime: 5
    });

    await Feedback.create({
      organizationId: bank._id,
      departmentId: deptRetail._id,
      serviceId: srvCash._id,
      tokenId: bankToken1._id,
      customerName: 'Samuel Jackson',
      rating: 5,
      comment: 'Super fast teller window, no lines!'
    });

    console.log('✓ Populated demo tokens for Metro National Bank');

    console.log('\n=============================================================');
    console.log('🎉 SEEDING COMPLETE! PRE-CONFIGURED DEMO CREDENTIALS:');
    console.log('=============================================================');
    console.log('1. Global Super Admin:');
    console.log('   Email:    superadmin@smartqueue.com');
    console.log('   Password: password123');
    console.log('-------------------------------------------------------------');
    console.log('2. CityCare General Hospital:');
    console.log('   Admin:    admin@citycare.com       (password123)');
    console.log('   Doctor:   doctor.smith@citycare.com (password123)');
    console.log('   Nurse:    nurse.sarah@citycare.com  (password123)');
    console.log(`   TV URL:   /display/${hospital._id}/${deptOpd._id}`);
    console.log('-------------------------------------------------------------');
    console.log('3. Metro National Bank:');
    console.log('   Admin:    admin@metrobank.com       (password123)');
    console.log('   Teller:   teller.john@metrobank.com (password123)');
    console.log(`   TV URL:   /display/${bank._id}/${deptRetail._id}`);
    console.log('=============================================================\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding Error:', error);
    process.exit(1);
  }
};

runSeed();
