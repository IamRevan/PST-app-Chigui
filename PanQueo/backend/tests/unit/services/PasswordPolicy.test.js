process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret';
process.env.PASSWORD_BREACH_CHECK = 'on';

const {
  evaluarPolitica,
  estaComprometida,
  validarPassword,
  MENSAJES,
} = require('../../../src/services/PasswordPolicy');

const sha1 = (texto) => require('crypto').createHash('sha1').update(texto).digest('hex').toUpperCase();

describe('PasswordPolicy', () => {
  const fetchOriginal = global.fetch;

  afterEach(() => {
    global.fetch = fetchOriginal;
  });

  describe('evaluarPolitica', () => {
    test('exige una contraseña de tipo string', () => {
      expect(evaluarPolitica(null).codigo).toBe('PASSWORD_REQUERIDA');
      expect(evaluarPolitica('').codigo).toBe('PASSWORD_REQUERIDA');
      expect(evaluarPolitica(123456789012).codigo).toBe('PASSWORD_REQUERIDA');
    });

    test('rechaza menos de 12 caracteres', () => {
      const resultado = evaluarPolitica('corta123');
      expect(resultado.ok).toBe(false);
      expect(resultado.codigo).toBe('PASSWORD_CORTA');
      expect(resultado.message).toBe(MENSAJES.corta);
    });

    test('rechaza más de 72 caracteres (límite de bcrypt)', () => {
      const resultado = evaluarPolitica('a'.repeat(73));
      expect(resultado.ok).toBe(false);
      expect(resultado.codigo).toBe('PASSWORD_LARGA');
    });

    test('rechaza contraseñas comunes', () => {
      expect(evaluarPolitica('contraseña123').codigo).toBe('PASSWORD_COMUN');
      expect(evaluarPolitica('mi contraseña').codigo).toBe('PASSWORD_COMUN');
    });

    test('rechaza contraseñas que contienen el correo o el nombre', () => {
      expect(evaluarPolitica('ana-la-repostera', { email: 'ana@example.com' }).codigo).toBe('PASSWORD_PERSONAL');
      expect(evaluarPolitica('soy-ana-y-hago-tortas', { nombre: 'Ana' }).codigo).toBe('PASSWORD_PERSONAL');
    });

    test('acepta frases largas sin reglas de composición', () => {
      expect(evaluarPolitica('correcto caballo batería grapa').ok).toBe(true);
      expect(evaluarPolitica('mi torta favorita es de chocolate').ok).toBe(true);
    });
  });

  describe('estaComprometida (HIBP k-anonymity)', () => {
    test('detecta una contraseña filtrada usando solo el prefijo SHA-1', async () => {
      const password = 'frase filtrada segura';
      const hash = sha1(password);
      const prefijo = hash.slice(0, 5);
      const sufijo = hash.slice(5);

      let urlConsultada = null;
      global.fetch = jest.fn(async (url) => {
        urlConsultada = url;
        return {
          ok: true,
          text: async () => `0000000000000000000000000000000000A:1\r\n${sufijo}:42\r\n`,
        };
      });

      await expect(estaComprometida(password)).resolves.toBe(true);
      expect(urlConsultada).toBe(`https://api.pwnedpasswords.com/range/${prefijo}`);
      expect(urlConsultada).not.toContain(sufijo);
    });

    test('devuelve false cuando no aparece en la lista', async () => {
      global.fetch = jest.fn(async () => ({
        ok: true,
        text: async () => '0000000000000000000000000000000000A:1\r\n',
      }));

      await expect(estaComprometida('otra frase distinta')).resolves.toBe(false);
    });

    test('fail-open si HIBP no responde', async () => {
      global.fetch = jest.fn(async () => {
        throw new Error('network down');
      });

      await expect(estaComprometida('frase cualquiera larga')).resolves.toBeNull();
      await expect(validarPassword('frase cualquiera larga')).resolves.toEqual({ ok: true });
    });
  });

  describe('validarPassword', () => {
    test('no consulta HIBP si la validación local falla', async () => {
      global.fetch = jest.fn();
      const resultado = await validarPassword('corta');

      expect(resultado.ok).toBe(false);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    test('rechaza la contraseña si está comprometida', async () => {
      const password = 'frase comprometida';
      const hash = sha1(password);

      global.fetch = jest.fn(async () => ({
        ok: true,
        text: async () => `${hash.slice(5)}:10\r\n`,
      }));

      const resultado = await validarPassword(password);
      expect(resultado.ok).toBe(false);
      expect(resultado.codigo).toBe('PASSWORD_COMPROMETIDA');
    });

    test('acepta la contraseña si no está comprometida', async () => {
      global.fetch = jest.fn(async () => ({
        ok: true,
        text: async () => '0000000000000000000000000000000000A:1\r\n',
      }));

      const resultado = await validarPassword('frase segura y larga');
      expect(resultado.ok).toBe(true);
    });
  });
});
