const mongoose = require('mongoose');
require('dotenv').config();

const database = require('../shared/config/database');
const TipoEmocion = require('../shared/models/emocional/TipoEmocion');

const tiposEmocion = [
  {
    codigo: 'POSITIVA',
    nombre: 'Positiva'
  },
  {
    codigo: 'NEGATIVA',
    nombre: 'Negativa'
  },
  {
    codigo: 'NEUTRAL',
    nombre: 'Neutral'
  },
  {
    codigo: 'PERSONALIZADA',
    nombre: 'Personalizada'
  }
];

async function seedTiposEmocion() {
  try {
    await database.connect();
    console.log('✅ Conectado a la base de datos');

    // Check if types already exist
    const count = await TipoEmocion.countDocuments();
    if (count > 0) {
      console.log(`ℹ️  Ya existen ${count} tipos de emoción en la base de datos`);
      
      // Check if "Personalizada" exists
      const personalizada = await TipoEmocion.findOne({ nombre: 'Personalizada' });
      if (!personalizada) {
        console.log('➕ Agregando tipo "Personalizada"...');
        await TipoEmocion.create({
          codigo: 'PERSONALIZADA',
          nombre: 'Personalizada'
        });
        console.log('✅ Tipo "Personalizada" creado exitosamente');
      } else {
        console.log('✅ El tipo "Personalizada" ya existe');
      }
    } else {
      console.log('📝 Creando tipos de emoción por defecto...');
      await TipoEmocion.insertMany(tiposEmocion);
      console.log('✅ Tipos de emoción creados exitosamente');
    }

    // Show all types
    const allTypes = await TipoEmocion.find();
    console.log('\n📋 Tipos de emoción en la base de datos:');
    allTypes.forEach(tipo => {
      console.log(`  - ${tipo.codigo}: ${tipo.nombre}`);
    });

    await mongoose.connection.close();
    console.log('\n✅ Proceso completado');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

seedTiposEmocion();
