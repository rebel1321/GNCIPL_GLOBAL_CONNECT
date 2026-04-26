import request from 'supertest';
import { describe, expect, test } from '@jest/globals';
import app from '../app.js';

describe('app routes', () => {
  test('returns health information', async () => {
    const response = await request(app).get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe('Server is running successfully');
  });

  test('returns the welcome payload', async () => {
    const response = await request(app).get('/');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.endpoints.auth).toBe('/api/auth');
  });

  test('returns 404 for unknown routes', async () => {
    const response = await request(app).get('/api/unknown-route');

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain('/api/unknown-route');
  });
});