const TotpService = require('../../../src/services/TotpService');

describe('TotpService', () => {
  // Vector de prueba RFC 6238 (SHA-1, secreto ASCII "12345678901234567890")
  const SECRETO_RFC = 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ';

  test('base32 codifica y decodifica sin pérdida', () => {
    const original = Buffer.from('12345678901234567890', 'ascii');
    const codificado = TotpService.base32Encode(original);
    expect(codificado).toBe(SECRETO_RFC);
    expect(TotpService.base32Decode(codificado).toString('ascii')).toBe('12345678901234567890');
  });

  test('genera el código esperado por RFC 6238', () => {
    // T = 59 s => contador = 1, código de 6 dígitos = 287082
    expect(TotpService.generarCodigo(SECRETO_RFC, 1)).toBe('287082');
  });

  test('verifica el código actual con ventana de tolerancia', () => {
    const secreto = TotpService.generarSecreto();
    const codigo = TotpService.codigoActual(secreto);

    expect(TotpService.verificarCodigo(secreto, codigo)).toMatchObject({ ok: true });
    expect(TotpService.verificarCodigo(secreto, '000000')).toEqual({ ok: false });
    expect(TotpService.verificarCodigo(secreto, 'abc')).toEqual({ ok: false });
  });

  test('rechaza reutilizar un código ya usado (anti-replay)', () => {
    const secreto = TotpService.generarSecreto();
    const codigo = TotpService.codigoActual(secreto);
    const primero = TotpService.verificarCodigo(secreto, codigo);

    expect(primero.ok).toBe(true);
    expect(TotpService.verificarCodigo(secreto, codigo, { ultimoStep: primero.step }))
      .toEqual({ ok: false });
  });

  test('genera URI otpauth compatible con autenticadores', () => {
    const uri = TotpService.otpauthUri({
      secreto: SECRETO_RFC,
      email: 'ana@example.com',
      issuer: 'PanQueo',
    });

    expect(uri.startsWith('otpauth://totp/PanQueo:ana%40example.com?')).toBe(true);
    expect(uri).toContain(`secret=${SECRETO_RFC}`);
    expect(uri).toContain('issuer=PanQueo');
    expect(uri).toContain('period=30');
    expect(uri).toContain('digits=6');
  });

  test('genera y valida códigos de recuperación de un solo uso', () => {
    const { codigos, hashes } = TotpService.generarCodigosRecuperacion(3);

    expect(codigos).toHaveLength(3);
    expect(hashes).toHaveLength(3);
    expect(codigos[0]).toMatch(/^[A-F0-9]{5}-[A-F0-9]{5}$/);

    expect(TotpService.indiceCodigoRecuperacion(codigos[1], hashes)).toBe(1);
    expect(TotpService.indiceCodigoRecuperacion('AAAAA-BBBBB', hashes)).toBe(-1);
  });
});
