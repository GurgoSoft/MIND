const mongoose = require('mongoose');

const accesoSchema = new mongoose.Schema({
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
  },
  scope: {
    type: String,
    required: true,
    enum: ['READ', 'WRITE', 'DELETE', 'ADMIN'],
    default: 'READ'
  }
}, {
  timestamps: true,
  collection: 'accesos'
});

module.exports = mongoose.model('Acceso', accesoSchema);
