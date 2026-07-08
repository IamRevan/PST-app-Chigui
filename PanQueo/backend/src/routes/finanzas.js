const { Router } = require('express');
const FinanzasController = require('../controllers/FinanzasController');
const { authenticate } = require('../middleware/auth');

const router = Router();

router.get('/tasas/actual', authenticate, FinanzasController.tasaActual);
router.post('/tasas', authenticate, FinanzasController.registrarTasa);
router.get('/tasas', authenticate, FinanzasController.historialTasas);

module.exports = router;
