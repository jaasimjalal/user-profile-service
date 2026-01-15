import { HttpError, NotFoundError, ValidationError, ConflictError } from '../../src/middleware/errorHandler';

describe('Error Handling', () => {
  describe('HttpError', () => {
    it('should create an HTTP error with default values', () => {
      const error = new HttpError('Test error');
      
      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(500);
      expect(error.status).toBe('error');
      expect(error.code).toBeUndefined();
    });

    it('should create an HTTP error with custom status code', () => {
      const error = new HttpError('Not found', 404, 'NOT_FOUND');
      
      expect(error.message).toBe('Not found');
      expect(error.statusCode).toBe(404);
      expect(error.status).toBe('fail');
      expect(error.code).toBe('NOT_FOUND');
    });
  });

  describe('NotFoundError', () => {
    it('should create a 404 error', () => {
      const error = new NotFoundError('User not found');
      
      expect(error.message).toBe('User not found');
      expect(error.statusCode).toBe(404);
      expect(error.status).toBe('fail');
      expect(error.code).toBe('NOT_FOUND');
    });
  });

  describe('ValidationError', () => {
    it('should create a 400 validation error', () => {
      const error = new ValidationError('Invalid data');
      
      expect(error.message).toBe('Invalid data');
      expect(error.statusCode).toBe(400);
      expect(error.status).toBe('fail');
      expect(error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('ConflictError', () => {
    it('should create a 409 conflict error', () => {
      const error = new ConflictError('Resource already exists');
      
      expect(error.message).toBe('Resource already exists');
      expect(error.statusCode).toBe(409);
      expect(error.status).toBe('fail');
      expect(error.code).toBe('CONFLICT');
    });
  });
});