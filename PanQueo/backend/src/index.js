const app = require('./app');
const { sequelize } = require('./models');
const config = require('./config/config');

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
  } catch (error) {
    console.error('Error al iniciar:', error);
    process.exit(1);
  }
};

start();
