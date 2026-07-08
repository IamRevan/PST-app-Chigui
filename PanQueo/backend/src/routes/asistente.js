const { Router } = require('express');
const AsistenteController = require('../controllers/AsistenteController');
const { authenticate } = require('../middleware/auth');

const router = Router();

router.get('/prediccion-compra', authenticate, AsistenteController.prediccionCompra);
router.get('/sugerencias-precios', authenticate, AsistenteController.sugerenciasPrecios);
router.post('/anomalias', authenticate, AsistenteController.registrarAnomalia);

module.exports = router;
