import request from 'supertest';
import app from '../src/app.js';

describe('Health & Security Endpoints', () => {
  it('GET /api/health should return 200 with status ok and security flags', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.security).toBeDefined();
    expect(res.body.security.helmet).toBe(true);
  });

  it('GET /api/nonexistent-route should return 404 API Endpoint Not Found', async () => {
    const res = await request(app).get('/api/nonexistent-route');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});
