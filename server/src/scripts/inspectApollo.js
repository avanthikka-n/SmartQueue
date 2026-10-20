import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Organization from '../models/Organization.js';
import Department from '../models/Department.js';
import Service from '../models/Service.js';
import Counter from '../models/Counter.js';
import Token from '../models/Token.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/smartqueue';

async function inspectApollo() {
  await mongoose.connect(MONGO_URI);
  console.log('--- INSPECTING APOLLO HOSPITAL DATA ---');

  // 1. Find Apollo Org
  const apolloOrg = await Organization.findOne({ name: /apollo/i });
  console.log('Apollo Org:', apolloOrg);

  const orgId = apolloOrg?._id;

  // 2. Find All Users for Apollo
  const users = await User.find({ organizationId: orgId }).populate('departmentId').populate('counterId');
  console.log('\nUsers for Apollo:', users.map(u => ({
    id: u._id,
    name: u.name,
    email: u.email,
    role: u.role,
    departmentId: u.departmentId,
    counterId: u.counterId,
    isActive: u.isActive
  })));

  // 3. Find All Departments for Apollo
  const departments = await Department.find({ organizationId: orgId });
  console.log('\nDepartments for Apollo:', departments.map(d => ({
    id: d._id,
    name: d.name,
    code: d.code
  })));

  // 4. Find All Services for Apollo
  const services = await Service.find({ organizationId: orgId }).populate('departmentId');
  console.log('\nServices for Apollo:', services.map(s => ({
    id: s._id,
    name: s.name,
    prefix: s.prefix,
    department: s.departmentId?.name,
    departmentId: s.departmentId?._id
  })));

  // 5. Find All Counters for Apollo
  const counters = await Counter.find({ organizationId: orgId }).populate('departmentId').populate('assignedStaff');
  console.log('\nCounters for Apollo:', counters.map(c => ({
    id: c._id,
    name: c.name,
    counterNumber: c.counterNumber,
    department: c.departmentId?.name,
    departmentId: c.departmentId?._id,
    status: c.status,
    assignedStaff: c.assignedStaff?.map(st => ({ id: st._id, name: st.name, email: st.email }))
  })));

  // 6. Find Tokens for Apollo (including E001)
  const tokens = await Token.find({ organizationId: orgId }).populate('departmentId').populate('serviceId').populate('counterId').populate('staffId');
  console.log('\nTokens for Apollo:', tokens.map(t => ({
    id: t._id,
    tokenNumber: t.tokenNumber,
    status: t.status,
    priority: t.priority,
    customerName: t.customerName,
    department: t.departmentId?.name,
    departmentId: t.departmentId?._id,
    service: t.serviceId?.name,
    serviceId: t.serviceId?._id,
    counterId: t.counterId,
    staffId: t.staffId
  })));

  // Also check if there are any staff users in other orgs or unassigned
  const allStaff = await User.find({ role: 'STAFF' }).populate('organizationId').populate('departmentId').populate('counterId');
  console.log('\nAll Staff Users in DB:', allStaff.map(s => ({
    id: s._id,
    name: s.name,
    email: s.email,
    org: s.organizationId?.name,
    orgId: s.organizationId?._id,
    dept: s.departmentId?.name,
    counter: s.counterId?.name
  })));

  process.exit(0);
}

inspectApollo().catch(err => {
  console.error('Error inspecting:', err);
  process.exit(1);
});
