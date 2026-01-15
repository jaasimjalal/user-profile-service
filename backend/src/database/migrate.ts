import { db } from '../database';
import { logger } from '../utils/logger';

async function migrate() {
  try {
    await db.connect();
    
    // Create users table
    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        age INT,
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Create index on email for faster lookups
    await db.query('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)');
    
    // Create index on createdAt for sorting
    await db.query('CREATE INDEX IF NOT EXISTS idx_users_createdAt ON users(\"createdAt\")');
    
    logger.info('Database migration completed successfully');
    
    await db.close();
    process.exit(0);
  } catch (error) {
    logger.error('Migration failed', { error: String(error) });
    process.exit(1);
  }
}

migrate();