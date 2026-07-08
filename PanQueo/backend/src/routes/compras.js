const { Router } = require('express');
const ComprasController = require('../controllers/ComprasController');
const { authenticate } = require('../middleware/auth');

const router = Router();

router.get('/listas', authenticate, ComprasController.listarListas);
router.post('/listas', authenticate, ComprasController.crearLista);
router.patch('/listas/:id', authenticate, ComprasController.actualizarLista);
router.patch('/listas/:id/completar', authenticate, ComprasController.completarLista);

module.exports = router;
