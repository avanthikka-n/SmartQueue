import request from 'supertest';
import app from '../src/app.js';

describe('API Route Mounts & Error Handling Suite', () => {
  it('GET /api/health returns 200 with complete system & security status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.app).toMatch(/SmartQueue/i);
    expect(res.body.security).toBeDefined();
    expect(res.body.security.helmet).toBe(true);
    expect(res.body.security.rateLimiting).toBe(true);
    expect(res.body.security.mongoSanitize).toBe(true);
    expect(res.body.security.xssSanitize).toBe(true);
  });

  it('GET /api/auth/me should return 401 Unauthorized when missing token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/Not authorized/i);
  });

  it('POST /api/auth/login with invalid payload triggers 422 validation error', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'bad-email', password: '' });
    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
    expect(res.body.errors).toBeDefined();
  });

  it('POST /api/tokens with invalid payload triggers 422 validation error', async () => {
    const res = await request(app)
      .post('/api/tokens')
      .send({ serviceId: 'not-an-id', customerName: '' });
    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
  });

  it('POST /api/feedback with missing rating triggers 422 validation error', async () => {
    const res = await request(app)
      .post('/api/feedback')
      .send({ tokenId: '507f1f77bcf86cd799439011' });
    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
  });

  it('Unknown routes trigger structured 404 response', async () => {
    const res = await request(app).get('/api/unknown/endpoint/route');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/API Endpoint Not Found/i);
  });
});
