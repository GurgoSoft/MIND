const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const database = require('../shared/config/database');
const ImagenSistema = require('../shared/models/administrativo/ImagenSistema');
const Emocion = require('../shared/models/emocional/Emocion');

// Configuración de imágenes a procesar
const emotionImages = [
  {
    emotionName: 'Abandonado',
    imagePath: '../mind-frontend/assets/abandonado.png',
    imageType: 'icon'
  },
  {
    emotionName: 'Aceptado',
    imagePath: '../mind-frontend/assets/aceptado.png',
    imageType: 'icon'
  }
];

async function seedEmotionImages() {
  try {
    await database.connect();
    console.log('✅ Conectado a la base de datos');

    for (const emotionImage of emotionImages) {
      console.log(`\n📝 Procesando emoción: ${emotionImage.emotionName}...`);

      // 1. Buscar la emoción en la BD
      const emocion = await Emocion.findOne({ 
        nombre: { $regex: new RegExp(`^${emotionImage.emotionName}$`, 'i') } 
      });

      if (!emocion) {
        console.log(`⚠️  La emoción "${emotionImage.emotionName}" no existe en la base de datos. Saltando...`);
        continue;
      }

      console.log(`✅ Emoción encontrada: ${emocion.nombre} (ID: ${emocion._id})`);

      // 2. Verificar si la imagen ya existe en imagenes_sistema
      const imageFileName = path.basename(emotionImage.imagePath);
      const existingImage = await ImagenSistema.findOne({ 
        url: { $regex: new RegExp(imageFileName, 'i') } 
      });

      let imagenId;

      if (existingImage) {
        console.log(`ℹ️  La imagen ya existe en la BD: ${existingImage.url}`);
        imagenId = existingImage._id;
      } else {
        // 3. Crear registro de imagen en imagenes_sistema
        const imagePath = path.join(__dirname, emotionImage.imagePath);
        
        // Verificar que el archivo existe
        if (!fs.existsSync(imagePath)) {
          console.log(`❌ El archivo no existe en la ruta: ${imagePath}`);
          continue;
        }

        // Obtener información del archivo
        const stats = fs.statSync(imagePath);
        
        // Crear URL relativa para la imagen
        const imageUrl = `/assets/${imageFileName}`;

        const newImage = new ImagenSistema({
          tipo: emotionImage.imageType,
          url: imageUrl,
          metadata: {
            size: stats.size,
            format: 'png'
          },
          activo: true
        });

        await newImage.save();
        console.log(`✅ Imagen creada en BD: ${newImage.url} (ID: ${newImage._id})`);
        imagenId = newImage._id;
      }

      // 4. Vincular imagen con la emoción
      if (emocion.imagenId && emocion.imagenId.toString() === imagenId.toString()) {
        console.log(`ℹ️  La emoción ya está vinculada con esta imagen`);
      } else {
        // Actualizar usando findByIdAndUpdate para evitar problemas con ObjectIds
        await Emocion.findByIdAndUpdate(
          emocion._id,
          { imagenId: imagenId },
          { new: true }
        );
        console.log(`✅ Imagen vinculada con la emoción "${emocion.nombre}"`);
      }
    }

    console.log('\n✅ Proceso completado exitosamente');
    
    // Mostrar resumen
    console.log('\n📋 Resumen de emociones con imágenes:');
    const emocionesConImagen = await Emocion.find({ imagenId: { $exists: true, $ne: null } })
      .populate('imagenId');
    
    emocionesConImagen.forEach(emocion => {
      console.log(`  - ${emocion.nombre}: ${emocion.imagenId?.url || 'N/A'}`);
    });

    await mongoose.connection.close();
    console.log('\n🔌 Conexión cerrada');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

seedEmotionImages();
