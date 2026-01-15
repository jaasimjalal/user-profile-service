import request from 'supertest';
import app from '../../src/app';
import { db } from '../../src/database';

describe('User API Integration Tests', () => {
  let testUser = {
    name: 'Test User',
    email: 'test@example.com',
    age: 25
  };

  beforeAll(async () => {
    // Setup database for testing
    try {
      await db.query('DROP TABLE IF EXISTS users CASCADE');
      await db.query(`
        CREATE TABLE users (
          id UUID PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          age INT,
          "createdAt" TIMESTAMP NOT NULL,
          "updatedAt" TIMESTAMP NOT NULL
        )
      `);
    } catch (error) {
      console.error('Database setup failed:', error);
      throw error;
    }
  });

  afterAll(async () => {
    await db.close();
  });

  beforeEach(async () => {
    // Clear users before each test
    await db.query('DELETE FROM users');
  });

  describe('POST /api/users', () => {
    it('should create a new user', async () => {
      const response = await request(app)
        .post('/api/users')
        .send(testUser)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe(testUser.name);
      expect(response.body.email).toBe(testUser.email);
      expect(response.body.age).toBe(testUser.age);
    });

    it('should fail with invalid data', async () => {
      const response = await request(app)
        .post('/api/users')
        .send({ name: '', email: 'invalid' })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should fail with duplicate email', async () => {
      await request(app).post('/api/users').send(testUser);
      
      const response = await request(app)
        .post('/api/users')
        .send(testUser)
        .expect(409);

      expect(response.body.error).toContain('already exists');
    });
  });

  describe('GET /api/users', () => {
    beforeEach(async () => {
      // Create multiple users
      for (let i = 1; i <= 5; i++) {
        await db.query(
          'INSERT INTO users (id, name, email, age, "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, $5, $6)',
          [
            `123e4567-e89b-12d3-a456-42661417400${i}`,
            `User ${i}`,
            `user${i}@example.com`,
            20 + i,
            new Date().toISOString(),
            new Date().toISOString()
          ]
        );
      }
    });

    it('should return all users with pagination', async () => {
      const response = await request(app)
        .get('/api/users?page=1&limit=10')
        .expect(200);

      expect(response.body.data).toHaveLength(5);
      expect(response.body.pagination.total).toBe(5);
      expect(response.body.pagination.totalPages).toBe(1);
    });

    it('should handle pagination', async () => {
      const response = await request(app)
        .get('/api/users?page=1&limit=2')
        .expect(200);

      expect(response.body.data).toHaveLength(2);
      expect(response.body.pagination.total).toBe(5);
      expect(response.body.pagination.totalPages).toBe(3);
    });
  });

  describe('GET /api/users/:id', () => {
    let userId: string;

    beforeEach(async () => {
      const result = await db.query(
        'INSERT INTO users (id, name, email, age, "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
        [
          '123e4567-e89b-12d3-a456-426614174000',
          testUser.name,
          testUser.email,
          testUser.age,
          new Date().toISOString(),
          new Date().toISOString()
        ]
      );
      userId = result.rows[0].id;
    });

    it('should return user by ID', async () => {
      const response = await request(app)
        .get(`/api/users/${userId}`)
        .expect(200);

      expect(response.body.id).toBe(userId);
      expect(response.body.name).toBe(testUser.name);
    });

    it('should return 404 for non-existent user', async () => {
      const response = await request(app)
        .get('/api/users/123e4567-e89b-12d3-a456-426614174000')
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should fail with invalid ID format', async () => {
      const response = await request(app)
        .get('/api/users/invalid-id')
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/users/:id', () => {
    let userId: string;

    beforeEach(async () => {
      const result = await db.query(
        'INSERT INTO users (id, name, email, age, "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
        [
          '123e4567-e89b-12d3-a456-426614174000',
          testUser.name,
          testUser.email,
          testUser.age,
          new Date().toISOString(),
          new Date().toISOString()
        ]
      );
      userId = result.rows[0].id;
    });

    it('should update user', async () => {
      const response = await request(app)
        .put(`/api/users/${userId}`)
        .send({ name: 'Updated Name', age: 30 })
        .expect(200);

      expect(response.body.name).toBe('Updated Name');
      expect(response.body.age).toBe(30);
    });

    it('should fail with invalid email', async () => {
      const response = await request(app)
        .put(`/api/users/${userId}`)
        .send({ email: 'invalid-email' })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/users/:id', () => {
    let userId: string;

    beforeEach(async () => {
      const result = await db.query(
        'INSERT INTO users (id, name, email, age, "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
        [
          '123e4567-e89b-12d3-a456-426614174000',
          testUser.name,
          testUser.email,
          testUser.age,
          new Date().toISOString(),
          new Date().toISOString()
        ]
      );
      userId = result.rows[0].id;
    });

    it('should delete user', async () => {
      const response = await request(app)
        .delete(`/api/users/${userId}`)
        .expect(200);

      expect(response.body.message).toBe('User deleted successfully');
      expect(response.body.id).toBe(userId);
    });

    it('should return 404 for non-existent user', async () => {
      const response = await request(app)
        .delete('/api/users/123e4567-e89b-12d3-a456-426614174001')
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });
});