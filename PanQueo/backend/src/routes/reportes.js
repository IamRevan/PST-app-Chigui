const { Router } = require('express');
const ReporteController = require('../controllers/ReporteController');
const { authenticate } = require('../middleware/auth');

const router = Router();

router.get('/produccion', authenticate, ReporteController.produccion);
router.get('/mermas', authenticate, ReporteController.mermas);
router.get('/balance-pedidos', authenticate, ReporteController.balancePedidos);

module.exports = router;
