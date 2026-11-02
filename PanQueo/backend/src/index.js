const app = require('./app');
const { sequelize } = require('./models');
const config = require('./config/config');
const { iniciarSincronizacionTasas } = require('./services/TasaSyncScheduler');
const EmailService = require('./services/EmailService');

const start = async () => {
  try {
    await sequelize.authenticate();
    console.log('Conexión a PostgreSQL establecida correctamente');

    if (config.nodeEnv === 'development') {
      await sequelize.sync({ alter: false });
      console.log('Modelos sincronizados (development mode)');
    }

    app.listen(config.port, () => {
      console.log(`PanQueo API corriendo en puerto ${config.port}`);
      console.log(`Entorno: ${config.nodeEnv}`);
      console.log(`Usar "npm run migrate" para ejecutar migraciones`);
    });

    // Tasas BCV (USD y EUR): consulta al arrancar y luego cada hora
    iniciarSincronizacionTasas();

    // Correo transaccional: no bloquea el arranque; solo informa del estado.
    if (EmailService.estaConfigurado()) {
      EmailService.verificarConexion().then((resultado) => {
        if (resultado.ok) console.log(`[mail] SMTP listo (${config.mail.host}:${config.mail.port})`);
      });
    } else {
      console.warn('[mail] SMTP no configurado: los correos de verificación y recuperación no se enviarán.');
      if (config.nodeEnv === 'production') {
        console.warn('[mail] Configura SMTP_HOST, SMTP_USER, SMTP_PASS y MAIL_FROM antes de usar la recuperación en producción.');
      }
    }
  } catch (error) {
    console.error('Error al iniciar:', error);
    process.exit(1);
  }
};

start();
