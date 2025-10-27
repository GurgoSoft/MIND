require('dotenv').config();
const db = require('../shared/config/database');
const Menu = require('../shared/models/administrativo/Menu');

(async () => {
  try {
    await db.connect();

    const defaults = [
      { nombre: 'Diario Emocional', ruta: '/diarioEmocional', icono: 'emoticon-happy-outline', orden: 1, menuSuperior: null, activo: true },
      { nombre: 'Actividades sensoriales', ruta: '/actividades', icono: 'meditation', orden: 2, menuSuperior: null, activo: true },
      { nombre: 'Agendamiento de acompañamiento', ruta: '/agendamiento', icono: 'calendar-clock', orden: 3, menuSuperior: null, activo: true },
      { nombre: 'Eventos y actividades grupales', ruta: '/eventos', icono: 'account-group-outline', orden: 4, menuSuperior: null, activo: true },
      { nombre: 'Personalización de espacio', ruta: '/personalizacion', icono: 'cog-outline', orden: 5, menuSuperior: null, activo: true },
      { nombre: 'Suscripción y beneficios', ruta: '/suscripcion', icono: 'crown-outline', orden: 6, menuSuperior: null, activo: true },
    ];

    for (const item of defaults) {
      const existing = await Menu.findOne({ nombre: item.nombre });
      if (!existing) {
        await Menu.create(item);
        console.log(` + Creado: ${item.nombre}`);
      } else {
        // actualizar campos claves sin romper jerarquía
        existing.ruta = item.ruta;
        existing.icono = item.icono;
        existing.orden = item.orden;
        existing.menuSuperior = null;
        if (typeof existing.activo !== 'boolean') existing.activo = true; // asegurar booleano
        await existing.save();
        console.log(` ~ Actualizado: ${item.nombre}`);
      }
    }

    console.log('Seed de menús por defecto completado.');
    await db.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Error en seed de menús:', err);
    try { await db.disconnect(); } catch {}
    process.exit(1);
  }
})();
