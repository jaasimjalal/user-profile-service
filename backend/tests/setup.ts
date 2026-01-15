import { config } from 'dotenv';
import { db } from '../src/database';

// Load test environment variables
config({ path: '.env.test' });

// Setup test database before all tests
beforeAll(async () => {
  try {
    await db.connect();
    console.log('Test database connected');
  } catch (error) {
    console.error('Failed to connect to test database:', error);
    throw error;
  }
});

// Cleanup after all tests
afterAll(async () => {
  await db.close();
  console.log('Test database connection closed');
});