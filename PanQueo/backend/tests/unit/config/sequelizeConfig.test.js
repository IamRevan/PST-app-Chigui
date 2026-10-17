// Aísla las pruebas del .env del desarrollador: dotenv no debe inyectar valores reales
jest.mock('dotenv', () => ({ config: jest.fn() }));

describe('Database Configuration Security', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    // Evita filtrar el dialecto SQLite definido por otras suites del mismo worker
    delete process.env.DB_DIALECT;
    delete process.env.DB_STORAGE;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('sequelizeConfig.js', () => {
    test('should not fall back to "postgres" for password when DB_PASSWORD is unset', () => {
      delete process.env.DB_PASSWORD;

      const config = require('../../../src/config/sequelizeConfig');

      expect(config.development.password).toBeUndefined();
      expect(config.test.password).toBeUndefined();
      expect(config.production.password).toBeUndefined();
      expect(config.development.password).not.toBe('postgres');
      expect(config.test.password).not.toBe('postgres');
    });

    test('should use process.env.DB_PASSWORD when set', () => {
      process.env.DB_PASSWORD = 'secret_password_123';

      const config = require('../../../src/config/sequelizeConfig');

      expect(config.development.password).toBe('secret_password_123');
      expect(config.test.password).toBe('secret_password_123');
      expect(config.production.password).toBe('secret_password_123');
    });
  });

  describe('database.js', () => {
    test('should not fall back to "postgres" for password when DB_PASSWORD is unset', () => {
      delete process.env.DB_PASSWORD;

      const sequelize = require('../../../src/config/database');

      expect(sequelize.config.password).not.toBe('postgres');
      expect(sequelize.options.password).not.toBe('postgres');
    });

    test('should use process.env.DB_PASSWORD when set', () => {
      process.env.DB_PASSWORD = 'secret_password_123';

      const sequelize = require('../../../src/config/database');

      expect(sequelize.config.password).toBe('secret_password_123');
    });
  });
});
