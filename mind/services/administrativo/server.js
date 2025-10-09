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
const estadoRoutes = require('./routes/estadoRoutes');
const paisRoutes = require('./routes/paisRoutes');
const departamentoRoutes = require('./routes/departamentoRoutes');
const ciudadRoutes = require('./routes/ciudadRoutes');
const accesoRoutes = require('./routes/accesoRoutes');
const accesoUsuarioRoutes = require('./routes/accesoUsuarioRoutes');
const administracionAuditoriaRoutes = require('./routes/administracionAuditoriaRoutes');
const variableRoutes = require('./routes/variableRoutes');
const suscripcionRoutes = require('./routes/suscripcionRoutes');
const tipoNotificacionRoutes = require('./routes/tipoNotificacionRoutes');
const tipoSuscripcionRoutes = require('./routes/tipoSuscripcionRoutes');
const tipoVariableRoutes = require('./routes/tipoVariableRoutes');
const menuRoutes = require('./routes/menuRoutes');
const imagenSistemaRoutes = require('./routes/imagenSistemaRoutes');
const notificacionRoutes = require('./routes/notificacionRoutes');

const app = express();
const PORT = process.env.ADMIN_PORT || 3001;

// Security middleware
app.use(helmet());
// CORS: en desarrollo permitimos cualquier origen y credenciales
app.use(cors({ origin: true, credentials: true }));
app.options('*', cors({ origin: true, credentials: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Demasiadas solicitudes desde esta IP, intenta de nuevo más tarde.'
});
app.use(limiter);

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
    message: 'Microservicio Administrativo funcionando correctamente',
    timestamp: new Date().toISOString(),
    service: 'administrativo'
  });
});

// API routes
app.use('/api/admin/estados', estadoRoutes);
app.use('/api/admin/paises', paisRoutes);
app.use('/api/admin/departamentos', departamentoRoutes);
app.use('/api/admin/ciudades', ciudadRoutes);
app.use('/api/admin/accesos', accesoRoutes);
app.use('/api/admin/accesosusuario', accesoUsuarioRoutes);
app.use('/api/admin/auditoria', administracionAuditoriaRoutes);
app.use('/api/admin/variables', variableRoutes);
app.use('/api/admin/tiposvariable', tipoVariableRoutes);
app.use('/api/admin/suscripciones', suscripcionRoutes);
app.use('/api/admin/tipossuscripcion', tipoSuscripcionRoutes);
app.use('/api/admin/menus', menuRoutes);
app.use('/api/admin/imagenes', imagenSistemaRoutes);
app.use('/api/admin/notificaciones', notificacionRoutes);
app.use('/api/admin/tiposnotificacion', tipoNotificacionRoutes);

// Error handling
app.use(ErrorHandler.notFound);
app.use(ErrorHandler.handle);

// Start server
async function startServer() {
  try {
    await database.connect();
    
    app.listen(PORT, () => {
      console.log(` Microservicio Administrativo ejecutándose en puerto ${PORT}`);
      console.log(` Health check disponible en: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error(' Error iniciando el servidor:', error);
    process.exit(1);
  }
}

startServer();
