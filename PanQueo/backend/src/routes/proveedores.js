const { Router } = require('express');
const ProveedorController = require('../controllers/ProveedorController');
const { authenticate } = require('../middleware/auth');

const router = Router();

router.get('/', authenticate, ProveedorController.listar);
router.get('/:id', authenticate, ProveedorController.obtener);
router.post('/', authenticate, ProveedorController.crear);
router.put('/:id', authenticate, ProveedorController.actualizar);

module.exports = router;
