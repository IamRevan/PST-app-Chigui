const { AuthEvento } = require('../models');

const ipDe = (req) => {
  if (!req) return null;
  const forwarded = req.headers?.['x-forwarded-for'];
  const ip = (Array.isArray(forwarded) ? forwarded[0] : forwarded) || req.ip || req.socket?.remoteAddress || '';
  return String(ip).split(',')[0].trim().slice(0, 64) || null;
};

const userAgentDe = (req) => String(req?.headers?.['user-agent'] || '')
  .slice(0, 255) || null;

/**
 * Registra un evento de autenticación para monitoreo. Nunca lanza: una falla
 * en la bitácora no debe tumbar el flujo de login.
 */
const registrarEvento = async ({
  req,
  id_usuario = null,
  email = null,
  tipo,
  exito = true,
  detalle = null,
}) => {
  try {
    await AuthEvento.create({
      id_usuario,
      email: email ? String(email).slice(0, 255) : null,
      tipo,
      exito,
      ip: ipDe(req),
      user_agent: userAgentDe(req),
      detalle,
      created_at: new Date(),
    });
  } catch (error) {
    console.error(`[auth] No se pudo registrar el evento "${tipo}": ${error.message}`);
  }
};

module.exports = { registrarEvento, ipDe, userAgentDe };
