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
const agendaRoutes = require('./routes/agendaRoutes');
const agendaAuditoriaRoutes = require('./routes/agendaAuditoriaRoutes');
const agendaDiaRoutes = require('./routes/agendaDiaRoutes');
const tipoAgendaRoutes = require('./routes/tipoAgendaRoutes');
const citaRoutes = require('./routes/citaRoutes');
const citaContenidoRoutes = require('./routes/citaContenidoRoutes');
const citaDiagnosticoRoutes = require('./routes/citaDiagnosticoRoutes');
const registroCitaRoutes = require('./routes/registroCitaRoutes');
const diagnosticoRoutes = require('./routes/diagnosticoRoutes');
const tipoDiagnosticoRoutes = require('./routes/tipoDiagnosticoRoutes');
const seguimientoRoutes = require('./routes/seguimientoRoutes');

const app = express();
const PORT = process.env.AGENDA_PORT || 3004;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true
}));

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
    message: 'Microservicio Agenda funcionando correctamente',
    timestamp: new Date().toISOString(),
    service: 'agenda'
  });
});

// API routes
app.use('/api/schedule/agendas', agendaRoutes);
app.use('/api/schedule/agendaauditoria', agendaAuditoriaRoutes);
app.use('/api/schedule/agendadias', agendaDiaRoutes);
app.use('/api/schedule/tiposagenda', tipoAgendaRoutes);
app.use('/api/schedule/citas', citaRoutes);
app.use('/api/schedule/citascontenido', citaContenidoRoutes);
app.use('/api/schedule/citasdiagnostico', citaDiagnosticoRoutes);
app.use('/api/schedule/registroscita', registroCitaRoutes);
app.use('/api/schedule/diagnosticos', diagnosticoRoutes);
app.use('/api/schedule/tiposdiagnostico', tipoDiagnosticoRoutes);
app.use('/api/schedule/seguimientos', seguimientoRoutes);

// Error handling
app.use(ErrorHandler.notFound);
app.use(ErrorHandler.handle);

// Start server
async function startServer() {
  try {
    await database.connect();
    
    app.listen(PORT, () => {
      console.log(` Microservicio Agenda ejecutándose en puerto ${PORT}`);
      console.log(` Health check disponible en: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error(' Error iniciando el servidor:', error);
    process.exit(1);
  }
}

startServer();
