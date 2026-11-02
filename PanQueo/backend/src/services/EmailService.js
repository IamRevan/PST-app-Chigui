const config = require('../config/config');

/**
 * Envío de correos transaccionales por SMTP.
 *
 * - Si SMTP_HOST (o MAIL_ENABLED=true) no está configurado, el servicio queda
 *   inactivo y la API sigue funcionando: los enlaces se registran en consola.
 * - Nunca lanza hacia el controlador: un fallo de SMTP no debe tumbar el
 *   registro ni la recuperación de contraseña.
 */

const TIPO_VERIFICACION = 'verificacion_email';
const TIPO_RECUPERACION = 'recuperacion_password';

let transporte = null;

const escaparHtml = (valor) => String(valor ?? '').replace(/[&<>"']/g, (caracter) => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}[caracter]));

const estaConfigurado = () => Boolean(config.mail?.enabled && config.mail?.host);

const obtenerTransporte = () => {
  if (transporte) return transporte;
  if (!estaConfigurado()) return null;

  // Se carga de forma diferida para que el resto de la API funcione incluso
  // si la dependencia no está instalada en un entorno mínimo.
  const nodemailer = require('nodemailer');

  transporte = nodemailer.createTransport({
    host: config.mail.host,
    port: config.mail.port,
    secure: config.mail.secure,
    ...(config.mail.user ? { auth: { user: config.mail.user, pass: config.mail.pass } } : {}),
    connectionTimeout: config.mail.timeoutMs,
    greetingTimeout: config.mail.timeoutMs,
    socketTimeout: config.mail.timeoutMs,
    tls: { rejectUnauthorized: config.mail.tlsRejectUnauthorized },
  });

  return transporte;
};

const botonHtml = (enlace, texto) => `
  <a href="${escaparHtml(enlace)}"
     style="display:inline-block;background:#ffc107;color:#6d5100;text-decoration:none;font-weight:bold;font-size:16px;padding:14px 24px;border-radius:12px;">
    ${escaparHtml(texto)}
  </a>`;

const construirHtml = ({ titulo, nombre, introduccion, boton, enlace, expiracion, notaFinal }) => `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escaparHtml(titulo)}</title>
</head>
<body style="margin:0;padding:0;background:#f6f3f2;font-family:Arial,Helvetica,sans-serif;color:#1b1c1c;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f3f2;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #eae7e7;">
          <tr>
            <td style="background:#ffc107;padding:20px 28px;">
              <span style="font-size:20px;font-weight:bold;color:#6d5100;">PanQueo</span>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 28px 8px;">
              <h1 style="margin:0 0 16px;font-size:22px;line-height:30px;color:#1b1c1c;">${escaparHtml(titulo)}</h1>
              <p style="margin:0 0 12px;font-size:15px;line-height:24px;">Hola ${escaparHtml(nombre)},</p>
              <p style="margin:0 0 12px;font-size:15px;line-height:24px;">${escaparHtml(introduccion)}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 28px 8px;">
              ${botonHtml(enlace, boton)}
            </td>
          </tr>
          <tr>
            <td style="padding:8px 28px 24px;">
              <p style="margin:0 0 10px;font-size:14px;line-height:22px;color:#4f4632;">${escaparHtml(expiracion)}</p>
              <p style="margin:0 0 10px;font-size:14px;line-height:22px;color:#4f4632;">${escaparHtml(notaFinal)}</p>
              <p style="margin:16px 0 0;font-size:12px;line-height:18px;color:#827660;word-break:break-all;">
                Si el botón no funciona, copia este enlace:<br>${escaparHtml(enlace)}
              </p>
            </td>
          </tr>
          <tr>
            <td style="background:#f6f3f2;padding:16px 28px;color:#827660;font-size:12px;line-height:18px;">
              PanQueo · Gestión de repostería<br>
              Este es un mensaje automático; no respondas a este correo.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

const construirTexto = ({ titulo, nombre, introduccion, boton, enlace, expiracion, notaFinal }) => [
  `PanQueo · ${titulo}`,
  '',
  `Hola ${nombre},`,
  '',
  introduccion,
  '',
  `${boton}: ${enlace}`,
  '',
  expiracion,
  notaFinal,
  '',
  'PanQueo · Gestión de repostería',
].join('\n');

const construirCorreoAutenticacion = ({ usuario, tipo, enlace }) => {
  const nombre = usuario?.nombre || 'de nuevo';
  const esVerificacion = tipo === TIPO_VERIFICACION;

  const contenido = esVerificacion
    ? {
      asunto: 'Verifica tu correo · PanQueo',
      titulo: 'Verifica tu correo',
      introduccion: 'Gracias por crear tu cuenta en PanQueo. Confirma tu dirección de correo para activar el acceso.',
      boton: 'Verificar mi correo',
      expiracion: `Este enlace vence en ${config.auth.emailVerificationTtlHours} horas y solo puede usarse una vez.`,
      notaFinal: 'Si no creaste esta cuenta, puedes ignorar este mensaje.',
    }
    : {
      asunto: 'Restablece tu contraseña · PanQueo',
      titulo: 'Restablece tu contraseña',
      introduccion: 'Recibimos una solicitud para restablecer la contraseña de tu cuenta PanQueo.',
      boton: 'Restablecer contraseña',
      expiracion: `Este enlace vence en ${config.auth.passwordResetTtlMinutes} minutos y solo puede usarse una vez. Al usarlo se cerrarán todas tus sesiones.`,
      notaFinal: 'Si no solicitaste este cambio, ignora este correo: tu contraseña actual sigue siendo válida.',
    };

  const datos = { ...contenido, nombre, enlace };
  return {
    asunto: contenido.asunto,
    html: construirHtml(datos),
    text: construirTexto(datos),
  };
};

const enviarCorreo = async ({ to, asunto, html, text }) => {
  if (!estaConfigurado()) {
    console.log(`[mail] SMTP no configurado; no se envió "${asunto}".`);
    return { enviado: false, motivo: 'no_configurado' };
  }

  try {
    const info = await obtenerTransporte().sendMail({
      from: config.mail.from,
      to,
      subject: asunto,
      text,
      html,
      ...(config.mail.replyTo ? { replyTo: config.mail.replyTo } : {}),
    });
    console.log(`[mail] "${asunto}" enviado a ${to} (${info.messageId || 'sin id'}).`);
    return { enviado: true, id: info.messageId || null };
  } catch (error) {
    console.error(`[mail] Error enviando "${asunto}" a ${to}: ${error.message}`);
    return { enviado: false, motivo: 'error' };
  }
};

const enviarCorreoAutenticacion = async ({ usuario, tipo, enlace }) => {
  if (!usuario?.email) return { enviado: false, motivo: 'sin_destinatario' };

  const correo = construirCorreoAutenticacion({ usuario, tipo, enlace });
  return enviarCorreo({ to: usuario.email, ...correo });
};

const enviarCorreoPrueba = async (to) => enviarCorreo({
  to,
  asunto: 'Prueba de correo · PanQueo',
  text: [
    'PanQueo · Prueba de configuración SMTP',
    '',
    'Si estás leyendo este mensaje, el envío de correos de PanQueo funciona correctamente.',
    '',
    'Ya puedes usar la verificación de correo y la recuperación de contraseña.',
  ].join('\n'),
  html: construirHtml({
    titulo: 'Prueba de configuración SMTP',
    nombre: 'equipo de PanQueo',
    introduccion: 'Si estás leyendo este mensaje, el envío de correos funciona correctamente. Ya puedes usar la verificación de correo y la recuperación de contraseña.',
    boton: 'Ir a PanQueo',
    enlace: config.auth?.appUrl || 'http://localhost:5500',
    expiracion: 'Este mensaje no contiene enlaces de un solo uso.',
    notaFinal: 'Puedes ignorar este correo; solo sirve para comprobar la configuración.',
  }),
});

const verificarConexion = async () => {
  if (!estaConfigurado()) return { ok: false, motivo: 'no_configurado' };

  try {
    await obtenerTransporte().verify();
    return { ok: true };
  } catch (error) {
    console.error(`[mail] No se pudo conectar con SMTP: ${error.message}`);
    return { ok: false, motivo: error.message };
  }
};

module.exports = {
  TIPO_VERIFICACION,
  TIPO_RECUPERACION,
  estaConfigurado,
  construirCorreoAutenticacion,
  enviarCorreoAutenticacion,
  enviarCorreoPrueba,
  verificarConexion,
};
