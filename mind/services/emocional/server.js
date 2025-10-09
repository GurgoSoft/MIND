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
const diarioRoutes = require('./routes/diarioRoutes');
const diarioAuditoriaRoutes = require('./routes/diarioAuditoriaRoutes');
const diarioEmocionRoutes = require('./routes/diarioEmocionRoutes');
const diarioSensacionRoutes = require('./routes/diarioSensacionRoutes');
const diarioSentimientoRoutes = require('./routes/diarioSentimientoRoutes');
const diarioSintomaRoutes = require('./routes/diarioSintomaRoutes');
const emocionRoutes = require('./routes/emocionRoutes');
const tipoEmocionRoutes = require('./routes/tipoEmocionRoutes');
const sensacionRoutes = require('./routes/sensacionRoutes');
const sintomaRoutes = require('./routes/sintomaRoutes');
const sentimientoRoutes = require('./routes/sentimientoRoutes');

const app = express();
const PORT = process.env.EMOTIONAL_PORT || 3003;

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
    message: 'Microservicio Emocional funcionando correctamente',
    timestamp: new Date().toISOString(),
    service: 'emocional'
  });
});

// API routes
app.use('/api/emotional/diarios', diarioRoutes);
app.use('/api/emotional/diariosauditoria', diarioAuditoriaRoutes);
app.use('/api/emotional/diariosemociones', diarioEmocionRoutes);
app.use('/api/emotional/diariossensaciones', diarioSensacionRoutes);
app.use('/api/emotional/diariossentimientos', diarioSentimientoRoutes);
app.use('/api/emotional/diariossintomas', diarioSintomaRoutes);
app.use('/api/emotional/emociones', emocionRoutes);
app.use('/api/emotional/tiposemocion', tipoEmocionRoutes);
app.use('/api/emotional/sensaciones', sensacionRoutes);
app.use('/api/emotional/sintomas', sintomaRoutes);
app.use('/api/emotional/sentimientos', sentimientoRoutes);

// Error handling
app.use(ErrorHandler.notFound);
app.use(ErrorHandler.handle);

// Start server
async function startServer() {
  try {
    await database.connect();
    
    app.listen(PORT, () => {
      console.log(` Microservicio Emocional ejecutándose en puerto ${PORT}`);
      console.log(` Health check disponible en: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error(' Error iniciando el servidor:', error);
    process.exit(1);
  }
}

startServer();
