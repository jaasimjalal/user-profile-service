import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';
import { logger } from './utils/logger';

export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
}

const config: DatabaseConfig = {
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
  database: process.env.POSTGRES_DB || 'user_profiles',
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'postgres'
};

export class Database {
  private static instance: Database;
  private pool: Pool;
  private isConnected = false;

  private constructor() {
    this.pool = new Pool({
      ...config,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000
    });

    this.pool.on('connect', () => {
      this.isConnected = true;
      logger.info('Database connected');
    });

    this.pool.on('error', (err) => {
      this.isConnected = false;
      logger.error('Database error', { error: err.message });
    });

    this.pool.on('remove', () => {
      this.isConnected = false;
    });
  }

  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  public async connect(): Promise<void> {
    try {
      const client = await this.pool.connect();
      logger.info('Database connection test successful');
      client.release();
    } catch (error) {
      this.isConnected = false;
      logger.error('Failed to connect to database', { error: String(error) });
      throw error;
    }
  }

  public async query<T extends QueryResultRow = any>(
    text: string,
    params: any[] = []
  ): Promise<QueryResult<T>> {
    const start = Date.now();
    try {
      const result = await this.pool.query<T>(text, params);
      const duration = Date.now() - start;
      logger.debug('Query executed', { text, duration });
      return result;
    } catch (error) {
      logger.error('Query failed', { text, error: String(error) });
      throw error;
    }
  }

  public async transaction<T>(
    callback: (client: PoolClient) => Promise<T>
  ): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Transaction failed', { error: String(error) });
      throw error;
    } finally {
      client.release();
    }
  }

  public async healthCheck(): Promise<boolean> {
    try {
      const result = await this.query('SELECT 1 as ping');
      return result.rows[0].ping === 1;
    } catch (error) {
      return false;
    }
  }

  public async close(): Promise<void> {
    await this.pool.end();
    this.isConnected = false;
    logger.info('Database connection pool closed');
  }

  public getIsConnected(): boolean {
    return this.isConnected;
  }
}

// Initialize database connection on import
export const db = Database.getInstance();

// Connect immediately if not in test mode
if (process.env.NODE_ENV !== 'test') {
  db.connect().catch((error) => {
    logger.error('Failed initial database connection', { error: String(error) });
  });
}