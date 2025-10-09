const mongoose = require('mongoose');

const variableSchema = new mongoose.Schema({
  idTipoVariable: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TipoVariable',
    required: true
  },
  clave: {
    type: String,
    required: true,
    trim: true
  },
  valor: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  ambiente: {
    type: String,
    required: true,
    enum: ['development', 'staging', 'production'],
    default: 'development'
  },
  descripcion: {
    type: String,
    trim: true
  }
}, {
  timestamps: true,
  collection: 'variables'
});

variableSchema.index({ clave: 1, ambiente: 1 }, { unique: true });

module.exports = mongoose.model('Variable', variableSchema);
