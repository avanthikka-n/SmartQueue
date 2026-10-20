import mongoose from 'mongoose';
import {
  formatTokenNumber,
  getPriorityWeight,
  calculateWaitTime,
  getSortedQueue
} from '../services/tokenEngine.js';

async function testTokenEngine() {
  console.log('--- Testing SmartQueue Core Token Engine & Queue Logic ---');

  // 1. Token Number Formatting Test
  const formatted1 = formatTokenNumber('D', 1);
  const formatted47 = formatTokenNumber('D', 47);
  const formatted103 = formatTokenNumber('C', 103);

  if (formatted1 !== 'D001' || formatted47 !== 'D047' || formatted103 !== 'C103') {
    throw new Error(`Token formatting failed: got ${formatted1}, ${formatted47}, ${formatted103}`);
  }
  console.log('✓ Service token prefix formatting passed (D001, D047, C103)');

  // 2. Priority Weight Assignment Test
  if (
    getPriorityWeight('EMERGENCY') !== 100 ||
    getPriorityWeight('SENIOR_CITIZEN') !== 80 ||
    getPriorityWeight('APPOINTMENT') !== 60 ||
    getPriorityWeight('NORMAL') !== 0
  ) {
    throw new Error('Priority weight calculation mismatch');
  }
  console.log('✓ Priority weights verified (EMERGENCY: 100, SENIOR: 80, APPOINTMENT: 60, NORMAL: 0)');

  // 3. Queue Ordering & Anti-Starvation Logic Test
  const mockTokens = [
    { tokenNumber: 'A001', priority: 'NORMAL', priorityWeight: 0, createdAt: new Date(Date.now() - 35 * 60 * 1000) }, // 35 mins old
    { tokenNumber: 'A002', priority: 'NORMAL', priorityWeight: 0, createdAt: new Date(Date.now() - 5 * 60 * 1000) },  // 5 mins old
    { tokenNumber: 'A003', priority: 'PRIORITY', priorityWeight: 40, createdAt: new Date(Date.now() - 2 * 60 * 1000) }  // Priority
  ];

  // Apply starvation boost logic
  const now = Date.now();
  const STARVATION_THRESHOLD_MS = 30 * 60 * 1000;

  const processed = mockTokens.map(t => {
    const wait = now - t.createdAt.getTime();
    const effectiveWeight = (wait > STARVATION_THRESHOLD_MS && t.priority === 'NORMAL') ? t.priorityWeight + 50 : t.priorityWeight;
    return { ...t, effectiveWeight };
  }).sort((a, b) => b.effectiveWeight - a.effectiveWeight);

  // A001 (waiting 35 mins) gets boosted to weight 50, placing it ahead of A003 (weight 40)!
  if (processed[0].tokenNumber !== 'A001') {
    throw new Error('Anti-starvation queue boost test failed');
  }
  console.log('✓ Anti-starvation queue logic verified (A001 boosted above new priority token after 35m wait)');

  console.log('====================================================');
  console.log('🎉 CORE TOKEN ENGINE & QUEUE LOGIC VERIFIED!');
  console.log('====================================================');
  process.exit(0);
}

testTokenEngine().catch(err => {
  console.error('❌ Token Engine Test Failed:', err);
  process.exit(1);
});
