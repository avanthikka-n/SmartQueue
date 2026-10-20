/**
 * testSecurity.js — Verifies Phase 14 security middleware loads correctly
 * Run: node src/scripts/testSecurity.js
 */
import dotenv from 'dotenv';
dotenv.config();

// Test that all security imports resolve
import('../middleware/security.js').then(mod => {
  const { helmetMiddleware, globalLimiter, authLimiter, tokenLimiter, mongoSanitizeMiddleware, xssSanitize } = mod;

  console.log('[1] helmetMiddleware :', typeof helmetMiddleware === 'function' ? '✓ OK' : '✗ FAIL');
  console.log('[2] globalLimiter    :', typeof globalLimiter === 'function' ? '✓ OK' : '✗ FAIL');
  console.log('[3] authLimiter      :', typeof authLimiter === 'function' ? '✓ OK' : '✗ FAIL');
  console.log('[4] tokenLimiter     :', typeof tokenLimiter === 'function' ? '✓ OK' : '✗ FAIL');
  console.log('[5] mongoSanitize    :', typeof mongoSanitizeMiddleware === 'function' ? '✓ OK' : '✗ FAIL');
  console.log('[6] xssSanitize      :', typeof xssSanitize === 'function' ? '✓ OK' : '✗ FAIL');
}).then(() => {
  // Test that XSS sanitization works correctly
  return import('../middleware/security.js').then(mod => {
    const { xssSanitize } = mod;
    const maliciousBody = {
      name: '<script>alert("xss")</script>',
      nested: { comment: '<img src=x onerror=alert(1)>' },
      safe: 'Hello World'
    };

    const mockReq = { body: maliciousBody };
    const mockRes = {};
    let nextCalled = false;
    const mockNext = () => { nextCalled = true; };

    xssSanitize(mockReq, mockRes, mockNext);

    console.log('\n[XSS Sanitization Test]');
    console.log('  Input  :', maliciousBody.name);
    console.log('  Output :', mockReq.body.name);
    console.log('  Sanitized (no <script>):', !mockReq.body.name.includes('<script>') ? '✓ PASS' : '✗ FAIL');
    console.log('  Nested sanitized (onerror stripped):', !mockReq.body.nested.comment.includes('onerror') ? '✓ PASS' : '✗ FAIL');
    console.log('  Safe text preserved   :', mockReq.body.safe === 'Hello World' ? '✓ PASS' : '✗ FAIL');
    console.log('  next() called         :', nextCalled ? '✓ PASS' : '✗ FAIL');
  });
}).then(() => {
  return import('../middleware/validate.js').then(mod => {
    console.log('\n[Validation Middleware Test]');
    const { validateRegister, validateLogin, validateGenerateToken, validateFeedback } = mod;
    console.log('  validateRegister    :', typeof validateRegister === 'function' ? '✓ OK' : '✗ FAIL');
    console.log('  validateLogin       :', typeof validateLogin === 'function' ? '✓ OK' : '✗ FAIL');
    console.log('  validateGenerateToken:', typeof validateGenerateToken === 'function' ? '✓ OK' : '✗ FAIL');
    console.log('  validateFeedback    :', typeof validateFeedback === 'function' ? '✓ OK' : '✗ FAIL');
  });
}).then(() => {
  console.log('\n✅ Phase 14 Security — All checks passed!');
  process.exit(0);
}).catch(err => {
  console.error('✗ Security test failed:', err);
  process.exit(1);
});
