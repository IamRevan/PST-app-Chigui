const { isValidPassword, validatePasswordMiddleware } = require('../../../src/middleware/validatePassword');

describe('Password policy (compatibilidad middleware)', () => {
  describe('isValidPassword', () => {
    test('rechaza valores no string o vacíos', () => {
      expect(isValidPassword(12345678)).toBe(false);
      expect(isValidPassword(null)).toBe(false);
      expect(isValidPassword(undefined)).toBe(false);
      expect(isValidPassword({})).toBe(false);
      expect(isValidPassword('')).toBe(false);
    });

    test('rechaza contraseñas menores a 12 caracteres', () => {
      expect(isValidPassword('P1!a')).toBe(false);
      expect(isValidPassword('Password123')).toBe(false);
    });

    test('rechaza contraseñas mayores a 72 caracteres', () => {
      expect(isValidPassword('A1!a' + 'a'.repeat(70))).toBe(false);
    });

    test('rechaza contraseñas comunes', () => {
      expect(isValidPassword('contraseña123')).toBe(false);
      expect(isValidPassword('mi contraseña')).toBe(false);
    });

    test('acepta contraseñas largas sin exigir composición artificial', () => {
      expect(isValidPassword('correcto caballo batería grapa')).toBe(true);
      expect(isValidPassword('frase larga y facil de recordar')).toBe(true);
      expect(isValidPassword('P@ssw0rd2026!')).toBe(true);
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

    test('responde 400 cuando la contraseña es débil', () => {
      req.body.password = '12345';
      validatePasswordMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        status: 'error',
        code: 'PASSWORD_CORTA',
      }));
      expect(next).not.toHaveBeenCalled();
    });

    test('llama next() cuando la contraseña cumple la política', () => {
      req.body.password = 'frase larga y facil de recordar';
      validatePasswordMiddleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });
});
