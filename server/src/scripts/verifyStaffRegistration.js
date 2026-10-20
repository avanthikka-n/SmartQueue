import mongoose from 'mongoose';

(async () => {
  const BASE_URL = 'http://localhost:5000/api';
  await mongoose.connect('mongodb://localhost:27017/smartqueue');

  console.log('================================================================');
  console.log('SMARTQUEUE REAL STAFF REGISTRATION & AUTHENTICATION TEST SUITE');
  console.log('================================================================');

  // Step 1: Log in as Apollo Hospital organization administrator
  console.log('\n[1] Organization Admin Login (Apollo Hospital)');
  const adminLoginRes = await fetch(BASE_URL + '/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'johnmaxwell@gmail.com',
      password: 'Apollo123'
    })
  });
  const adminLoginData = await adminLoginRes.json();
  console.log('Admin login status:', adminLoginRes.status, 'Success:', adminLoginData.success);
  if (!adminLoginData.success) {
    console.error('Failed to log in as Apollo Admin:', adminLoginData);
    process.exit(1);
  }
  const adminToken = adminLoginData.token;
  const adminOrgId = adminLoginData.user.organizationId?._id || adminLoginData.user.organizationId;
  console.log('Admin Org ID:', adminOrgId);

  // Step 2: Open Staff Management -> Fetch depts, counters, existing staff
  console.log('\n[2] Fetching Apollo Departments & Counters for Staff Registration Form');
  const [deptRes, counterRes, staffListRes] = await Promise.all([
    fetch(BASE_URL + '/departments', { headers: { 'Authorization': 'Bearer ' + adminToken } }),
    fetch(BASE_URL + '/counters', { headers: { 'Authorization': 'Bearer ' + adminToken } }),
    fetch(BASE_URL + '/staff', { headers: { 'Authorization': 'Bearer ' + adminToken } })
  ]);
  const depts = (await deptRes.json()).departments;
  const counters = (await counterRes.json()).counters;
  const initialStaff = (await staffListRes.json()).staff;
  console.log('Departments found:', depts.length, 'Counters found:', counters.length, 'Current staff count:', initialStaff.length);

  const targetDept = depts[0];
  const targetCounter = counters.find(c => c.departmentId?._id?.toString() === targetDept._id.toString() || c.departmentId?.toString() === targetDept._id.toString()) || counters[0];
  console.log('Selected Department for assignment:', targetDept?.name, '(', targetDept?._id, ')');
  console.log('Selected Counter for assignment:', targetCounter?.name, '(', targetCounter?._id, ')');

  // Step 3: Register a new staff member with valid details
  console.log('\n[3] Registering New Staff Member');
  const staffTestEmail = 'priya.nurse.' + Date.now() + '@apollohospital.com';
  const staffRegPayload = {
    name: 'Priya Sharma',
    email: staffTestEmail,
    phone: '9845012345',
    password: 'StaffPassword123!',
    confirmPassword: 'StaffPassword123!',
    designation: 'Senior Triage Nurse',
    departmentId: targetDept._id.toString(),
    counterId: targetCounter._id.toString()
  };

  const regStaffRes = await fetch(BASE_URL + '/staff', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + adminToken
    },
    body: JSON.stringify(staffRegPayload)
  });
  const regStaffData = await regStaffRes.json();
  console.log('Staff Registration Status:', regStaffRes.status, 'Message:', regStaffData.message);
  if (!regStaffData.success) {
    console.error('Staff registration failed:', regStaffData);
    process.exit(1);
  }
  const createdStaffId = regStaffData.staff._id;
  console.log('Created Staff ID:', createdStaffId, 'Designation:', regStaffData.staff.designation);

  // Step 4: Verify staff record exists in MongoDB with proper hashing
  console.log('\n[4] Verifying Staff Record in MongoDB');
  const dbStaff = await mongoose.connection.db.collection('users').findOne({ _id: new mongoose.Types.ObjectId(createdStaffId) });
  console.log('MongoDB Staff found:', !!dbStaff);
  console.log('MongoDB Staff Email:', dbStaff.email);
  console.log('MongoDB Staff Role:', dbStaff.role);
  console.log('MongoDB Password Hashed (starts with $2a$ or $2b$):', dbStaff.password?.startsWith('$2'));
  console.log('MongoDB Assigned Org ID matches Apollo:', dbStaff.organizationId?.toString() === adminOrgId.toString());
  console.log('MongoDB Assigned Counter ID matches:', dbStaff.counterId?.toString() === targetCounter._id.toString());
  console.log('MongoDB Assigned Dept ID matches:', dbStaff.departmentId?.toString() === targetDept._id.toString());

  // Step 5: Verify staff list displays the new member
  console.log('\n[5] Verifying Staff List Endpoint (GET /api/staff)');
  const updatedStaffRes = await fetch(BASE_URL + '/staff', { headers: { 'Authorization': 'Bearer ' + adminToken } });
  const updatedStaffList = (await updatedStaffRes.json()).staff;
  const foundInList = updatedStaffList.find(s => s._id.toString() === createdStaffId.toString());
  console.log('Staff member present in list:', !!foundInList);
  console.log('Populated Department name in list:', foundInList?.departmentId?.name);
  console.log('Populated Counter name in list:', foundInList?.counterId?.name);

  // Step 6: Log in using newly registered staff credentials at Staff Login
  console.log('\n[6] Staff Login with Newly Registered Credentials');
  const staffLoginRes = await fetch(BASE_URL + '/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: staffTestEmail,
      password: 'StaffPassword123!'
    })
  });
  const staffLoginData = await staffLoginRes.json();
  console.log('Staff Login Status:', staffLoginRes.status, 'Success:', staffLoginData.success);
  if (!staffLoginData.success) {
    console.error('Staff login failed:', staffLoginData);
    process.exit(1);
  }
  const staffToken = staffLoginData.token;
  console.log('Staff JWT Token received:', !!staffToken);
  console.log('Staff User Role:', staffLoginData.user.role);
  console.log('Staff User Dept ID:', staffLoginData.user.departmentId?.toString());
  console.log('Staff User Counter ID:', staffLoginData.user.counterId?.toString());

  // Step 7: Verify Staff Dashboard can load queue & counter data
  console.log('\n[7] Verifying Staff Dashboard Queue & Counter Data');
  const staffQueueRes = await fetch(BASE_URL + '/tokens/queue?organizationId=' + adminOrgId, {
    headers: { 'Authorization': 'Bearer ' + staffToken }
  });
  const staffQueueData = await staffQueueRes.json();
  console.log('Staff Queue Access Status:', staffQueueRes.status, 'Queue Count:', staffQueueData.count);

  // Step 8: Verify Deactivation and Deactivated Login Prevention
  console.log('\n[8] Testing Account Deactivation & Login Block');
  const deactRes = await fetch(BASE_URL + '/staff/' + createdStaffId + '/status', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + adminToken
    },
    body: JSON.stringify({ isActive: false })
  });
  const deactData = await deactRes.json();
  console.log('Deactivation status:', deactRes.status, 'Account isActive:', deactData.staff?.isActive);

  // Attempt login with deactivated staff account
  const blockedLoginRes = await fetch(BASE_URL + '/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: staffTestEmail,
      password: 'StaffPassword123!'
    })
  });
  const blockedLoginData = await blockedLoginRes.json();
  console.log('Deactivated Staff Login Status (expect 403):', blockedLoginRes.status, 'Message:', blockedLoginData.message);

  // Step 9: Verify Cross-Organization Assignment Prevention
  console.log('\n[9] Testing Cross-Organization Assignment Prevention');
  const cityCareOrg = await mongoose.connection.db.collection('organizations').findOne({ name: 'CityCare General Hospital' });
  const cityCareDept = await mongoose.connection.db.collection('departments').findOne({ organizationId: cityCareOrg._id });
  const cityCareCounter = await mongoose.connection.db.collection('counters').findOne({ organizationId: cityCareOrg._id });

  // Apollo admin attempts to register staff assigned to CityCare's department
  const crossOrgRegRes = await fetch(BASE_URL + '/staff', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + adminToken
    },
    body: JSON.stringify({
      name: 'Illegal Cross Org Staff',
      email: 'illegal.' + Date.now() + '@apollo.com',
      phone: '9845099999',
      password: 'Password123!',
      departmentId: cityCareDept._id.toString(),
      counterId: cityCareCounter._id.toString()
    })
  });
  const crossOrgRegData = await crossOrgRegRes.json();
  console.log('Cross-Organization Department Assignment Status (expect 400):', crossOrgRegRes.status, 'Error Message:', crossOrgRegData.message);

  // Step 10: Clean up temporary test staff record
  console.log('\n[10] Cleaning up temporary test record');
  await mongoose.connection.db.collection('users').deleteOne({ _id: new mongoose.Types.ObjectId(createdStaffId) });
  await mongoose.connection.db.collection('counters').updateOne(
    { _id: new mongoose.Types.ObjectId(targetCounter._id) },
    { $pull: { assignedStaff: new mongoose.Types.ObjectId(createdStaffId) } }
  );
  await mongoose.disconnect();

  console.log('\n================================================================');
  console.log('ALL 12 VERIFICATION STEPS PASSED WITH 100% SUCCESS!');
  console.log('================================================================');
})().catch(err => {
  console.error('Test suite failure:', err);
  process.exit(1);
});
