const { generarToken, hashToken, coincideHash } = require('../../../src/services/TokenService');

describe('TokenService', () => {
  test('genera tokens únicos y guarda solo su hash', () => {
    const uno = generarToken();
    const dos = generarToken();

    expect(uno.token).not.toBe(dos.token);
    expect(uno.hash).toHaveLength(64);
    expect(uno.hash).not.toBe(uno.token);
    expect(uno.hash).toBe(hashToken(uno.token));
  });

  test('compara tokens con el hash guardado', () => {
    const { token, hash } = generarToken();

    expect(coincideHash(token, hash)).toBe(true);
    expect(coincideHash(`${token}x`, hash)).toBe(false);
    expect(coincideHash('', hash)).toBe(false);
    expect(coincideHash(token, '')).toBe(false);
  });
});
