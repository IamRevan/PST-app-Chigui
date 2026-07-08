const { Router } = require('express');
const RecetaController = require('../controllers/RecetaController');
const { authenticate } = require('../middleware/auth');

const router = Router();

router.get('/', authenticate, RecetaController.listar);
router.get('/:id', authenticate, RecetaController.obtener);
router.post('/', authenticate, RecetaController.crear);
router.put('/:id', authenticate, RecetaController.actualizar);
router.get('/:id/simular-costo', authenticate, RecetaController.simularCosto);
router.get('/:id/verificar-stock', authenticate, RecetaController.verificarStock);

module.exports = router;
