import request from 'supertest';
import app from '../../src/app';

describe('User Routes Validation', () => {
  describe('GET /api/users - pagination', () => {
    it('should accept default pagination params', async () => {
      const response = await request(app).get('/api/users');
      expect(response.status).toBe(200);
    });

    it('should validate page and limit', async () => {
      const response = await request(app).get('/api/users?page=1&limit=10');
      expect(response.status).toBe(200);
    });
  });

  describe('POST /api/users - validation', () => {
    it('should reject invalid email', async () => {
      const response = await request(app)
        .post('/api/users')
        .send({ name: 'Test', email: 'invalid-email' });
      
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should reject empty name', async () => {
      const response = await request(app)
        .post('/api/users')
        .send({ name: '', email: 'test@example.com' });
      
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should validate age range', async () => {
      const response = await request(app)
        .post('/api/users')
        .send({ name: 'Test', email: 'test@example.com', age: 200 });
      
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/users/:id - validation', () => {
    it('should reject invalid UUID', async () => {
      const response = await request(app)
        .put('/api/users/invalid-id')
        .send({ name: 'Updated' });
      
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/users/:id - validation', () => {
    it('should reject invalid UUID', async () => {
      const response = await request(app)
        .delete('/api/users/invalid-id');
      
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });
});