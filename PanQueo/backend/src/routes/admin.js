const { Router } = require('express');
const AdminController = require('../controllers/AdminController');
const { authenticate, authorize } = require('../middleware/auth');

const router = Router();

// Todo el panel de administración requiere sesión y rol admin/desarrollador.
router.use(authenticate, authorize('admin', 'desarrollador'));

router.get('/usuarios', AdminController.listarUsuarios);
router.patch('/usuarios/:id/rol', AdminController.cambiarRol);
router.patch('/usuarios/:id/estado', AdminController.cambiarEstado);

module.exports = router;
