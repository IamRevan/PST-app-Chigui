const { isValidPassword, validatePasswordMiddleware } = require('../../../src/middleware/validatePassword');

describe('Password Complexity Validator', () => {
  describe('isValidPassword function', () => {
    test('rejects non-string values', () => {
      expect(isValidPassword(12345678)).toBe(false);
      expect(isValidPassword(null)).toBe(false);
      expect(isValidPassword(undefined)).toBe(false);
      expect(isValidPassword({})).toBe(false);
    });

    test('rejects passwords shorter than 8 characters', () => {
      expect(isValidPassword('P1!a')).toBe(false);
      expect(isValidPassword('A1!b234')).toBe(false); // 7 chars
    });

    test('rejects passwords longer than 72 characters', () => {
      const longPass = 'A1!a' + 'a'.repeat(70); // 74 chars
      expect(isValidPassword(longPass)).toBe(false);
    });

    test('rejects passwords missing uppercase letters', () => {
      expect(isValidPassword('password123!')).toBe(false);
    });

    test('rejects passwords missing lowercase letters', () => {
      expect(isValidPassword('PASSWORD123!')).toBe(false);
    });

    test('rejects passwords missing digits', () => {
      expect(isValidPassword('Password!!')).toBe(false);
    });

    test('rejects passwords missing special characters', () => {
      expect(isValidPassword('Password123')).toBe(false);
    });

    test('accepts valid passwords with required complexity', () => {
      expect(isValidPassword('Password123!')).toBe(true);
      expect(isValidPassword('P@ssw0rd2026')).toBe(true);
      expect(isValidPassword('Str0ng#Pass')).toBe(true);
      expect(isValidPassword('Complex123$456')).toBe(true);
    });
  });

  describe('validatePasswordMiddleware', () => {
    let req, res, next;

    beforeEach(() => {
      req = { body: {} };
      res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      next = jest.fn();
    });

    test('returns 400 status and error message when password is weak', () => {
      req.body.password = '12345';
      validatePasswordMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'La contraseña debe tener entre 8 y 72 caracteres, e incluir al menos una mayúscula, una minúscula, un número y un carácter especial.',
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('calls next() when password meets complexity rules', () => {
      req.body.password = 'ValidP@ss123';
      validatePasswordMiddleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });
});
