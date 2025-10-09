const mongoose = require('mongoose');

const tipoAgendaSchema = new mongoose.Schema({
  codigo: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  nombre: {
    type: String,
    required: true,
    trim: true
  }
}, {
  timestamps: true,
  collection: 'tipos_agendas'
});

module.exports = mongoose.model('TipoAgenda', tipoAgendaSchema);
