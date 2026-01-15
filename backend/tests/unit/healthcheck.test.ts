import { logger } from '../../src/utils/logger';

describe('Health Check Utils', () => {
  describe('Logger', () => {
    it('should have error level defined', () => {
      expect(logger.level).toBeDefined();
    });

    it('should have required methods', () => {
      expect(logger.info).toBeDefined();
      expect(logger.error).toBeDefined();
      expect(logger.warn).toBeDefined();
      expect(logger.debug).toBeDefined();
    });
  });
});