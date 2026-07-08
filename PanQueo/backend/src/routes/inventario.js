const { Router } = require('express');
const InventarioController = require('../controllers/InventarioController');
const { authenticate } = require('../middleware/auth');

const router = Router();

router.get('/ingredientes', authenticate, InventarioController.listarIngredientes);
router.post('/ingredientes', authenticate, InventarioController.crearIngrediente);
router.put('/ingredientes/:id', authenticate, InventarioController.actualizarIngrediente);
router.get('/lotes', authenticate, InventarioController.listarLotes);
router.post('/lotes', authenticate, InventarioController.crearLote);
router.post('/ajuste', authenticate, InventarioController.ajustarInventario);
router.get('/alertas', authenticate, InventarioController.alertas);

module.exports = router;
