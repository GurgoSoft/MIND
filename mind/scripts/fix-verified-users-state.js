require('dotenv').config();
const db = require('../shared/config/database');
const Usuario = require('../shared/models/usuarios/Usuario');
const Persona = require('../shared/models/usuarios/Persona');
const Estado = require('../shared/models/administrativo/Estado');

async function fixVerifiedUsersState() {
  try {
    await db.connect();
    console.log('Conectado a MongoDB para corregir estados de usuarios verificados');

    // Buscar el estado "Activo" (0003)
    const estadoActivo = await Estado.findOne({ codigo: '0003' });
    if (!estadoActivo) {
      console.log('ERROR: No se encontró el estado "Activo" (0003)');
      process.exit(1);
    }

    // Buscar el estado "Pendiente de Verificación" (0004)
    const estadoPendiente = await Estado.findOne({ codigo: '0004' });
    
    console.log('Buscando usuarios verificados con estado incorrecto...');

    // Buscar usuarios que están:
    // 1. Verificados (emailVerified = true o activo = true)
    // 2. Pero tienen estado "Pendiente de Verificación" (0004)
    const usuariosParaActualizar = await Usuario.find({
      $and: [
        {
          $or: [
            { emailVerified: true },
            { activo: true }
          ]
        },
        { idEstado: estadoPendiente?._id }
      ]
    }).populate('idPersona');

    console.log(`Encontrados ${usuariosParaActualizar.length} usuarios para actualizar`);

    if (usuariosParaActualizar.length === 0) {
      console.log('No hay usuarios que necesiten actualización');
      await db.disconnect();
      process.exit(0);
    }

    // Mostrar usuarios que se van a actualizar
    console.log('\nUsuarios que se actualizarán:');
    usuariosParaActualizar.forEach((usuario, index) => {
      const nombre = usuario.idPersona ? 
        `${usuario.idPersona.nombres} ${usuario.idPersona.apellidos}` : 
        'Sin nombre';
      console.log(`${index + 1}. ${nombre} (${usuario.email})`);
    });

    // Actualizar todos los usuarios
    const resultado = await Usuario.updateMany(
      {
        $and: [
          {
            $or: [
              { emailVerified: true },
              { activo: true }
            ]
          },
          { idEstado: estadoPendiente?._id }
        ]
      },
      {
        $set: {
          idEstado: estadoActivo._id,
          activo: true,
          emailVerified: true
        }
      }
    );

    console.log(`\nActualizados ${resultado.modifiedCount} usuarios`);
    console.log('Todos los usuarios verificados ahora tienen el estado "Activo"');

    await db.disconnect();
    process.exit(0);

  } catch (error) {
    console.error('ERROR:', error);
    try {
      await db.disconnect();
    } catch {}
    process.exit(1);
  }
}

fixVerifiedUsersState();