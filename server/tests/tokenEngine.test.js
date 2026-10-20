import {
  formatTokenNumber,
  getPriorityWeight,
  calculateWaitTime,
  getSortedQueue
} from '../src/services/tokenEngine.js';

describe('Token Engine Algorithms & Utilities', () => {
  describe('formatTokenNumber', () => {
    it('should format sequence numbers with prefix and 3-digit padding', () => {
      expect(formatTokenNumber('A', 1)).toBe('A-001');
      expect(formatTokenNumber('MED', 42)).toBe('MED-042');
      expect(formatTokenNumber('C', 999)).toBe('C-999');
      expect(formatTokenNumber('B', 1000)).toBe('B-1000');
    });

    it('should default to T prefix when prefix is null or undefined', () => {
      expect(formatTokenNumber(null, 5)).toBe('T-005');
      expect(formatTokenNumber(undefined, 7)).toBe('T-007');
    });
  });

  describe('getPriorityWeight', () => {
    it('should return correct numeric priority weights', () => {
      expect(getPriorityWeight('EMERGENCY')).toBe(100);
      expect(getPriorityWeight('VIP')).toBe(80);
      expect(getPriorityWeight('ELDERLY')).toBe(60);
      expect(getPriorityWeight('PREGNANT')).toBe(60);
      expect(getPriorityWeight('DISABLED')).toBe(60);
      expect(getPriorityWeight('APPOINTMENT')).toBe(40);
      expect(getPriorityWeight('NORMAL')).toBe(10);
    });

    it('should return 10 for unknown priority levels', () => {
      expect(getPriorityWeight('UNKNOWN')).toBe(10);
      expect(getPriorityWeight(null)).toBe(10);
    });
  });

  describe('getSortedQueue & Anti-starvation Logic', () => {
    it('should prioritize higher priority tokens over lower priority tokens', () => {
      const now = new Date();
      const tokens = [
        { _id: '1', tokenNumber: 'A001', priority: 'NORMAL', priorityWeight: 10, createdAt: new Date(now - 5 * 60000) },
        { _id: '2', tokenNumber: 'VIP001', priority: 'VIP', priorityWeight: 80, createdAt: new Date(now - 2 * 60000) },
        { _id: '3', tokenNumber: 'E001', priority: 'EMERGENCY', priorityWeight: 100, createdAt: new Date(now - 1 * 60000) }
      ];

      const sorted = getSortedQueue(tokens);
      expect(sorted[0].tokenNumber).toBe('E001');
      expect(sorted[1].tokenNumber).toBe('VIP001');
      expect(sorted[2].tokenNumber).toBe('A001');
    });

    it('should apply anti-starvation boost for NORMAL tokens waiting > 30 minutes', () => {
      const now = new Date();
      const tokens = [
        // NORMAL token waiting 35 minutes -> effective weight: 10 + 50 = 60
        { _id: '1', tokenNumber: 'N001', priority: 'NORMAL', priorityWeight: 10, createdAt: new Date(now - 35 * 60000) },
        // APPOINTMENT token waiting 5 minutes -> effective weight: 40
        { _id: '2', tokenNumber: 'APT001', priority: 'APPOINTMENT', priorityWeight: 40, createdAt: new Date(now - 5 * 60000) }
      ];

      const sorted = getSortedQueue(tokens);
      // N001 should be boosted ahead of APT001 due to anti-starvation boost
      expect(sorted[0].tokenNumber).toBe('N001');
      expect(sorted[1].tokenNumber).toBe('APT001');
    });

    it('should sort FIFO when priority weights are equal', () => {
      const now = new Date();
      const tokens = [
        { _id: '2', tokenNumber: 'B002', priority: 'NORMAL', priorityWeight: 10, createdAt: new Date(now - 5 * 60000) },
        { _id: '1', tokenNumber: 'B001', priority: 'NORMAL', priorityWeight: 10, createdAt: new Date(now - 10 * 60000) }
      ];

      const sorted = getSortedQueue(tokens);
      expect(sorted[0].tokenNumber).toBe('B001');
      expect(sorted[1].tokenNumber).toBe('B002');
    });
  });
});
