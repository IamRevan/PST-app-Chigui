const { Router } = require('express');
const AuthController = require('../controllers/AuthController');
const { authenticate } = require('../middleware/auth');
const { validatePasswordMiddleware } = require('../middleware/validatePassword');

const router = Router();

router.post('/login', AuthController.login);
router.post('/register', validatePasswordMiddleware, AuthController.register);
router.get('/perfil', authenticate, AuthController.perfil);

module.exports = router;
