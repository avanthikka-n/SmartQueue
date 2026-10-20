import {
  helmetMiddleware,
  globalLimiter,
  authLimiter,
  tokenLimiter,
  mongoSanitizeMiddleware,
  xssSanitize
} from '../src/middleware/security.js';
import {
  validateRegister,
  validateLogin,
  validateGenerateToken,
  validateFeedback,
  validateOrganization,
  validateDepartment,
  validateService,
  validateAppointment
} from '../src/middleware/validate.js';

describe('Phase 14 Security & Validation Suite', () => {
  describe('Security Middleware Export Integrity', () => {
    it('should export all required security middlewares', () => {
      expect(typeof helmetMiddleware).toBe('function');
      expect(typeof globalLimiter).toBe('function');
      expect(typeof authLimiter).toBe('function');
      expect(typeof tokenLimiter).toBe('function');
      expect(typeof mongoSanitizeMiddleware).toBe('function');
      expect(typeof xssSanitize).toBe('function');
    });
  });

  describe('XSS Sanitization Middleware', () => {
    it('should sanitize HTML tags and script injections in request body', () => {
      const req = {
        body: {
          name: '<script>alert("hacked")</script>John Doe',
          comment: '<b onmouseover=alert("xss")>Great service!</b>',
          safeField: 'Plain clean string 123'
        }
      };
      const res = {};
      let nextCalled = false;
      xssSanitize(req, res, () => { nextCalled = true; });

      expect(nextCalled).toBe(true);
      expect(req.body.name).not.toContain('<script>');
      expect(req.body.comment).not.toContain('onmouseover');
      expect(req.body.safeField).toBe('Plain clean string 123');
    });

    it('should recursively sanitize nested objects and arrays', () => {
      const req = {
        body: {
          profile: {
            bio: '<img src=x onerror=alert(1)>'
          },
          tags: ['<script>x()</script>urgent', 'normal']
        }
      };
      xssSanitize(req, {}, () => {});
      expect(req.body.profile.bio).not.toContain('onerror');
      expect(req.body.tags[0]).not.toContain('<script>');
      expect(req.body.tags[1]).toBe('normal');
    });
  });

  describe('Input Validation Middleware', () => {
    const createMockRes = () => {
      const res = {
        statusCode: null,
        data: null,
        status(code) {
          this.statusCode = code;
          return this;
        },
        json(payload) {
          this.data = payload;
          return this;
        }
      };
      return res;
    };

    it('validateRegister should reject missing name or short password', () => {
      const req = { body: { name: 'A', email: 'notanemail', password: '123' } };
      const res = createMockRes();
      let nextCalled = false;
      validateRegister(req, res, () => { nextCalled = true; });

      expect(nextCalled).toBe(false);
      expect(res.statusCode).toBe(422);
      expect(res.data.success).toBe(false);
      expect(res.data.errors).toBeDefined();
      expect(res.data.errors.length).toBeGreaterThan(0);
    });

    it('validateRegister should accept valid user data', () => {
      const req = { body: { name: 'Alice Smith', email: 'alice@example.com', password: 'password123', role: 'CUSTOMER' } };
      const res = createMockRes();
      let nextCalled = false;
      validateRegister(req, res, () => { nextCalled = true; });

      expect(nextCalled).toBe(true);
    });

    it('validateLogin should reject empty credentials', () => {
      const req = { body: { email: '', password: '' } };
      const res = createMockRes();
      let nextCalled = false;
      validateLogin(req, res, () => { nextCalled = true; });

      expect(nextCalled).toBe(false);
      expect(res.statusCode).toBe(422);
    });

    it('validateGenerateToken should reject invalid serviceId and empty customerName', () => {
      const req = { body: { serviceId: 'invalid-id', customerName: '' } };
      const res = createMockRes();
      let nextCalled = false;
      validateGenerateToken(req, res, () => { nextCalled = true; });

      expect(nextCalled).toBe(false);
      expect(res.statusCode).toBe(422);
    });

    it('validateFeedback should reject out-of-range rating', () => {
      const req = { body: { tokenId: '507f1f77bcf86cd799439011', rating: 10 } };
      const res = createMockRes();
      let nextCalled = false;
      validateFeedback(req, res, () => { nextCalled = true; });

      expect(nextCalled).toBe(false);
      expect(res.statusCode).toBe(422);
    });

    it('validateFeedback should pass with rating between 1 and 5', () => {
      const req = { body: { tokenId: '507f1f77bcf86cd799439011', rating: 5 } };
      const res = createMockRes();
      let nextCalled = false;
      validateFeedback(req, res, () => { nextCalled = true; });

      expect(nextCalled).toBe(true);
    });
  });
});
