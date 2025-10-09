#  Guía de Importación - Colección Postman Mind API

##  Pasos para Importar la Colección

### 1. **Abrir Postman**
- Inicia la aplicación Postman en tu computadora
- Si no tienes Postman, descárgalo desde: https://www.postman.com/downloads/

### 2. **Importar Colección**
- Haz clic en el botón **"Import"** (esquina superior izquierda)
- O usa el atajo de teclado: `Ctrl + O` (Windows) / `Cmd + O` (Mac)

### 3. **Seleccionar Archivo**
- En la ventana de importación, haz clic en **"Upload Files"**
- Navega hasta tu carpeta del proyecto: `mind/docs/`
- Selecciona el archivo: **`postman-examples.json`**
- Haz clic en **"Open"**

### 4. **Confirmar Importación**
- Postman mostrará una vista previa de la colección
- Verifica que aparezca: **"Mind API - Testing Collection"**
- Haz clic en **"Import"** para confirmar

##  **Verificación Post-Importación**

### Colección Importada
- Deberías ver **"Mind API - Testing Collection"** en tu sidebar izquierdo
- La colección incluye 4 carpetas principales:
  -  **Autenticación**
  -  **Administrativo** 
  -  **Usuarios**
  -  **Emocional**
  -  **Agenda**
  -  **el usuario base usado para la pruebas es:**
    - email: admin@admin.com
    - password: 123456
    **DEVE SERCIORARSE DE QUE ESTE EXISTA EN LA DB**
    
### Variables Configuradas
La colección incluye estas variables automáticamente:
- `base_url_users`: http://localhost:3002
- `base_url_admin`: http://localhost:3001
- `base_url_emotional`: http://localhost:3003
- `base_url_agenda`: http://localhost:3004
- `admin_email`: admin@admin.com
- `admin_password`: 123456
- `jwt_token`: (se llena automáticamente)

##  **Uso Automático de JWT**

### ¡No Necesitas Hacer Nada Manualmente!
- **Login automático:** Cada endpoint se logea automáticamente si no hay token
- **Token compartido:** Una vez obtenido, se usa en todas las peticiones
- **Bearer Token:** Configurado automáticamente en headers

### Primer Uso
1. **Ejecuta cualquier endpoint** (excepto Health Check)
2. **Postman automáticamente:**
   - Hace login con el usuario base admin@admin.com
   - Obtiene el token JWT
   - Lo guarda en la variable `jwt_token`
   - Lo usa en la petición actual

##  **Probar la Configuración**

### Test Rápido
1. Expande **"👥 Usuarios"**
2. Haz clic en **"Listar Usuarios"**
3. Presiona **"Send"**
4. Deberías ver:
   - Status: `200 OK`
   - Respuesta con lista de usuarios
   - En la pestaña **"Console"** verás el auto-login

### Verificar Variables
1. Haz clic en la colección **"Mind API - Testing Collection"**
2. Ve a la pestaña **"Variables"**
3. Verifica que `jwt_token` tenga un valor después de la primera petición

## 🔧 **Configuración de Servidores**

Antes de usar la colección, asegúrate de que los servidores estén ejecutándose:

```bash
# Terminal 1 - Usuarios
cd services/usuarios
node server.js

# Terminal 2 - Administrativo  
cd services/administrativo
node server.js

# Terminal 3 - Emocional
cd services/emocional
node server.js

# Terminal 4 - Agenda
cd services/agenda
node server.js
```

##  **Endpoints Disponibles**

###  Autenticación
- `POST /api/auth/register` - Registrar usuario
- `POST /api/auth/login` - Iniciar sesión
- `GET /api/auth/profile` - Obtener perfil
- `PUT /api/auth/change-password` - Cambiar contraseña
- `POST /api/auth/logout` - Cerrar sesión

###  Administrativo (Puerto 3001)
- Países, Departamentos, Ciudades
- Tipos de Variables, Suscripciones, Notificaciones
- Accesos y Menús del Sistema

###  Usuarios (Puerto 3002)
- Gestión de Usuarios y Personas
- Información de Pago y Suscripciones
- Auditoría de Usuarios

###  Emocional (Puerto 3003)
- Diarios Emocionales
- Emociones, Sensaciones, Sentimientos
- Síntomas y Seguimiento

###  Agenda (Puerto 3004)
- Gestión de Citas y Diagnósticos
- Tipos de Agenda y Seguimientos
- Registros y Auditoría

##  **Solución de Problemas**

### Error de Conexión
- Verifica que los servidores estén ejecutándose
- Confirma los puertos en las variables de colección

### Error de Autenticación
- El usuario admin debe existir en la base de datos
- Verifica las credenciales en las variables de colección

### Token Expirado
- Simplemente ejecuta cualquier endpoint
- El sistema automáticamente renovará el token

##  **Notas Importantes**

-  **JWT habilitado:** Todos los endpoints requieren autenticación
-  **Auto-login:** No necesitas copiar tokens manualmente
-  **Endpoints verificados:** Todas las URLs coinciden con los servidores
-  **Variables configuradas:** Listo para usar inmediatamente

¡Tu colección Postman está lista para probar toda la API Mind! 🎉
