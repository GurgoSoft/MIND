# Sistema de Imágenes para Emociones

## Descripción General

Este documento describe cómo funcionan las imágenes asociadas a las emociones en el Diario Emocional.

## Arquitectura

### Base de Datos

1. **Colección `imagenes_sistema`**: Almacena las referencias a las imágenes del sistema
   - Campos principales:
     - `tipo`: Tipo de imagen (icon, logo, banner, etc.)
     - `url`: URL relativa de la imagen
     - `metadata`: Información adicional (tamaño, formato, dimensiones)

2. **Colección `emociones`**: Almacena las emociones disponibles
   - Campo nuevo: `imagenId` (ObjectId) - Referencia opcional a `imagenes_sistema`
   - Se hace populate automáticamente en el controlador

### Backend

El modelo `Emocion` ha sido actualizado con:
```javascript
imagenId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'ImagenSistema',
  required: false
}
```

El controlador de emociones hace populate automático:
```javascript
.populate('imagenId', 'tipo url metadata')
```

### Frontend

1. **Mapeo de imágenes locales**: Las imágenes se almacenan en `assets/` y se mapean mediante:
```typescript
const emotionImagesMap: { [key: string]: any } = {
  'abandonado.png': require('../assets/abandonado.png'),
  'aceptado.png': require('../assets/aceptado.png'),
};
```

2. **Función de resolución**: 
```typescript
const getEmotionImage = (imageUrl?: string) => {
  if (!imageUrl) return null;
  const fileName = imageUrl.split('/').pop();
  return fileName ? emotionImagesMap[fileName] : null;
};
```

3. **Renderizado**: En el modal de selección, si una emoción tiene imagen asociada, se muestra junto al nombre.

## Cómo Agregar Nuevas Imágenes de Emociones

### Paso 1: Agregar la imagen al frontend
Coloca la imagen PNG en: `mind-frontend/assets/`

### Paso 2: Registrar en el mapeo
Edita `mind-frontend/app/diarioEmocional.tsx`:
```typescript
const emotionImagesMap: { [key: string]: any } = {
  'abandonado.png': require('../assets/abandonado.png'),
  'aceptado.png': require('../assets/aceptado.png'),
  'nueva_emocion.png': require('../assets/nueva_emocion.png'), // Nuevo
};
```

### Paso 3: Vincular con la base de datos

#### Opción A: Usar el script existente
Edita `scripts/seed-emotion-images.js` y agrega:
```javascript
const emotionImages = [
  // ... existentes
  {
    emotionName: 'NombreEmoción',
    imagePath: '../mind-frontend/assets/nueva_emocion.png',
    imageType: 'icon'
  }
];
```

Luego ejecuta:
```bash
node scripts/seed-emotion-images.js
```

#### Opción B: Crear registro manualmente
1. Crea el registro en `imagenes_sistema`:
```javascript
{
  tipo: 'icon',
  url: '/assets/nueva_emocion.png',
  metadata: {
    format: 'png'
  },
  activo: true
}
```

2. Actualiza la emoción con el `imagenId` obtenido:
```javascript
db.emociones.updateOne(
  { nombre: 'NombreEmoción' },
  { $set: { imagenId: ObjectId('...') } }
)
```

## Emociones con Imágenes Actuales

- **Abandonado**: `abandonado.png`
- **Aceptado**: `aceptado.png`

## Notas Técnicas

- Las imágenes se cargan de forma local en el frontend usando `require()`
- No hay necesidad de configurar un servidor de archivos estáticos
- El campo `imagenId` es opcional - las emociones sin imagen funcionan normalmente
- El formato recomendado es PNG con fondo transparente
- Tamaño recomendado: 40x40 píxeles (se escala automáticamente)

## Troubleshooting

### La imagen no se muestra
1. Verifica que el nombre del archivo en el mapeo coincide exactamente con el nombre en la BD
2. Asegúrate de que el archivo existe en `mind-frontend/assets/`
3. Verifica que el populate en el backend incluye el campo `imagenId`

### Error al ejecutar el script
1. Verifica que la emoción existe en la BD (nombres exactos)
2. Asegúrate de que la ruta del archivo es correcta
3. Revisa los logs para ver qué emoción está fallando
