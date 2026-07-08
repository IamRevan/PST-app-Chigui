const { Router } = require('express');
const AuthController = require('../controllers/AuthController');
const { authenticate } = require('../middleware/auth');

const router = Router();

router.post('/login', AuthController.login);
router.post('/register', AuthController.register);
router.get('/perfil', authenticate, AuthController.perfil);

module.exports = router;
