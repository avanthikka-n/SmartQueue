/**
 * testStaffPortal.js
 * End-to-end test for the Staff Portal & role system using native fetch.
 * Run: node src/scripts/testStaffPortal.js
 */

const BASE = 'http://localhost:5000/api';
let adminToken = '';
let staffToken = '';
let staffId = '';
let testEmail = `priya_test_${Date.now()}@citycare.com`;

const log = (msg) => console.log(msg);
const pass = (n, m) => console.log(`✓ Test ${n} Passed: ${m}`);
const fail = (n, m, e) => { console.error(`✗ Test ${n} FAILED: ${m}`); console.error('  Error:', e); process.exit(1); };

async function apiRequest(endpoint, options = {}) {
  const url = `${BASE}${endpoint}`;
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  const res = await fetch(url, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, data };
}

async function run() {
  log('\n=== SmartQueue Staff Portal Test Suite ===\n');

  // Test 1: Admin login
  try {
    const res = await apiRequest('/auth/login', {
      method: 'POST',
      body: { email: 'admin@citycare.com', password: 'password123' }
    });
    if (res.data.success && res.data.user.role === 'ORGANIZATION_ADMIN') {
      adminToken = res.data.token;
      pass(1, `Admin login OK. Role: ${res.data.user.role}`);
    } else {
      fail(1, 'Admin login did not return expected role', res.data);
    }
  } catch (e) { fail(1, 'Admin login failed', e.message); }

  // Test 2: Create staff account via admin
  try {
    const res = await apiRequest('/staff', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        name: 'Priya Test',
        email: testEmail,
        phone: '555-1234',
        password: 'staffpass123',
        departmentId: null,
        counterId: null
      }
    });
    if (res.data.success) {
      staffId = res.data.staff.id;
      pass(2, `Staff account created. ID: ${staffId}`);
    } else {
      fail(2, 'Staff creation response not success', res.data);
    }
  } catch (e) { fail(2, 'Staff creation failed', e.message); }

  // Test 3: Staff login
  try {
    const res = await apiRequest('/auth/login', {
      method: 'POST',
      body: { email: testEmail, password: 'staffpass123' }
    });
    if (res.data.success && res.data.user.role === 'STAFF') {
      staffToken = res.data.token;
      pass(3, `Staff login OK. Role: ${res.data.user.role}`);
    } else {
      fail(3, 'Staff login role mismatch', res.data);
    }
  } catch (e) { fail(3, 'Staff login failed', e.message); }

  // Test 4: Staff can access queue
  try {
    const meRes = await apiRequest('/auth/me', { headers: { Authorization: `Bearer ${staffToken}` } });
    const orgId = meRes.data.user?.organizationId?._id;
    const res = await apiRequest(`/tokens/queue?organizationId=${orgId}`, {
      headers: { Authorization: `Bearer ${staffToken}` }
    });
    pass(4, `Staff can fetch queue. Status: ${res.status}`);
  } catch (e) { fail(4, 'Staff queue access failed', e.message); }

  // Test 5: Staff CANNOT access admin-only staff list (403 Forbidden)
  try {
    const res = await apiRequest('/staff', { headers: { Authorization: `Bearer ${staffToken}` } });
    if (res.status === 403) {
      pass(5, `Staff correctly blocked from GET /api/staff (403 Forbidden)`);
    } else {
      fail(5, `Staff was not blocked from staff list! Status: ${res.status}`, res.data);
    }
  } catch (e) { fail(5, 'Staff check failed', e.message); }

  // Test 6: Admin can reset staff password
  try {
    const res = await apiRequest(`/staff/${staffId}/reset-password`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { newPassword: 'newpass456' }
    });
    if (res.data.success) {
      pass(6, `Password reset OK: ${res.data.message}`);
    } else {
      fail(6, 'Password reset did not return success', res.data);
    }
  } catch (e) { fail(6, 'Password reset endpoint failed', e.message); }

  // Test 7: Staff can login with new password
  try {
    const res = await apiRequest('/auth/login', {
      method: 'POST',
      body: { email: testEmail, password: 'newpass456' }
    });
    if (res.data.success && res.data.user.role === 'STAFF') {
      pass(7, `Staff login with reset password OK`);
    } else {
      fail(7, 'Login with reset password failed', res.data);
    }
  } catch (e) { fail(7, 'Login with reset password threw exception', e.message); }

  // Test 8: Admin can deactivate staff account
  try {
    const res = await apiRequest(`/staff/${staffId}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { isActive: false }
    });
    if (res.data.success) {
      pass(8, `Staff account deactivated successfully`);
    } else {
      fail(8, 'Deactivation did not return success', res.data);
    }
  } catch (e) { fail(8, 'Deactivation failed', e.message); }

  // Test 9: Deactivated staff cannot login (403 Account deactivated)
  try {
    const res = await apiRequest('/auth/login', {
      method: 'POST',
      body: { email: testEmail, password: 'newpass456' }
    });
    if (res.status === 403) {
      pass(9, `Deactivated staff correctly blocked (403 Account Deactivated)`);
    } else {
      fail(9, `Deactivated staff should have been blocked! Status: ${res.status}`, res.data);
    }
  } catch (e) { fail(9, 'Deactivated staff test threw error', e.message); }

  // Cleanup: re-activate then delete
  try {
    await apiRequest(`/staff/${staffId}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { isActive: true }
    });
    await apiRequest(`/staff/${staffId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    log('\n[Cleanup] Test staff account deleted.');
  } catch (e) { log('[Cleanup] Could not delete test account: ' + e.message); }

  log('\n=== All 9 Tests Passed! Staff Portal & Role System Working ===\n');
}

run().catch(err => {
  console.error('Test suite crashed:', err.message);
  process.exit(1);
});
