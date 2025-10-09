const mongoose = require('mongoose');

const personaSchema = new mongoose.Schema({
  nombres: {
    type: String,
    required: true,
    trim: true
  },
  apellidos: {
    type: String,
    required: true,
    trim: true
  },
  tipoDoc: {
    type: String,
    required: true,
    enum: ['CC', 'TI', 'CE', 'PP', 'RC'],
    default: 'CC'
  },
  numDoc: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  fechaNacimiento: {
    type: Date,
    required: true
  },
  idPais: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pais',
    required: false,
    default: null
  },
  idDepartamento: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Departamento',
    required: false,
    default: null
  },
  idCiudad: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ciudad',
    required: false,
    default: null
  }
}, {
  timestamps: true,
  collection: 'personas'
});

personaSchema.index({ tipoDoc: 1, numDoc: 1 }, { unique: true });

module.exports = mongoose.model('Persona', personaSchema);
