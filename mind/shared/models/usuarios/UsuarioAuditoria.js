const mongoose = require('mongoose');

const usuarioAuditoriaSchema = new mongoose.Schema({
  entidad: {
    type: String,
    required: true,
    trim: true
  },
  idEntidad: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  accion: {
    type: String,
    required: true,
    enum: ['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT'],
    uppercase: true
  },
  usuarioId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  },
  datosAnteriores: {
    type: mongoose.Schema.Types.Mixed
  },
  datosNuevos: {
    type: mongoose.Schema.Types.Mixed
  },
  ip: {
    type: String,
    trim: true
  },
  userAgent: {
    type: String,
    trim: true
  }
}, {
  timestamps: true,
  collection: 'usuarios_auditoria'
});

usuarioAuditoriaSchema.index({ entidad: 1, idEntidad: 1 });
usuarioAuditoriaSchema.index({ usuarioId: 1 });

module.exports = mongoose.model('UsuarioAuditoria', usuarioAuditoriaSchema);
