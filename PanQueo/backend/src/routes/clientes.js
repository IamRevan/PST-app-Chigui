const { Router } = require('express');
const ClienteController = require('../controllers/ClienteController');
const { authenticate } = require('../middleware/auth');

const router = Router();

router.get('/', authenticate, ClienteController.listar);
router.get('/:id', authenticate, ClienteController.obtener);
router.post('/', authenticate, ClienteController.crear);
router.put('/:id', authenticate, ClienteController.actualizar);
router.get('/:id/historial', authenticate, ClienteController.historial);

module.exports = router;
