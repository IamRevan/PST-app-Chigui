// Aísla las pruebas del .env del desarrollador: dotenv no debe inyectar valores reales
jest.mock('dotenv', () => ({ config: jest.fn() }));

describe('Config module', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  test('should throw an error when JWT_SECRET is missing or empty', () => {
    delete process.env.JWT_SECRET;
    expect(() => {
      require('../../../src/config/config');
    }).toThrow('JWT_SECRET environment variable is required');

    jest.resetModules();
    process.env.JWT_SECRET = '';
    expect(() => {
      require('../../../src/config/config');
    }).toThrow('JWT_SECRET environment variable is required');
  });

  test('should load config properly when JWT_SECRET is defined', () => {
    process.env.JWT_SECRET = 'test_secret_key_123';
    delete process.env.JWT_EXPIRES_IN;

    const config = require('../../../src/config/config');
    expect(config.jwt.secret).toBe('test_secret_key_123');
    expect(config.jwt.expiresIn).toBe('7d');
  });
});
