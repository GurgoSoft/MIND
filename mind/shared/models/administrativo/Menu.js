const mongoose = require('mongoose');

const menuSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: true,
    trim: true
  },
  ruta: {
    type: String,
    trim: true
  },
  icono: {
    type: String,
    trim: true
  },
  orden: {
    type: Number,
    default: 0
  },
  menuSuperior: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Menu',
    default: null
  },
  activo: {
    type: Boolean,
    default: true
  },
  nivel: {
    type: Number,
    default: 1
  }
}, {
  timestamps: true,
  collection: 'menus'
});

menuSchema.index({ menuSuperior: 1, orden: 1 });

module.exports = mongoose.model('Menu', menuSchema);
