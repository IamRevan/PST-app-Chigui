const { Router } = require('express');

const router = Router();

router.use('/auth', require('./auth'));
router.use('/clientes', require('./clientes'));
router.use('/pedidos', require('./pedidos'));
router.use('/inventario', require('./inventario'));
router.use('/recetas', require('./recetas'));
router.use('/compras', require('./compras'));
router.use('/finanzas', require('./finanzas'));
router.use('/asistente', require('./asistente'));
router.use('/proveedores', require('./proveedores'));
router.use('/reportes', require('./reportes'));

module.exports = router;
