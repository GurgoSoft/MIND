const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
require('dotenv').config();

const database = require('../../shared/config/database');
const ErrorHandler = require('../../shared/middleware/errorHandler');

// Import routes
const authRoutes = require('./routes/authRoutes');
const usuarioRoutes = require('./routes/usuarioRoutes');
const personaRoutes = require('./routes/personaRoutes');
const suscripcionUsuarioRoutes = require('./routes/suscripcionUsuarioRoutes');
const informacionPagoRoutes = require('./routes/informacionPagoRoutes');
const tipoUsuarioRoutes = require('./routes/tipoUsuarioRoutes');
const usuarioAuditoriaRoutes = require('./routes/usuarioAuditoriaRoutes');

const app = express();
const PORT = process.env.USERS_PORT || 3002;

// Security middleware
app.use(helmet());
        // CORS amplio en desarrollo para Expo/Metro/LAN
        app.use(cors({ origin: true, credentials: true }));
        app.options('*', cors({ origin: true, credentials: true }));
app.options('*', cors());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method === 'OPTIONS',
  message: 'Demasiadas solicitudes desde esta IP, intenta de nuevo más tarde.'
});
app.use(limiter);

// Auth rate limiting (más laxo en dev y sin contar OPTIONS)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 10 : 100,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method === 'OPTIONS',
  message: 'Demasiados intentos de autenticación, intenta de nuevo más tarde.'
});

// Body parsing middleware
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Microservicio Usuarios funcionando correctamente',
    timestamp: new Date().toISOString(),
    service: 'usuarios'
  });
});

// API routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/users/usuarios', usuarioRoutes);
app.use('/api/users/personas', personaRoutes);
app.use('/api/users/suscripciones', suscripcionUsuarioRoutes);
app.use('/api/users/informacionpago', informacionPagoRoutes);
app.use('/api/users/tiposusuarios', tipoUsuarioRoutes);
app.use('/api/users/auditoria', usuarioAuditoriaRoutes);

// Error handling
app.use(ErrorHandler.notFound);
app.use(ErrorHandler.handle);

// Start server
async function startServer() {
  try {
    await database.connect();
    
    app.listen(PORT, () => {
      console.log(` Microservicio Usuarios ejecutándose en puerto ${PORT}`);
      console.log(` Health check disponible en: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error(' Error iniciando el servidor:', error);
    process.exit(1);
  }
}

startServer();
