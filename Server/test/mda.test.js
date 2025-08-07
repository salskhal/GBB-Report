import request from 'supertest';
import app from '../src/app.js';

describe('MDA Endpoints', () => {
  let adminToken;
  let mdaId;

  beforeAll(async () => {
    // This is a basic test setup - in a real scenario you'd want to:
    // 1. Set up a test database
    // 2. Create test admin user
    // 3. Get authentication token
    // For now, we'll just test that the endpoints exist
  });

  describe('GET /api/admin/mdas', () => {
    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/admin/mdas')
        .expect(401);
      
      expect(response.body.message).toMatch(/token/i);
    });
  });

  describe('POST /api/admin/mdas', () => {
    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/admin/mdas')
        .send({
          name: 'Test MDA',
          reports: [{ title: 'Test Report', url: 'https://example.com' }]
        })
        .expect(401);
      
      expect(response.body.message).toMatch(/token/i);
    });
  });

  describe('PUT /api/admin/mdas/:id', () => {
    it('should require authentication', async () => {
      const response = await request(app)
        .put('/api/admin/mdas/507f1f77bcf86cd799439011')
        .send({
          name: 'Updated MDA'
        })
        .expect(401);
      
      expect(response.body.message).toMatch(/token/i);
    });
  });

  describe('DELETE /api/admin/mdas/:id', () => {
    it('should require authentication', async () => {
      const response = await request(app)
        .delete('/api/admin/mdas/507f1f77bcf86cd799439011')
        .expect(401);
      
      expect(response.body.message).toMatch(/token/i);
    });
  });
});