# Guía de Testing - API Mind Microservices

##  Activar/Desactivar JWT

### Método Rápido
```bash
# Desactivar JWT para testing inicial
node jwt-toggle.js disable

# Activar JWT para producción
node jwt-toggle.js enable

# Ver estado actual
node jwt-toggle.js status
```

### Método Manual
Editar el archivo `.env` y cambiar:
```
JWT_DISABLED=true   # Para desactivar JWT
JWT_DISABLED=false  # Para activar JWT
```

##  Iniciar Servicios

```bash
# Iniciar todos los microservicios
npm run dev:all

# O iniciar servicios individuales
npm run dev:users      # Puerto 3002
npm run dev:admin      # Puerto 3001  
npm run dev:emotional  # Puerto 3003
npm run dev:agenda     # Puerto 3004
```

##  Endpoints Disponibles

###  Servicio de Usuarios (Puerto 3002)

#### Autenticación
- `POST http://localhost:3002/api/auth/register` - Registrar usuario
- `POST http://localhost:3002/api/auth/login` - Iniciar sesión
- `GET http://localhost:3002/api/auth/profile` - Obtener perfil (requiere JWT)
- `PUT http://localhost:3002/api/auth/profile` - Actualizar perfil (requiere JWT)
- `PUT http://localhost:3002/api/auth/change-password` - Cambiar contraseña (requiere JWT)
- `POST http://localhost:3002/api/auth/logout` - Cerrar sesión (requiere JWT)

#### Gestión de Usuarios
- `GET http://localhost:3002/api/users/usuarios` - Listar usuarios (requiere JWT)
- `GET http://localhost:3002/api/users/usuarios/stats` - Estadísticas usuarios (requiere JWT)
- `GET http://localhost:3002/api/users/usuarios/:id` - Obtener usuario por ID (requiere JWT)
- `PUT http://localhost:3002/api/users/usuarios/:id` - Actualizar usuario (requiere JWT)
- `PATCH http://localhost:3002/api/users/usuarios/:id/toggle-active` - Activar/desactivar usuario (requiere JWT)
- `PATCH http://localhost:3002/api/users/usuarios/:id/unblock` - Desbloquear usuario (requiere JWT)
- `DELETE http://localhost:3002/api/users/usuarios/:id` - Eliminar usuario (requiere JWT)

#### Gestión de Personas
- `GET http://localhost:3002/api/users/personas` - Listar personas
- `POST http://localhost:3002/api/users/personas` - Crear persona
- `GET http://localhost:3002/api/users/personas/:id` - Obtener persona por ID
- `PUT http://localhost:3002/api/users/personas/:id` - Actualizar persona
- `DELETE http://localhost:3002/api/users/personas/:id` - Eliminar persona

#### Suscripciones
- `GET http://localhost:3002/api/users/suscripciones` - Listar suscripciones
- `POST http://localhost:3002/api/users/suscripciones` - Crear suscripción
- `GET http://localhost:3002/api/users/suscripciones/:id` - Obtener suscripción por ID
- `PUT http://localhost:3002/api/users/suscripciones/:id` - Actualizar suscripción
- `DELETE http://localhost:3002/api/users/suscripciones/:id` - Eliminar suscripción

###  Servicio Administrativo (Puerto 3001)

#### Países, Departamentos y Ciudades
- `GET http://localhost:3001/api/admin/paises` - Listar países
- `POST http://localhost:3001/api/admin/paises` - Crear país
- `GET http://localhost:3001/api/admin/paises/:id` - Obtener país por ID
- `PUT http://localhost:3001/api/admin/paises/:id` - Actualizar país
- `DELETE http://localhost:3001/api/admin/paises/:id` - Eliminar país

- `GET http://localhost:3001/api/admin/departamentos` - Listar departamentos
- `POST http://localhost:3001/api/admin/departamentos` - Crear departamento
- `GET http://localhost:3001/api/admin/departamentos/:id` - Obtener departamento por ID
- `PUT http://localhost:3001/api/admin/departamentos/:id` - Actualizar departamento
- `DELETE http://localhost:3001/api/admin/departamentos/:id` - Eliminar departamento

- `GET http://localhost:3001/api/admin/ciudades` - Listar ciudades
- `POST http://localhost:3001/api/admin/ciudades` - Crear ciudad
- `GET http://localhost:3001/api/admin/ciudades/:id` - Obtener ciudad por ID
- `PUT http://localhost:3001/api/admin/ciudades/:id` - Actualizar ciudad
- `DELETE http://localhost:3001/api/admin/ciudades/:id` - Eliminar ciudad

#### Otros Módulos Administrativos
- Estados: `http://localhost:3001/api/admin/estados`
- Variables: `http://localhost:3001/api/admin/variables`
- Menús: `http://localhost:3001/api/admin/menus`
- Accesos: `http://localhost:3001/api/admin/accesos`
- Accesos de Usuario: `http://localhost:3001/api/admin/accesos-usuario`
- Auditoría Administrativa: `http://localhost:3001/api/admin/auditoria`
- Notificaciones: `http://localhost:3001/api/admin/notificaciones`
- Tipos de Notificación: `http://localhost:3001/api/admin/tipos-notificacion`
- Suscripciones: `http://localhost:3001/api/admin/suscripciones`
- Tipos de Suscripción: `http://localhost:3001/api/admin/tipos-suscripcion`
- Tipos de Variable: `http://localhost:3001/api/admin/tipos-variable`
- Imágenes del Sistema: `http://localhost:3001/api/admin/imagenes-sistema`

###  Servicio Emocional (Puerto 3003)
- Tipos de Emoción: `http://localhost:3003/api/emotional/tipos-emocion`
- Emociones: `http://localhost:3003/api/emotional/emociones`
- Sentimientos: `http://localhost:3003/api/emotional/sentimientos`
- Sensaciones: `http://localhost:3003/api/emotional/sensaciones`
- Síntomas: `http://localhost:3003/api/emotional/sintomas`
- Diario: `http://localhost:3003/api/emotional/diarios`
- Diario Auditoría: `http://localhost:3003/api/emotional/diarios-auditoria`
- Diario Emociones: `http://localhost:3003/api/emotional/diarios-emociones`
- Diario Sensaciones: `http://localhost:3003/api/emotional/diarios-sensaciones`
- Diario Sentimientos: `http://localhost:3003/api/emotional/diarios-sentimientos`
- Diario Síntomas: `http://localhost:3003/api/emotional/diarios-sintomas`

###  Servicio de Agenda (Puerto 3004)
- Tipos de Agenda: `http://localhost:3004/api/schedule/tipos-agenda`
- Tipos de Diagnóstico: `http://localhost:3004/api/schedule/tipos-diagnostico`
- Agenda: `http://localhost:3004/api/schedule/agendas`
- Agenda Auditoría: `http://localhost:3004/api/schedule/agenda-auditoria`
- Agenda Días: `http://localhost:3004/api/schedule/agenda-dias`
- Citas: `http://localhost:3004/api/schedule/citas`
- Citas Contenido: `http://localhost:3004/api/schedule/citas-contenido`
- Citas Diagnóstico: `http://localhost:3004/api/schedule/citas-diagnostico`
- Registros de Cita: `http://localhost:3004/api/schedule/registros-cita`
- Diagnósticos: `http://localhost:3004/api/schedule/diagnosticos`
- Seguimientos: `http://localhost:3004/api/schedule/seguimientos`

##  Flujo de Testing Recomendado

### 1. Preparación Inicial
```bash
# 1. Desactivar JWT
node jwt-toggle.js disable

# 2. Iniciar servicios
npm run dev:all
```

### 2. Crear Datos Base (Sin JWT)
1. **Crear países, departamentos y ciudades** (Servicio Admin)
2. **Crear tipos de usuario** (Servicio Admin)
3. **Crear estados** (Servicio Admin)
4. **Crear variables del sistema** (Servicio Admin)

### 3. Crear Usuarios Iniciales
1. **Crear personas** (Servicio Usuarios)
2. **Registrar usuarios** usando `http://localhost:3002/api/auth/register`

### 4. Activar JWT y Testing Completo
```bash
# Activar JWT
node jwt-toggle.js enable

# Reiniciar servicios para aplicar cambios
```

### 5. Testing con Autenticación
1. **Login** para obtener token JWT
2. **Testear todos los endpoints** con token
3. **Verificar permisos** y validaciones

##  Health Checks
- Usuarios: `GET http://localhost:3002/health`
- Admin: `GET http://localhost:3001/health`
- Emocional: `GET http://localhost:3003/health`
- Agenda: `GET http://localhost:3004/health`

##  Notas Importantes

1. **JWT Desactivado**: Cuando `JWT_DISABLED=true`, todos los endpoints protegidos son accesibles sin token
2. **Reiniciar Servicios**: Después de cambiar `JWT_DISABLED`, reinicia los servicios
3. **Datos de Prueba**: Usa el modo sin JWT solo para crear datos iniciales
4. **Producción**: Siempre mantén JWT activado en producción
5. **Rate Limiting**: Los endpoints de auth tienen límite de 5 requests por 15 minutos por IP
