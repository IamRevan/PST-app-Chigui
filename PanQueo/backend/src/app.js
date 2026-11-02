const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const routes = require('./routes');
const config = require('./config/config');
const { requireHttps } = require('./middleware/security');

const app = express();

app.disable('x-powered-by');
app.set('trust proxy', config.auth.trustProxy);

app.use(helmet({
  contentSecurityPolicy: false, // API JSON: la CSP se sirve desde el frontend
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

const origenPermitido = (origin) => {
  if (!origin) return true; // apps nativas / curl no envían Origin
  if (config.auth.corsOrigins.includes(origin)) return true;

  try {
    const appUrl = new URL(config.auth.appUrl);
    if (appUrl.origin === origin) return true;
  } catch (error) {
    // APP_URL inválida: se ignora
  }

  if (config.nodeEnv !== 'production') {
    return /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\]|192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3})(:\d+)?$/.test(origin);
  }

  return false;
};

app.use(cors({
  origin: (origin, callback) => {
    if (origenPermitido(origin)) return callback(null, true);
    return callback(new Error('Origen no permitido por CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token', 'X-Client-Type', 'Cache-Control', 'Pragma'],
  exposedHeaders: ['RateLimit', 'RateLimit-Policy', 'RateLimit-Limit', 'RateLimit-Remaining', 'RateLimit-Reset', 'Retry-After'],
  maxAge: 600,
}));

app.use(requireHttps);
app.use(morgan(config.nodeEnv === 'development' ? 'dev' : 'combined'));
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));
app.use(cookieParser());

app.use('/api', routes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'success', message: 'PanQueo API funcionando', version: '1.0.0' });
});

app.use((req, res) => {
  res.status(404).json({ status: 'error', message: 'Ruta no encontrada' });
});

app.use((err, req, res, next) => {
  if (String(err.message || '').includes('CORS')) {
    return res.status(403).json({
      status: 'error',
      code: 'CORS_NO_PERMITIDO',
      message: 'Origen no permitido.',
    });
  }

  if (err.type === 'entity.too.large') {
    return res.status(413).json({
      status: 'error',
      code: 'CARGA_DEMASIADO_GRANDE',
      message: 'La solicitud supera el tamaño permitido.',
    });
  }

  console.error(err.stack);
  return res.status(500).json({ status: 'error', message: 'Error interno del servidor' });
});

module.exports = app;
