const mockSendMail = jest.fn();

jest.mock('../../../src/config/config', () => ({
  auth: {
    emailVerificationTtlHours: 24,
    passwordResetTtlMinutes: 30,
  },
  mail: {
    enabled: true,
    host: 'smtp.test.local',
    port: 587,
    secure: false,
    user: 'usuario',
    pass: 'clave',
    from: 'PanQueo <no-reply@panqueo.test>',
    replyTo: 'soporte@panqueo.test',
    timeoutMs: 5000,
    tlsRejectUnauthorized: true,
  },
}));

jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => ({
    sendMail: mockSendMail,
    verify: jest.fn().mockResolvedValue(true),
  })),
}));

const EmailService = require('../../../src/services/EmailService');

describe('EmailService con SMTP configurado', () => {
  beforeEach(() => {
    mockSendMail.mockReset();
    mockSendMail.mockResolvedValue({ messageId: 'mensaje-123' });
  });

  test('envía el correo de verificación con remitente y reply-to', async () => {
    const resultado = await EmailService.enviarCorreoAutenticacion({
      usuario: { nombre: 'Ana', email: 'ana@example.com' },
      tipo: EmailService.TIPO_VERIFICACION,
      enlace: 'https://app.panqueo.com/?verify=abc123',
    });

    expect(resultado).toEqual({ enviado: true, id: 'mensaje-123' });
    expect(mockSendMail).toHaveBeenCalledWith(expect.objectContaining({
      from: 'PanQueo <no-reply@panqueo.test>',
      to: 'ana@example.com',
      replyTo: 'soporte@panqueo.test',
      subject: 'Verifica tu correo · PanQueo',
    }));
    expect(mockSendMail.mock.calls[0][0].html).toContain('https://app.panqueo.com/?verify=abc123');
  });

  test('devuelve error controlado si SMTP falla', async () => {
    mockSendMail.mockRejectedValue(new Error('conexión rechazada'));

    const resultado = await EmailService.enviarCorreoAutenticacion({
      usuario: { nombre: 'Ana', email: 'ana@example.com' },
      tipo: EmailService.TIPO_RECUPERACION,
      enlace: 'https://app.panqueo.com/?reset=xyz',
    });

    expect(resultado).toEqual({ enviado: false, motivo: 'error' });
  });
});
