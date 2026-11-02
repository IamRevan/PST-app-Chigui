const { Router } = require('express');
const AuthController = require('../controllers/AuthController');
const { authenticate } = require('../middleware/auth');
const {
  loginLimiter,
  registerLimiter,
  recoveryLimiter,
  mfaLimiter,
} = require('../middleware/security');

const router = Router();

// Públicas (con límite de intentos)
router.post('/login', loginLimiter, AuthController.login);
router.post('/register', registerLimiter, AuthController.register);
router.post('/verificar-email', recoveryLimiter, AuthController.verificarEmail);
router.post('/reenviar-verificacion', recoveryLimiter, AuthController.reenviarVerificacion);
router.post('/solicitar-recuperacion', recoveryLimiter, AuthController.solicitarRecuperacion);
router.post('/reset-password', recoveryLimiter, AuthController.solicitarRecuperacion);
router.post('/restablecer-password', recoveryLimiter, AuthController.restablecerPassword);
router.post('/mfa/verificar', mfaLimiter, AuthController.verificarMfa);

// Autenticadas
router.get('/perfil', authenticate, AuthController.perfil);
router.put('/perfil', authenticate, AuthController.actualizarPerfil);
router.post('/cambiar-password', authenticate, AuthController.cambiarPassword);
router.post('/cambiar-email', authenticate, AuthController.cambiarEmail);

// MFA
router.get('/mfa/estado', authenticate, AuthController.mfaEstado);
router.post('/mfa/iniciar', authenticate, AuthController.mfaIniciar);
router.post('/mfa/activar', authenticate, AuthController.mfaActivar);
router.post('/mfa/desactivar', authenticate, AuthController.mfaDesactivar);

// Sesiones y monitoreo
router.get('/sesiones', authenticate, AuthController.listarSesiones);
router.delete('/sesiones/:id', authenticate, AuthController.revocarSesionPorId);
router.get('/eventos', authenticate, AuthController.eventos);
router.post('/logout', authenticate, AuthController.logout);
router.post('/logout-todos', authenticate, AuthController.logoutTodos);

module.exports = router;
