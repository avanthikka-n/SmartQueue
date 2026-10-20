import bcrypt from 'bcryptjs';
import User from '../src/models/User.js';
import Organization from '../src/models/Organization.js';
import Facility from '../src/models/Facility.js';
import Department from '../src/models/Department.js';
import Service from '../src/models/Service.js';
import Counter from '../src/models/Counter.js';
import Token from '../src/models/Token.js';
import TokenSequence from '../src/models/TokenSequence.js';
import Appointment from '../src/models/Appointment.js';
import Feedback from '../src/models/Feedback.js';
import QueueEvent from '../src/models/QueueEvent.js';

describe('Mongoose Models & Schema Architecture Suite', () => {
  describe('Model Instantiation & Defaults', () => {
    it('User model should have role default to CUSTOMER and isActive true', () => {
      const user = new User({
        name: 'Test Customer',
        email: 'customer@test.com',
        password: 'plainpassword'
      });
      expect(user.role).toBe('CUSTOMER');
      expect(user.isActive).toBe(true);
      expect(typeof user.comparePassword).toBe('function');
    });

    it('Organization model should have default settings', () => {
      const org = new Organization({
        name: 'General Hospital',
        type: 'hospital'
      });
      expect(org.isActive).toBe(true);
      expect(org.settings.tokenResetFrequency).toBe('daily');
      expect(org.settings.allowAppointments).toBe(true);
      expect(org.settings.maxTokensPerCustomerDay).toBe(5);
      expect(org.settings.noShowTimeoutSeconds).toBe(300);
    });

    it('Facility model should instantiate with default values', () => {
      const f = new Facility({
        organizationId: '507f1f77bcf86cd799439011',
        name: 'Downtown Medical Center'
      });
      expect(f.isActive).toBe(true);
      expect(f.type).toBe('other');
      expect(f.workingHours.open).toBe('08:00');
    });

    it('Service model should default estimatedServiceTime to 10', () => {
      const s = new Service({
        organizationId: '507f1f77bcf86cd799439011',
        departmentId: '507f1f77bcf86cd799439012',
        name: 'General Consultation',
        prefix: 'G'
      });
      expect(s.estimatedServiceTime).toBe(10);
      expect(s.isActive).toBe(true);
      expect(s.prefix).toBe('G');
    });

    it('Counter model should default status to offline', () => {
      const c = new Counter({
        organizationId: '507f1f77bcf86cd799439011',
        departmentId: '507f1f77bcf86cd799439012',
        counterNumber: 1,
        name: 'Station 1'
      });
      expect(c.status).toBe('offline');
      expect(c.isActive).toBe(true);
    });

    it('Token model should default status to WAITING and priority to NORMAL', () => {
      const t = new Token({
        organizationId: '507f1f77bcf86cd799439011',
        departmentId: '507f1f77bcf86cd799439012',
        serviceId: '507f1f77bcf86cd799439013',
        tokenNumber: 'G001',
        tokenSequence: 1,
        customerName: 'John Smith',
        customerPhone: '+1 555-0100'
      });
      expect(t.status).toBe('WAITING');
      expect(t.priority).toBe('NORMAL');
      expect(t.priorityWeight).toBe(0);
    });

    it('Appointment model should default status to BOOKED', () => {
      const a = new Appointment({
        organizationId: '507f1f77bcf86cd799439011',
        departmentId: '507f1f77bcf86cd799439012',
        serviceId: '507f1f77bcf86cd799439013',
        customerName: 'Jane Doe',
        scheduledAt: new Date()
      });
      expect(a.status).toBe('BOOKED');
    });

    it('Feedback model should validate rating field', () => {
      const f = new Feedback({
        organizationId: '507f1f77bcf86cd799439011',
        departmentId: '507f1f77bcf86cd799439012',
        serviceId: '507f1f77bcf86cd799439013',
        tokenId: '507f1f77bcf86cd799439014',
        rating: 5,
        comment: 'Excellent!'
      });
      expect(f.rating).toBe(5);
      expect(f.comment).toBe('Excellent!');
    });

    it('QueueEvent model should record token action audit log', () => {
      const event = new QueueEvent({
        organizationId: '507f1f77bcf86cd799439011',
        departmentId: '507f1f77bcf86cd799439012',
        serviceId: '507f1f77bcf86cd799439013',
        tokenId: '507f1f77bcf86cd799439014',
        action: 'token_created',
        details: { tokenNumber: 'G001' }
      });
      expect(event.action).toBe('token_created');
      expect(event.details.tokenNumber).toBe('G001');
    });
  });

  describe('User Password Hashing & Comparison', () => {
    it('comparePassword should correctly verify matching and non-matching passwords', async () => {
      const plainPassword = 'securePassword2026!';
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(plainPassword, salt);

      const user = new User({
        name: 'Doctor Who',
        email: 'doc@tardis.com',
        password: hashedPassword
      });

      const isMatch = await user.comparePassword(plainPassword);
      const isBadMatch = await user.comparePassword('wrongSecret');

      expect(isMatch).toBe(true);
      expect(isBadMatch).toBe(false);
    });
  });
});
