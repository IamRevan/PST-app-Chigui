jest.mock('../../../src/config/config', () => ({
  auth: {
    emailVerificationTtlHours: 24,
    passwordResetTtlMinutes: 30,
  },
  mail: {
    enabled: false,
    host: '',
    port: 587,
    secure: false,
    user: '',
    pass: '',
    from: 'PanQueo <no-reply@panqueo.test>',
    replyTo: '',
    timeoutMs: 10000,
    tlsRejectUnauthorized: true,
  },
}));

const EmailService = require('../../../src/services/EmailService');

describe('EmailService', () => {
  test('no está configurado si falta SMTP_HOST', () => {
    expect(EmailService.estaConfigurado()).toBe(false);
  });

  test('construye el correo de verificación con escape de HTML', () => {
    const correo = EmailService.construirCorreoAutenticacion({
      usuario: { nombre: 'Ana <script>', email: 'ana@example.com' },
      tipo: EmailService.TIPO_VERIFICACION,
      enlace: 'http://localhost:5500/?verify=abc123',
    });

    expect(correo.asunto).toContain('Verifica tu correo');
    expect(correo.html).toContain('Ana &lt;script&gt;');
    expect(correo.html).toContain('http://localhost:5500/?verify=abc123');
    expect(correo.html).toContain('24 horas');
    expect(correo.text).toContain('Verificar mi correo');
  });

  test('construye el correo de recuperación con su vigencia', () => {
    const correo = EmailService.construirCorreoAutenticacion({
      usuario: { nombre: 'Ana', email: 'ana@example.com' },
      tipo: EmailService.TIPO_RECUPERACION,
      enlace: 'http://localhost:5500/?reset=xyz',
    });

    expect(correo.asunto).toContain('Restablece tu contraseña');
    expect(correo.html).toContain('30 minutos');
    expect(correo.html).toContain('cerrarán todas tus sesiones');
    expect(correo.text).toContain('Restablecer contraseña');
  });

  test('no intenta enviar si SMTP no está configurado', async () => {
    const resultado = await EmailService.enviarCorreoAutenticacion({
      usuario: { nombre: 'Ana', email: 'ana@example.com' },
      tipo: EmailService.TIPO_VERIFICACION,
      enlace: 'http://localhost:5500/?verify=abc123',
    });

    expect(resultado).toEqual({ enviado: false, motivo: 'no_configurado' });
  });
});
