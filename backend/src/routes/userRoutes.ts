import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { 
  validateRequest, 
  createUserSchema, 
  updateUserSchema, 
  idParamsSchema,
  paginationSchema 
} from '../middleware/validationMiddleware';
import { NotFoundError, ConflictError, HttpError } from '../middleware/errorHandler';
import { db } from '../database';
import { logger } from '../utils/logger';

const router = Router();

interface User {
  id: string;
  name: string;
  email: string;
  age?: number;
  createdAt: string;
  updatedAt: string;
}

interface CreateUserRequest {
  name: string;
  email: string;
  age?: number;
}

interface UpdateUserRequest {
  name?: string;
  email?: string;
  age?: number;
}

interface PaginationQuery {
  page?: number;
  limit?: number;
}

// GET /api/users - Get all users (paginated)
router.get('/', 
  validateRequest(paginationSchema, 'query'),
  async (req: Request<{}, {}, {}, PaginationQuery>, res: Response) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const offset = (page - 1) * limit;

      // Get total count
      const countResult = await db.query('SELECT COUNT(*) FROM users');
      const total = parseInt(countResult.rows[0].count);

      // Get users with pagination
      const result = await db.query<User>('SELECT * FROM users ORDER BY createdAt DESC LIMIT $1 OFFSET $2', [limit, offset]);
      
      const totalPages = Math.ceil(total / limit);

      res.status(200).json({
        data: result.rows,
        pagination: {
          page,
          limit,
          total,
          totalPages
        }
      });
    } catch (error) {
      logger.error('Error fetching users', { error: String(error) });
      throw new HttpError('Failed to fetch users', 500, 'DATABASE_ERROR');
    }
  }
);

// GET /api/users/:id - Get user by ID
router.get('/:id', 
  validateRequest(idParamsSchema, 'params'),
  async (req: Request<{ id: string }>, res: Response) => {
    try {
      const result = await db.query<User>('SELECT * FROM users WHERE id = $1', [req.params.id]);
      
      if (result.rows.length === 0) {
        throw new NotFoundError('User not found');
      }

      res.status(200).json(result.rows[0]);
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      logger.error('Error fetching user', { error: String(error), id: req.params.id });
      throw new HttpError('Failed to fetch user', 500, 'DATABASE_ERROR');
    }
  }
);

// POST /api/users - Create new user
router.post('/', 
  validateRequest(createUserSchema, 'body'),
  async (req: Request<{}, {}, CreateUserRequest>, res: Response) => {
    try {
      const { name, email, age } = req.body;
      const id = uuidv4();
      const now = new Date().toISOString();

      // Check if email already exists
      const existingUser = await db.query('SELECT id FROM users WHERE email = $1', [email]);
      if (existingUser.rows.length > 0) {
        throw new ConflictError('Email already exists');
      }

      // Insert new user
      const result = await db.query<User>(
        'INSERT INTO users (id, name, email, age, "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
        [id, name, email, age || null, now, now]
      );

      res.status(201).json(result.rows[0]);
    } catch (error) {
      if (error instanceof ConflictError) {
        throw error;
      }
      logger.error('Error creating user', { error: String(error), body: req.body });
      throw new HttpError('Failed to create user', 500, 'DATABASE_ERROR');
    }
  }
);

// PUT /api/users/:id - Update user
router.put('/:id', 
  validateRequest(idParamsSchema, 'params'),
  validateRequest(updateUserSchema, 'body'),
  async (req: Request<{ id: string }, {}, UpdateUserRequest>, res: Response) => {
    try {
      const { name, email, age } = req.body;
      const now = new Date().toISOString();

      // Check if user exists
      const existingUser = await db.query('SELECT id FROM users WHERE id = $1', [req.params.id]);
      if (existingUser.rows.length === 0) {
        throw new NotFoundError('User not found');
      }

      // Check if email already exists (if updating email)
      if (email) {
        const emailCheck = await db.query(
          'SELECT id FROM users WHERE email = $1 AND id != $2',
          [email, req.params.id]
        );
        if (emailCheck.rows.length > 0) {
          throw new ConflictError('Email already exists');
        }
      }

      // Build dynamic update query
      const updates: string[] = [];
      const values: any[] = [req.params.id];
      let paramCount = 2;

      if (name !== undefined) {
        updates.push(`name = $${paramCount}`);
        values.push(name);
        paramCount++;
      }
      if (email !== undefined) {
        updates.push(`email = $${paramCount}`);
        values.push(email);
        paramCount++;
      }
      if (age !== undefined) {
        updates.push(`age = $${paramCount}`);
        values.push(age);
        paramCount++;
      }

      if (updates.length === 0) {
        throw new HttpError('No fields to update', 400, 'NO_UPDATES');
      }

      updates.push(`"updatedAt" = $${paramCount}`);
      values.push(now);

      const query = `UPDATE users SET ${updates.join(', ')} WHERE id = $1 RETURNING *`;
      const result = await db.query<User>(query, values);

      if (result.rows.length === 0) {
        throw new NotFoundError('User not found');
      }

      res.status(200).json(result.rows[0]);
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ConflictError || error instanceof HttpError) {
        throw error;
      }
      logger.error('Error updating user', { error: String(error), id: req.params.id, body: req.body });
      throw new HttpError('Failed to update user', 500, 'DATABASE_ERROR');
    }
  }
);

// DELETE /api/users/:id - Delete user
router.delete('/:id', 
  validateRequest(idParamsSchema, 'params'),
  async (req: Request<{ id: string }>, res: Response) => {
    try {
      const result = await db.query('DELETE FROM users WHERE id = $1 RETURNING id', [req.params.id]);
      
      if (result.rows.length === 0) {
        throw new NotFoundError('User not found');
      }

      res.status(200).json({ message: 'User deleted successfully', id: req.params.id });
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      logger.error('Error deleting user', { error: String(error), id: req.params.id });
      throw new HttpError('Failed to delete user', 500, 'DATABASE_ERROR');
    }
  }
);

export default router;