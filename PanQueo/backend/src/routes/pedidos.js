const { Router } = require('express');
const PedidoController = require('../controllers/PedidoController');
const { authenticate } = require('../middleware/auth');

const router = Router();

router.get('/', authenticate, PedidoController.listar);
router.get('/:id', authenticate, PedidoController.obtener);
router.post('/', authenticate, PedidoController.crear);
router.patch('/:id/estado', authenticate, PedidoController.cambiarEstado);

module.exports = router;
