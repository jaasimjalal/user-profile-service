import { v4 as uuidv4 } from 'uuid';
import { db } from '../database';
import { logger } from '../utils/logger';

async function seed() {
  try {
    await db.connect();
    
    // Check if data exists
    const countResult = await db.query('SELECT COUNT(*) FROM users');
    if (parseInt(countResult.rows[0].count) > 0) {
      logger.info('Database already seeded');
      await db.close();
      process.exit(0);
    }

    // Create sample users
    const sampleUsers = [
      {
        id: uuidv4(),
        name: 'Alice Johnson',
        email: 'alice.johnson@example.com',
        age: 28,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: uuidv4(),
        name: 'Bob Smith',
        email: 'bob.smith@example.com',
        age: 35,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: uuidv4(),
        name: 'Carol Williams',
        email: 'carol.williams@example.com',
        age: 42,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    for (const user of sampleUsers) {
      await db.query(
        'INSERT INTO users (id, name, email, age, "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, $5, $6)',
        [user.id, user.name, user.email, user.age, user.createdAt, user.updatedAt]
      );
    }

    logger.info(`Seeded ${sampleUsers.length} sample users`);
    
    await db.close();
    process.exit(0);
  } catch (error) {
    logger.error('Seeding failed', { error: String(error) });
    process.exit(1);
  }
}

seed();