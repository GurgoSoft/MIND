# Mind - Microservicios API para Gestion de Salud Mental

Sistema de microservicios escalable desarrollado en Node.js para la gestión integral de salud mental.

## Inicio Rapido

### Configuración (rápida - desarrollo)

- Terminal 1: iniciar nodemon y el microservicio de Usuarios

```powershell
cd mind\mind
npm install
npm run dev:users
```

- Terminal 2: iniciar el Frontend (Expo Web)

```powershell
cd mind\mind\mind-frontend
npm install
npm start
```

### Instalacion
```bash
npm install
```

### Configuracion
1. Copia el archivo de variables de entorno:
```bash
copy .env.example .env
```

2. Configura las variables en `.env`:
```env
MONGODB_URI=mongodb://admin:mind@191.96.31.136:28969/?directConnection=true
MONGODB_DB_NAME=mind_db
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=24h
JWT_DISABLED=false
```

### Control de Autenticación JWT

Para facilitar las pruebas y desarrollo inicial, puedes activar/desactivar la autenticación JWT:

#### Desactivar JWT (Para pruebas sin tokens)
```bash
# Método 1: Usando la utilidad
node scripts/jwt-toggle.js disable

# Método 2: Manual en .env
JWT_DISABLED=true
```

#### Activar JWT (Para producción)
```bash
# Método 1: Usando la utilidad
node scripts/jwt-toggle.js enable

# Método 2: Manual en .env
JWT_DISABLED=false
```

#### Verificar estado actual
```bash
node scripts/jwt-toggle.js status
```

**⚠️ Importante:** Después de cambiar el estado de JWT, reinicia los microservicios para aplicar los cambios.

#### Flujo de Testing Recomendado
1. **Desactivar JWT** para crear datos iniciales (países, usuarios, etc.)
2. **Crear datos base** sin necesidad de autenticación
3. **Activar JWT** para testing completo con seguridad
4. **Testear endpoints** con tokens de autenticación

### Semilla: Crear SuperAdministrador inicial

Para entrar a la vista de administración necesitas un usuario con rol SUPERADMIN. Hemos agregado un script de semilla para crearlo rápido.

1) Desactiva JWT temporalmente (para no requerir token al crear datos):

```powershell
cd mind\mind
node scripts\jwt-toggle.js disable
```

2) Establece (opcional) variables para personalizar el usuario inicial en `.env`:

```env
# Opcionales (tienen valores por defecto)
SEED_SUPERADMIN_EMAIL=superadmin@mind.com
SEED_SUPERADMIN_PASSWORD=admin1234
SEED_SUPERADMIN_TELEFONO=
SEED_SUPERADMIN_NOMBRES=Super
SEED_SUPERADMIN_APELLIDOS=Administrador
SEED_SUPERADMIN_TIPODOC=CC
SEED_SUPERADMIN_NUMDOC=9999999999
SEED_SUPERADMIN_FECHA_NAC=1990-01-01

# Si quieres forzar cambiar la contraseña si ya existe el usuario
SEED_RESET_PASSWORD=false
```

3) Ejecutar la semilla desde la raíz del proyecto:

```powershell
cd mind\mind
npm run seed:superadmin
```

Esto creará (o actualizará) los roles SUPERADMIN, ADMIN y USER; una persona base y un usuario SUPERADMIN con el email y contraseña definidos.

4) Reactiva JWT y reinicia los microservicios:

```powershell
node scripts\jwt-toggle.js enable
# Reinicia los servicios, por ejemplo:
npm run dev:users
```

5) Inicia sesión en el frontend con el SUPERADMIN y crea más administradores desde la vista de administración.

### Ejecutar Microservicios

**Ejecutar todos los microservicios:**
```bash
npm run start:all
```

**Ejecutar microservicios individuales:**
```bash
npm run start:admin     # Puerto 3001
npm run start:users     # Puerto 3002
npm run start:emotional # Puerto 3003
npm run start:agenda    # Puerto 3004
```

**Para desarrollo (con nodemon):**
```bash
npm run dev:all
```

**Para detener:** Presiona `Ctrl+C` en la terminal

## Endpoints Completos

### Microservicio Usuarios (Puerto 3002)

#### Autenticacion
- `POST /api/auth/register` - Registrar usuario
- `POST /api/auth/login` - Iniciar sesión
- `GET /api/auth/profile` - Obtener perfil del usuario
- `PUT /api/auth/profile` - Actualizar perfil
- `POST /api/auth/change-password` - Cambiar contraseña
- `POST /api/auth/logout` - Cerrar sesión

#### Gestion de Usuarios
- `GET /api/users/usuarios` - Listar usuarios 
- `GET /api/users/usuarios/:id` - Obtener usuario por ID
- `PUT /api/users/usuarios/:id` - Actualizar usuario
- `PATCH /api/users/usuarios/:id/toggle-active` - Activar/desactivar usuario

#### Gestion de Personas
- `GET /api/users/personas` - Listar personas
- `GET /api/users/personas/:id` - Obtener persona por ID
- `POST /api/users/personas` - Crear persona
- `PUT /api/users/personas/:id` - Actualizar persona
- `DELETE /api/users/personas/:id` - Eliminar persona

#### Suscripciones de Usuario
- `GET /api/users/suscripciones` - Listar suscripciones de usuarios
- `GET /api/users/suscripciones/:id` - Obtener suscripción por ID
- `GET /api/users/suscripciones/user/:idUsuario/active` - Suscripciones activas del usuario
- `GET /api/users/suscripciones/expiring` - Suscripciones próximas a expirar
- `GET /api/users/suscripciones/stats` - Estadísticas de suscripciones
- `POST /api/users/suscripciones` - Crear suscripción
- `PUT /api/users/suscripciones/:id` - Actualizar suscripción
- `PATCH /api/users/suscripciones/:id/cancel` - Cancelar suscripción
- `PATCH /api/users/suscripciones/:id/reactivate` - Reactivar suscripción
- `POST /api/users/suscripciones/user/:idUsuario/payment` - Configurar información de pago

#### Información de Pago
- `GET /api/users/informacionpago` - Listar información de pago
- `GET /api/users/informacionpago/:id` - Obtener información por ID
- `POST /api/users/informacionpago` - Crear información de pago
- `PUT /api/users/informacionpago/:id` - Actualizar información
- `DELETE /api/users/informacionpago/:id` - Eliminar información

#### Tipos de Usuario
- `GET /api/users/tiposusuarios` - Listar tipos de usuario
- `GET /api/users/tiposusuarios/:id` - Obtener tipo por ID
- `POST /api/users/tiposusuarios` - Crear tipo de usuario
- `PUT /api/users/tiposusuarios/:id` - Actualizar tipo
- `DELETE /api/users/tiposusuarios/:id` - Eliminar tipo

#### Auditoría de Usuarios
- `GET /api/users/auditoria` - Consultar registros de auditoría
- `GET /api/users/auditoria/stats` - Estadísticas de auditoría
- `GET /api/users/auditoria/cleanup` - Limpiar registros antiguos

### Microservicio Administrativo (Puerto 3001)

#### Datos Geograficos
- `GET /api/admin/estados` - Listar estados
- `GET /api/admin/estados/:id` - Obtener estado por ID
- `POST /api/admin/estados` - Crear estado
- `PUT /api/admin/estados/:id` - Actualizar estado
- `DELETE /api/admin/estados/:id` - Eliminar estado

- `GET /api/admin/paises` - Listar países
- `GET /api/admin/paises/:id` - Obtener país por ID
- `POST /api/admin/paises` - Crear país
- `PUT /api/admin/paises/:id` - Actualizar país
- `DELETE /api/admin/paises/:id` - Eliminar país

- `GET /api/admin/departamentos` - Listar departamentos
- `GET /api/admin/departamentos/:id` - Obtener departamento por ID
- `GET /api/admin/departamentos/pais/:idPais` - Departamentos por país
- `POST /api/admin/departamentos` - Crear departamento
- `PUT /api/admin/departamentos/:id` - Actualizar departamento
- `DELETE /api/admin/departamentos/:id` - Eliminar departamento

- `GET /api/admin/ciudades` - Listar ciudades
- `GET /api/admin/ciudades/:id` - Obtener ciudad por ID
- `GET /api/admin/ciudades/departamento/:idDepartamento` - Ciudades por departamento
- `POST /api/admin/ciudades` - Crear ciudad
- `PUT /api/admin/ciudades/:id` - Actualizar ciudad
- `DELETE /api/admin/ciudades/:id` - Eliminar ciudad

#### Control de Acceso
- `GET /api/admin/accesos` - Listar accesos
- `GET /api/admin/accesos/:id` - Obtener acceso por ID
- `GET /api/admin/accesos/usuario/:idUsuario` - Accesos del usuario
- `POST /api/admin/accesos` - Crear acceso
- `PUT /api/admin/accesos/:id` - Actualizar acceso
- `DELETE /api/admin/accesos/:id` - Eliminar acceso
- `POST /api/admin/accesos/:id/assign` - Asignar acceso a usuario
- `DELETE /api/admin/accesos/:id/revoke` - Revocar acceso de usuario

#### Variables del Sistema
- `GET /api/admin/variables` - Listar variables
- `GET /api/admin/variables/:id` - Obtener variable por ID
- `GET /api/admin/variables/ambiente/:ambiente` - Variables por ambiente
- `POST /api/admin/variables` - Crear variable
- `PUT /api/admin/variables/:id` - Actualizar variable
- `DELETE /api/admin/variables/:id` - Eliminar variable

#### Tipos de Variable
- `GET /api/admin/tiposvariable` - Listar tipos de variable
- `GET /api/admin/tiposvariable/:id` - Obtener tipo por ID
- `POST /api/admin/tiposvariable` - Crear tipo de variable
- `PUT /api/admin/tiposvariable/:id` - Actualizar tipo
- `DELETE /api/admin/tiposvariable/:id` - Eliminar tipo

#### Suscripciones
- `GET /api/admin/suscripciones` - Listar suscripciones
- `GET /api/admin/suscripciones/:id` - Obtener suscripción por ID
- `GET /api/admin/suscripciones/activas` - Suscripciones activas
- `POST /api/admin/suscripciones` - Crear suscripción
- `PUT /api/admin/suscripciones/:id` - Actualizar suscripción
- `PATCH /api/admin/suscripciones/:id/toggle-active` - Activar/desactivar suscripción
- `DELETE /api/admin/suscripciones/:id` - Eliminar suscripción

#### Tipos de Suscripción
- `GET /api/admin/tipossuscripcion` - Listar tipos de suscripción
- `GET /api/admin/tipossuscripcion/:id` - Obtener tipo por ID
- `POST /api/admin/tipossuscripcion` - Crear tipo de suscripción
- `PUT /api/admin/tipossuscripcion/:id` - Actualizar tipo
- `DELETE /api/admin/tipossuscripcion/:id` - Eliminar tipo

#### Menus del Sistema
- `GET /api/admin/menus` - Listar menús
- `GET /api/admin/menus/:id` - Obtener menú por ID
- `GET /api/admin/menus/tree` - Árbol jerárquico de menús
- `GET /api/admin/menus/:id/submenus` - Submenús de un menú
- `POST /api/admin/menus` - Crear menú
- `PUT /api/admin/menus/:id` - Actualizar menú
- `DELETE /api/admin/menus/:id` - Eliminar menú

#### Imágenes del Sistema
- `GET /api/admin/imagenes` - Listar imágenes
- `GET /api/admin/imagenes/:id` - Obtener imagen por ID
- `GET /api/admin/imagenes/tipo/:tipo` - Imágenes por tipo
- `POST /api/admin/imagenes` - Crear imagen
- `PUT /api/admin/imagenes/:id` - Actualizar imagen
- `PATCH /api/admin/imagenes/:id/toggle-active` - Activar/desactivar imagen
- `DELETE /api/admin/imagenes/:id` - Eliminar imagen

#### Notificaciones
- `GET /api/admin/notificaciones` - Listar notificaciones
- `GET /api/admin/notificaciones/:id` - Obtener notificación por ID
- `GET /api/admin/notificaciones/pendientes` - Notificaciones pendientes
- `GET /api/admin/notificaciones/usuario/:idUsuario` - Notificaciones del usuario
- `POST /api/admin/notificaciones` - Crear notificación
- `PUT /api/admin/notificaciones/:id` - Actualizar notificación
- `PATCH /api/admin/notificaciones/:id/mark-sent` - Marcar como enviada
- `DELETE /api/admin/notificaciones/:id` - Eliminar notificación

#### Tipos de Notificación
- `GET /api/admin/tiposnotificacion` - Listar tipos de notificación
- `GET /api/admin/tiposnotificacion/:id` - Obtener tipo por ID
- `POST /api/admin/tiposnotificacion` - Crear tipo de notificación
- `PUT /api/admin/tiposnotificacion/:id` - Actualizar tipo
- `DELETE /api/admin/tiposnotificacion/:id` - Eliminar tipo

#### Accesos de Usuario
- `GET /api/admin/accesosusuario` - Listar accesos de usuario
- `GET /api/admin/accesosusuario/:id` - Obtener acceso por ID
- `POST /api/admin/accesosusuario` - Asignar acceso a usuario
- `PUT /api/admin/accesosusuario/:id` - Actualizar acceso
- `DELETE /api/admin/accesosusuario/:id` - Revocar acceso

#### Auditoría Administrativa
- `GET /api/admin/auditoria` - Consultar registros de auditoría
- `GET /api/admin/auditoria/stats` - Estadísticas de auditoría
- `GET /api/admin/auditoria/cleanup` - Limpiar registros antiguos

### Microservicio Emocional (Puerto 3003)

#### Diarios Emocionales
- `GET /api/emotional/diarios` - Listar entradas de diario
- `GET /api/emotional/diarios/:id` - Obtener entrada por ID
- `GET /api/emotional/diarios/user/:idUsuario/stats` - Estadísticas del usuario
- `POST /api/emotional/diarios` - Crear entrada de diario
- `PUT /api/emotional/diarios/:id` - Actualizar entrada
- `DELETE /api/emotional/diarios/:id` - Eliminar entrada

#### Emociones
- `GET /api/emotional/emociones` - Listar emociones
- `GET /api/emotional/emociones/:id` - Obtener emoción por ID
- `GET /api/emotional/emociones/tipo/:idTipoEmocion` - Emociones por tipo
- `POST /api/emotional/emociones` - Crear emoción
- `PUT /api/emotional/emociones/:id` - Actualizar emoción
- `DELETE /api/emotional/emociones/:id` - Eliminar emoción

#### Sensaciones
- `GET /api/emotional/sensaciones` - Listar sensaciones
- `GET /api/emotional/sensaciones/:id` - Obtener sensación por ID
- `GET /api/emotional/sensaciones/tipo/:tipo` - Sensaciones por tipo
- `POST /api/emotional/sensaciones` - Crear sensación
- `PUT /api/emotional/sensaciones/:id` - Actualizar sensación
- `DELETE /api/emotional/sensaciones/:id` - Eliminar sensación

#### Síntomas
- `GET /api/emotional/sintomas` - Listar síntomas
- `GET /api/emotional/sintomas/:id` - Obtener síntoma por ID
- `GET /api/emotional/sintomas/tipo/:tipo` - Síntomas por tipo
- `POST /api/emotional/sintomas` - Crear síntoma
- `PUT /api/emotional/sintomas/:id` - Actualizar síntoma
- `DELETE /api/emotional/sintomas/:id` - Eliminar síntoma

#### Sentimientos
- `GET /api/emotional/sentimientos` - Listar sentimientos
- `GET /api/emotional/sentimientos/:id` - Obtener sentimiento por ID
- `GET /api/emotional/sentimientos/tipo/:tipo` - Sentimientos por tipo
- `POST /api/emotional/sentimientos` - Crear sentimiento
- `PUT /api/emotional/sentimientos/:id` - Actualizar sentimiento
- `DELETE /api/emotional/sentimientos/:id` - Eliminar sentimiento

#### Tipos de Emoción
- `GET /api/emotional/tiposemocion` - Listar tipos de emoción
- `GET /api/emotional/tiposemocion/:id` - Obtener tipo por ID
- `POST /api/emotional/tiposemocion` - Crear tipo de emoción
- `PUT /api/emotional/tiposemocion/:id` - Actualizar tipo
- `DELETE /api/emotional/tiposemocion/:id` - Eliminar tipo

#### Diario Emociones
- `GET /api/emotional/diariosemociones` - Listar registros de emociones en diario
- `GET /api/emotional/diariosemociones/:id` - Obtener registro por ID
- `GET /api/emotional/diariosemociones/diario/:diarioId` - Emociones por diario
- `POST /api/emotional/diariosemociones` - Registrar emoción en diario
- `PUT /api/emotional/diariosemociones/:id` - Actualizar registro
- `DELETE /api/emotional/diariosemociones/:id` - Eliminar registro

#### Diario Sensaciones
- `GET /api/emotional/diariossensaciones` - Listar registros de sensaciones en diario
- `GET /api/emotional/diariossensaciones/:id` - Obtener registro por ID
- `GET /api/emotional/diariossensaciones/diario/:diarioId` - Sensaciones por diario
- `POST /api/emotional/diariossensaciones` - Registrar sensación en diario
- `PUT /api/emotional/diariossensaciones/:id` - Actualizar registro
- `DELETE /api/emotional/diariossensaciones/:id` - Eliminar registro

#### Diario Sentimientos
- `GET /api/emotional/diariossentimientos` - Listar registros de sentimientos en diario
- `GET /api/emotional/diariossentimientos/:id` - Obtener registro por ID
- `GET /api/emotional/diariossentimientos/diario/:diarioId` - Sentimientos por diario
- `POST /api/emotional/diariossentimientos` - Registrar sentimiento en diario
- `PUT /api/emotional/diariossentimientos/:id` - Actualizar registro
- `DELETE /api/emotional/diariossentimientos/:id` - Eliminar registro

#### Diario Síntomas
- `GET /api/emotional/diariossintomas` - Listar registros de síntomas en diario
- `GET /api/emotional/diariossintomas/:id` - Obtener registro por ID
- `GET /api/emotional/diariossintomas/diario/:diarioId` - Síntomas por diario
- `POST /api/emotional/diariossintomas` - Registrar síntoma en diario
- `PUT /api/emotional/diariossintomas/:id` - Actualizar registro
- `DELETE /api/emotional/diariossintomas/:id` - Eliminar registro

#### Auditoría Emocional
- `GET /api/emotional/diariosauditoria` - Consultar registros de auditoría
- `GET /api/emotional/diariosauditoria/stats` - Estadísticas de auditoría
- `GET /api/emotional/diariosauditoria/cleanup` - Limpiar registros antiguos

### Microservicio Agenda (Puerto 3004)

#### Agendas
- `GET /api/schedule/agendas` - Listar agendas
- `GET /api/schedule/agendas/:id` - Obtener agenda por ID
- `GET /api/schedule/agendas/user/:idUsuario` - Agendas del usuario
- `GET /api/schedule/agendas/tipo/:idTipoAgenda` - Agendas por tipo
- `GET /api/schedule/agendas/:idAgenda/dias` - Días de una agenda
- `POST /api/schedule/agendas` - Crear agenda
- `POST /api/schedule/agendas/:idAgenda/dias` - Crear día de agenda
- `PUT /api/schedule/agendas/:id` - Actualizar agenda
- `DELETE /api/schedule/agendas/:id` - Eliminar agenda

#### Citas
- `GET /api/schedule/citas` - Listar citas
- `GET /api/schedule/citas/:id` - Obtener cita por ID
- `GET /api/schedule/citas/user/:idUsuario` - Citas del usuario
- `POST /api/schedule/citas` - Crear cita
- `PUT /api/schedule/citas/:id` - Actualizar cita
- `PATCH /api/schedule/citas/:id/cancel` - Cancelar cita
- `PATCH /api/schedule/citas/:id/complete` - Completar cita
- `POST /api/schedule/citas/:id/content` - Agregar contenido a cita

#### Diagnosticos
- `GET /api/schedule/diagnosticos/tipos` - Listar tipos de diagnóstico
- `GET /api/schedule/diagnosticos/tipos/:id` - Obtener tipo por ID
- `GET /api/schedule/diagnosticos/cita/:idCita` - Diagnósticos de una cita
- `POST /api/schedule/diagnosticos/tipos` - Crear tipo de diagnóstico
- `POST /api/schedule/diagnosticos/cita/:idCita` - Crear diagnóstico para cita
- `PUT /api/schedule/diagnosticos/tipos/:id` - Actualizar tipo
- `PUT /api/schedule/diagnosticos/:id` - Actualizar diagnóstico
- `DELETE /api/schedule/diagnosticos/tipos/:id` - Eliminar tipo
- `DELETE /api/schedule/diagnosticos/:id` - Eliminar diagnóstico

#### Seguimientos
- `GET /api/schedule/seguimientos` - Listar seguimientos
- `GET /api/schedule/seguimientos/:id` - Obtener seguimiento por ID
- `GET /api/schedule/seguimientos/pending` - Seguimientos pendientes
- `GET /api/schedule/seguimientos/patient/:idUsuarioPaciente` - Seguimientos del paciente
- `GET /api/schedule/seguimientos/cita/:idCita` - Seguimientos de una cita
- `POST /api/schedule/seguimientos` - Crear seguimiento
- `PUT /api/schedule/seguimientos/:id` - Actualizar seguimiento
- `DELETE /api/schedule/seguimientos/:id` - Eliminar seguimiento

#### Tipos de Agenda
- `GET /api/schedule/tiposagenda` - Listar tipos de agenda
- `GET /api/schedule/tiposagenda/:id` - Obtener tipo por ID
- `POST /api/schedule/tiposagenda` - Crear tipo de agenda
- `PUT /api/schedule/tiposagenda/:id` - Actualizar tipo
- `DELETE /api/schedule/tiposagenda/:id` - Eliminar tipo

#### Agenda Días
- `GET /api/schedule/agendadias` - Listar días de agenda
- `GET /api/schedule/agendadias/:id` - Obtener día por ID
- `GET /api/schedule/agendadias/agenda/:idAgenda` - Días de una agenda específica
- `POST /api/schedule/agendadias` - Crear día de agenda
- `PUT /api/schedule/agendadias/:id` - Actualizar día
- `DELETE /api/schedule/agendadias/:id` - Eliminar día

#### Citas Contenido
- `GET /api/schedule/citascontenido` - Listar contenido de citas
- `GET /api/schedule/citascontenido/:id` - Obtener contenido por ID
- `GET /api/schedule/citascontenido/cita/:idCita` - Contenido de una cita
- `POST /api/schedule/citascontenido` - Crear contenido de cita
- `PUT /api/schedule/citascontenido/:id` - Actualizar contenido
- `DELETE /api/schedule/citascontenido/:id` - Eliminar contenido

#### Citas Diagnóstico
- `GET /api/schedule/citasdiagnostico` - Listar diagnósticos de citas
- `GET /api/schedule/citasdiagnostico/:id` - Obtener diagnóstico por ID
- `GET /api/schedule/citasdiagnostico/cita/:idCita` - Diagnósticos de una cita
- `POST /api/schedule/citasdiagnostico` - Crear diagnóstico de cita
- `PUT /api/schedule/citasdiagnostico/:id` - Actualizar diagnóstico
- `DELETE /api/schedule/citasdiagnostico/:id` - Eliminar diagnóstico

#### Tipos de Diagnóstico
- `GET /api/schedule/tiposdiagnostico` - Listar tipos de diagnóstico
- `GET /api/schedule/tiposdiagnostico/:id` - Obtener tipo por ID
- `POST /api/schedule/tiposdiagnostico` - Crear tipo de diagnóstico
- `PUT /api/schedule/tiposdiagnostico/:id` - Actualizar tipo
- `DELETE /api/schedule/tiposdiagnostico/:id` - Eliminar tipo

#### Registros de Cita
- `GET /api/schedule/registroscita` - Listar registros de cita
- `GET /api/schedule/registroscita/:id` - Obtener registro por ID
- `GET /api/schedule/registroscita/cita/:idCita` - Registros de una cita
- `POST /api/schedule/registroscita` - Crear registro de cita
- `PUT /api/schedule/registroscita/:id` - Actualizar registro
- `DELETE /api/schedule/registroscita/:id` - Eliminar registro

#### Auditoría de Agenda
- `GET /api/schedule/agendaauditoria` - Consultar registros de auditoría
- `GET /api/schedule/agendaauditoria/stats` - Estadísticas de auditoría
- `GET /api/schedule/agendaauditoria/cleanup` - Limpiar registros antiguos

## Autenticacion

La mayoría de endpoints requieren autenticación JWT. Para usar los endpoints protegidos:

1. **Registrar usuario:**
```bash
POST /api/auth/register
{
  "email": "usuario@ejemplo.com",
  "password": "contraseña123",
  "idPersona": "ID_DE_PERSONA",
  "idTipoUsuario": "ID_TIPO_USUARIO"
}
```

2. **Iniciar sesión:**
```bash
POST /api/auth/login
{
  "email": "usuario@ejemplo.com",
  "password": "contraseña123"
}
```

3. **Usar el token en headers:**
```bash
Authorization: Bearer <JWT_TOKEN>
```

## Health Checks

Cada microservicio tiene un endpoint de salud:
- Administrativo: http://localhost:3001/health
- Usuarios: http://localhost:3002/health
- Emocional: http://localhost:3003/health
- Agenda: http://localhost:3004/health

## Estructura del Proyecto

```
mind/
├── services/
│   ├── administrativo/
│   │   ├── controllers/
│   │   ├── routes/
│   │   └── server.js
│   ├── agenda/
│   │   ├── controllers/
│   │   ├── routes/
│   │   └── server.js
│   ├── emocional/
│   │   ├── controllers/
│   │   ├── routes/
│   │   └── server.js
│   └── usuarios/
│       ├── controllers/
│       ├── routes/
│       └── server.js
├── shared/
│   ├── config/
│   │   └── database.js
│   ├── middleware/
│   │   ├── auth.js
│   │   ├── errorHandler.js
│   │   └── validation.js
│   └── models/
│       ├── administrativo/
│       ├── agenda/
│       ├── emocional/
│       └── usuarios/
├── docs/
│   ├── README.md
│   ├── api-examples.md
│   ├── testing-guide.md
│   └── postman-collection.json
├── scripts/
│   ├── jwt-toggle.js
│   └── fix-validation.js
├── .env
├── .gitignore
├── package-lock.json
└── package.json
```

## Tecnologias

- **Node.js** - Runtime de JavaScript
- **Express.js** - Framework web
- **MongoDB** - Base de datos NoSQL
- **Mongoose** - ODM para MongoDB
- **JWT** - Autenticación
- **Joi** - Validación de datos
- **bcryptjs** - Encriptación de contraseñas
- **Concurrently** - Ejecución paralela de servicios

## JWT Toggle System

Para facilitar el testing y desarrollo, el sistema incluye una utilidad para activar/desactivar JWT:

```bash
# Desactivar JWT para testing inicial
node scripts/jwt-toggle.js disable

# Activar JWT para producción
node scripts/jwt-toggle.js enable

# Ver estado actual
node scripts/jwt-toggle.js status
```

Cuando JWT está desactivado (`JWT_DISABLED=true` en `.env`), todos los endpoints protegidos son accesibles sin token de autenticación.

## Documentación Adicional

- **[api-examples.md](./api-examples.md)** - Ejemplos JSON completos para todos los endpoints
- **[testing-guide.md](./testing-guide.md)** - Guía de testing y lista de endpoints
- **[postman-collection.json](./postman-collection.json)** - Colección de Postman lista para importar

## Características del Sistema

### Funcionalidades Implementadas
- ✅ **CRUD Completo** - Todos los modelos tienen operaciones completas
- ✅ **Auditoría Automática** - Logging de todas las operaciones de datos
- ✅ **Validación Robusta** - Validación con Joi en todos los endpoints
- ✅ **Paginación** - Implementada en todos los listados
- ✅ **Filtrado Avanzado** - Búsqueda y filtros en endpoints de consulta
- ✅ **Autenticación JWT** - Sistema de tokens con toggle para desarrollo
- ✅ **Rate Limiting** - Protección contra abuso de API
- ✅ **CORS Configurado** - Soporte para aplicaciones web
- ✅ **Manejo de Errores** - Sistema centralizado de manejo de errores
- ✅ **Health Checks** - Endpoints de salud para monitoreo

### Arquitectura de Microservicios
- **Usuarios** (3002) - Gestión de usuarios, personas y suscripciones
- **Administrativo** (3001) - Datos geográficos, configuración y administración
- **Emocional** (3003) - Diarios emocionales y seguimiento de estado mental
- **Agenda** (3004) - Citas, diagnósticos y seguimiento de pacientes

### Nuevas Funcionalidades Agregadas
- **17 Nuevos Controladores** creados para completar todos los modelos
- **Nombres Consistentes** - Todos los controladores coinciden con nombres de modelos
- **Auditoría Completa** - Endpoints de auditoría para todos los módulos
- **Tipos de Datos** - Controladores para tipos de notificación, suscripción, variable, etc.
- **Relaciones Avanzadas** - Gestión de relaciones entre diarios y emociones/sensaciones/síntomas

## Notas Importantes

- Todos los endpoints incluyen paginación donde aplica
- Se implementa logging de auditoría completo
- Validación de datos con Joi en todos los endpoints
- Manejo centralizado de errores
- Rate limiting para seguridad
- Soporte para CORS configurado
- Sistema JWT con toggle para desarrollo y testing
- Documentación completa con ejemplos JSON y colección Postman