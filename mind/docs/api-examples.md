# Ejemplos JSON para Testing - API Mind Microservices

Esta guía contiene ejemplos de JSON para todos los endpoints de la API, organizados por microservicio para facilitar el testing por parte del equipo de QA.

##  Microservicio de Usuarios (Puerto 3002)

### Autenticación

#### POST http://localhost:3002/api/auth/register
```json
{
  "persona": {
    "nombres": "Juan Carlos",
    "apellidos": "Pérez García",
    "tipoDoc": "CC",
    "numDoc": "12345678",
    "fechaNacimiento": "1990-05-15",
    "idPais": "507f1f77bcf86cd799439011", #reemplazar por id  registrado
    "idDepartamento": "507f1f77bcf86cd799439012", #reemplazar por id  registrado
    "idCiudad": "507f1f77bcf86cd799439013" #reemplazar por id  registrado
  },
  "usuario": {
    "idTipoUsuario": "507f1f77bcf86cd799439014",#reemplazar por id  registrado
    "email": "juan.perez@example.com",
    "telefono": "+573001234567",
    "passwordHash": "MiPassword123!"
  }
}
```

#### POST http://localhost:3002/api/auth/login
```json
{
  "email": "juan.perez@example.com",
  "password": "MiPassword123!"
}
```

#### PUT http://localhost:3002/api/auth/profile
```json
{
  "persona": {
    "nombres": "Juan Carlos",
    "apellidos": "Pérez García",
    "telefono": "+573009876543"
  },
  "usuario": {
    "email": "juan.carlos@example.com"
  }
}
```

#### PUT http://localhost:3002/api/auth/change-password
```json
{
  "currentPassword": "MiPassword123!",
  "newPassword": "NuevoPassword456!"
}
```

### Gestión de Personas

#### POST http://localhost:3002/api/users/personas
```json
{
  "nombres": "María Elena",
  "apellidos": "González López",
  "tipoDoc": "CC",
  "numDoc": "87654321",
  "fechaNacimiento": "1985-08-20",
  "idPais": "507f1f77bcf86cd799439011", #reemplazar por id  registrado
  "idDepartamento": "507f1f77bcf86cd799439012", #reemplazar por id  registrado
  "idCiudad": "507f1f77bcf86cd799439013" #reemplazar por id  registrado
}
```

#### PUT http://localhost:3002/api/users/personas/:id
```json
{
  "nombres": "María Elena",
  "apellidos": "González Rodríguez",
  "telefono": "+573001234567",
  "idCiudad": "507f1f77bcf86cd799439015" #reemplazar por id  registrado
}
```

### Gestión de Usuarios

#### PUT http://localhost:3002/api/users/usuarios/:id
```json
{
  "idTipoUsuario": "507f1f77bcf86cd799439014", #reemplazar por id  registrado
  "email": "nuevo.email@example.com",
  "telefono": "+573009876543",
  "activo": true
}
```

### Suscripciones de Usuario

#### POST http://localhost:3002/api/users/suscripciones
```json
{
  "idUsuario": "507f1f77bcf86cd799439020", #reemplazar por id  registrado
  "idSuscripcion": "507f1f77bcf86cd799439021", #reemplazar por id  registrado
  "fechaInicio": "2024-01-01",
  "fechaFin": "2024-12-31",
  "estado": "activa",
  "metodoPago": "tarjeta_credito"
}
```

#### PUT http://localhost:3002/api/users/suscripciones/:id
```json
{
  "fechaFin": "2025-12-31",
  "estado": "activa",
  "metodoPago": "transferencia"
}
```

## 🏛️ Microservicio Administrativo (Puerto 3001)

### Países

#### POST http://localhost:3001/api/admin/paises
```json
{
  "nombre": "Colombia",
  "codigoISO": "CO"
}
```

#### PUT http://localhost:3001/api/admin/paises/:id
```json
{
  "nombre": "República de Colombia",
  "codigoISO": "COL"
}
```

### Departamentos

#### POST http://localhost:3001/api/admin/departamentos
```json
{
  "idPais": "507f1f77bcf86cd799439011", #reemplazar por id  registrado
  "nombre": "Antioquia",
  "codigoDANE": "05"
}
```

#### PUT http://localhost:3001/api/admin/departamentos/:id
```json
{
  "nombre": "Antioquia",
  "codigoDANE": "05"
}
```

### Ciudades

#### POST http://localhost:3001/api/admin/ciudades
```json
{
  "idDepartamento": "507f1f77bcf86cd799439012", #reemplazar por id  registrado
  "nombre": "Medellín",
  "codigoDANE": "05001"
}
```

#### PUT http://localhost:3001/api/admin/ciudades/:id
```json
{
  "nombre": "Medellín",
  "codigoDANE": "05001"
}
```

### Estados

#### POST http://localhost:3001/api/admin/estados
```json
{
  "codigo": "ACT",
  "nombre": "Activo",
  "descripcion": "Estado activo del sistema",
  "color": "#28a745"
}
```

#### PUT http://localhost:3001/api/admin/estados/:id
```json
{
  "nombre": "Activo",
  "descripcion": "Estado activo y funcional",
  "color": "#28a745"
}
```

### Variables del Sistema

#### POST http://localhost:3001/api/admin/variables
```json
{
  "idTipoVariable": "507f1f77bcf86cd799439030", #reemplazar por id  registrado
  "codigo": "MAX_INTENTOS_LOGIN",
  "nombre": "Máximo intentos de login",
  "valor": "5",
  "descripcion": "Número máximo de intentos fallidos de login antes de bloquear"
}
```

#### PUT http://localhost:3001/api/admin/variables/:id
```json
{
  "valor": "3",
  "descripcion": "Número máximo de intentos fallidos de login antes de bloquear la cuenta"
}
```

### Menús

#### POST http://localhost:3001/api/admin/menus
```json
{
  "codigo": "DASHBOARD", #reemplazar por codigo registrado
  "nombre": "Dashboard",
  "descripcion": "Panel principal del sistema",
  "icono": "dashboard",
  "url": "/dashboard",
  "orden": 1,
  "activo": true
}
```

#### PUT http://localhost:3001/api/admin/menus/:id
```json
{
  "nombre": "Panel de Control",
  "descripcion": "Panel principal del sistema administrativo",
  "orden": 1
}
```

### Accesos

#### POST http://localhost:3001/api/admin/accesos
```json
{
  "codigo": "USER_READ", #reemplazar por codigo registrado
  "nombre": "Leer Usuarios",
  "descripcion": "Permiso para consultar información de usuarios",
  "modulo": "usuarios"
}
```

#### PUT http://localhost:3001/api/admin/accesos/:id
```json
{
  "nombre": "Consultar Usuarios",
  "descripcion": "Permiso para consultar y visualizar información de usuarios"
}
```

### Notificaciones

#### POST http://localhost:3001/api/admin/notificaciones
```json
{
  "idTipoNotificacion": "507f1f77bcf86cd799439040", #reemplazar por id  registrado
  "idUsuario": "507f1f77bcf86cd799439020", #reemplazar por id  registrado
  "titulo": "Bienvenido al sistema",
  "mensaje": "Tu cuenta ha sido creada exitosamente",
  "leida": false,
  "fechaEnvio": "2024-01-15T10:00:00.000Z"
}
```

#### PUT http://localhost:3001/api/admin/notificaciones/:id
```json
{
  "leida": true,
  "fechaLectura": "2024-01-15T10:30:00.000Z"
}
```

### Suscripciones

#### POST http://localhost:3001/api/admin/suscripciones
```json
{
  "idTipoSuscripcion": "507f1f77bcf86cd799439050", #reemplazar por id  registrado
  "codigo": "PREMIUM_MONTHLY", #reemplazar por codigo registrado
  "nombre": "Premium Mensual",
  "descripcion": "Suscripción premium con acceso completo por 1 mes",
  "precio": 29.99,
  "duracionDias": 30,
  "activa": true
}
```

#### PUT http://localhost:3001/api/admin/suscripciones/:id
```json
{
  "nombre": "Premium Mensual Plus",
  "precio": 34.99,
  "descripcion": "Suscripción premium con acceso completo y beneficios adicionales"
}
```

### Nuevos Endpoints Administrativos

#### Accesos de Usuario
**POST http://localhost:3001/api/admin/accesos-usuario**
```json
{
  "idAcceso": "507f1f77bcf86cd799439100", #reemplazar por id registrado
  "idUsuario": "507f1f77bcf86cd799439020", #reemplazar por id registrado
  "fechaAsignacion": "2024-01-15T10:00:00.000Z",
  "activo": true
}
```

#### Tipos de Notificación
**POST http://localhost:3001/api/admin/tiposnotificacion**
```json
{
  "codigo": "EMAIL_WELCOME",
  "nombre": "Email de Bienvenida",
  "descripcion": "Notificación de bienvenida enviada por email",
  "canal": "email",
  "activo": true
}
```

#### Tipos de Suscripción
**POST http://localhost:3001/api/admin/tipossuscripcion**
```json
{
  "codigo": "PREMIUM",
  "nombre": "Premium",
  "descripcion": "Suscripción premium con acceso completo",
  "activo": true
}
```

#### Tipos de Variable
**POST http://localhost:3001/api/admin/tiposvariable**
```json
{
  "codigo": "CONFIG",
  "nombre": "Configuración",
  "descripcion": "Variables de configuración del sistema",
  "activo": true
}
```

#### Auditoría Administrativa
**GET http://localhost:3001/api/admin/auditoria** - Consultar registros de auditoría
**GET http://localhost:3001/api/admin/auditoria/stats** - Estadísticas de auditoría

### Imágenes del Sistema

#### POST http://localhost:3001/api/admin/imagenes-sistema
```json
{
  "codigo": "LOGO_PRINCIPAL", #reemplazar por codigo registrado
  "nombre": "Logo Principal",
  "descripcion": "Logo principal del sistema",
  "url": "https://example.com/images/logo.png", #reemplazar por url DE IMAGEN
  "tipo": "logo",
  "activa": true
}
```

#### PUT http://localhost:3001/api/admin/imagenes-sistema/:id
```json
{
  "nombre": "Logo Principal Actualizado",
  "url": "https://example.com/images/logo-v2.png", #reemplazar por url DE IMAGEN
  "descripcion": "Logo principal del sistema versión 2024"
}
```

## 💭 Microservicio Emocional (Puerto 3003)

### Tipos de Emoción

#### POST http://localhost:3003/api/emotional/tiposemocion
```json
{
  "codigo": "POSITIVA",
  "nombre": "Emoción Positiva",
  "descripcion": "Emociones que generan bienestar",
  "activo": true
}
```

### Emociones

#### POST http://localhost:3003/api/emotional/emociones
```json
{
  "idTipoEmocion": "507f1f77bcf86cd799439060",#reemplazar por id  registrado
  "idEmocion": "ALEGRIA_001",
  "nombre": "Alegría",
  "descripcion": "Sentimiento de felicidad y bienestar"
}
```

#### PUT http://localhost:3003/api/emotional/emociones/:id
```json
{
  "nombre": "Alegría Intensa",
  "descripcion": "Sentimiento profundo de felicidad y bienestar emocional"
}
```

### Nuevos Endpoints Emocionales

#### Diario Emoción
**POST http://localhost:3003/api/emotional/diarios-emociones**
```json
{
  "idDiario": "507f1f77bcf86cd799439200", #reemplazar por id registrado
  "idEmocion": "507f1f77bcf86cd799439070", #reemplazar por id registrado
  "intensidad": 8,
  "notas": "Sentí mucha alegría durante la reunión familiar"
}
```

#### Diario Sensación
**POST http://localhost:3003/api/emotional/diarios-sensaciones**
```json
{
  "idDiario": "507f1f77bcf86cd799439200", #reemplazar por id registrado
  "idSensacion": "507f1f77bcf86cd799439201", #reemplazar por id registrado
  "intensidad": 7,
  "duracion": 30,
  "notas": "Sensación de calma después de meditar"
}
```

#### Diario Sentimiento
**POST http://localhost:3003/api/emotional/diarios-sentimientos**
```json
{
  "idDiario": "507f1f77bcf86cd799439200", #reemplazar por id registrado
  "idSentimiento": "507f1f77bcf86cd799439202", #reemplazar por id registrado
  "intensidad": 9,
  "contexto": "familiar",
  "notas": "Amor profundo hacia mi familia"
}
```

#### Diario Síntoma
**POST http://localhost:3003/api/emotional/diarios-sintomas**
```json
{
  "idDiario": "507f1f77bcf86cd799439200", #reemplazar por id registrado
  "idSintoma": "507f1f77bcf86cd799439203", #reemplazar por id registrado
  "intensidad": 3,
  "duracion": 15,
  "notas": "Ansiedad leve antes de la presentación"
}
```

#### Auditoría Diario
**GET http://localhost:3003/api/emotional/diarios-auditoria** - Consultar registros de auditoría
**GET http://localhost:3003/api/emotional/diarios-auditoria/stats** - Estadísticas de auditoría

### Sentimientos

#### POST http://localhost:3003/api/emotional/sentimientos
```json
{
  "codigo": "AMOR",
  "nombre": "Amor",
  "descripcion": "Sentimiento de afecto profundo hacia otra persona",
  "intensidad": "alta",
  "activo": true
}
```

#### PUT http://localhost:3003/api/emotional/sentimientos/:id
```json
{
  "descripcion": "Sentimiento de afecto profundo y cariño hacia otra persona o situación",
  "intensidad": "muy_alta"
}
```

### Sensaciones

#### POST http://localhost:3003/api/emotional/sensaciones
```json
{
  "codigo": "CALMA",
  "nombre": "Calma",
  "descripcion": "Sensación de tranquilidad y paz interior",
  "tipo": "positiva",
  "activa": true
}
```

#### PUT http://localhost:3003/api/emotional/sensaciones/:id
```json
{
  "nombre": "Calma Profunda",
  "descripcion": "Sensación intensa de tranquilidad y paz interior completa"
}
```

### Síntomas

#### POST http://localhost:3003/api/emotional/sintomas
```json
{
  "codigo": "ANSIEDAD_LEVE",
  "nombre": "Ansiedad Leve",
  "descripcion": "Sensación leve de nerviosismo o preocupación",
  "categoria": "ansiedad",
  "severidad": "leve",
  "activo": true
}
```

#### PUT http://localhost:3003/api/emotional/sintomas/:id
```json
{
  "descripcion": "Sensación leve de nerviosismo, preocupación o inquietud",
  "severidad": "moderada"
}
```

### Diario Emocional

#### POST http://localhost:3003/api/emotional/diario
```json
{
  "idUsuario": "507f1f77bcf86cd799439020",
  "fecha": "2024-01-15",
  "estadoGeneral": "bueno",
  "nivelEnergia": 7,
  "calidadSueno": 8,
  "notas": "Día productivo, me sentí bien durante la mayor parte del tiempo",
  "emociones": [
    {
      "idEmocion": "507f1f77bcf86cd799439070", #reemplazar por id  registrado
      "intensidad": 8
    }
  ],
  "sentimientos": [
    {
      "idSentimiento": "507f1f77bcf86cd799439071", #reemplazar por id  registrado 
      "intensidad": 7
    }
  ]
}
```

#### PUT http://localhost:3003/api/emotional/diario/:id
```json
{
  "estadoGeneral": "excelente",
  "nivelEnergia": 9,
  "notas": "Día muy productivo, excelente estado de ánimo todo el día"
}
```

##  Microservicio de Agenda (Puerto 3004)

### Tipos de Agenda

#### POST http://localhost:3004/api/schedule/tiposagenda
```json
{
  "codigo": "PSICOLOGIA",
  "nombre": "Psicología Clínica",
  "descripcion": "Agenda para consultas de psicología clínica",
  "activo": true
}
```

### Tipos de Diagnóstico

#### POST http://localhost:3004/api/schedule/tiposdiagnostico
```json
{
  "codigo": "DSM5",
  "nombre": "DSM-5",
  "descripcion": "Diagnósticos según manual DSM-5",
  "activo": true
}
```

### Agenda

#### POST http://localhost:3004/api/schedule/agendas
```json
{
  "idTipoAgenda": "507f1f77bcf86cd799439080", #reemplazar por id  registrado
  "idUsuarioEspecialista": "507f1f77bcf86cd799439020", #reemplazar por id  registrado
  "nombre": "Consultas Psicológicas Dr. Pérez",
  "descripcion": "Agenda para consultas de psicología clínica",
  "horaInicio": "08:00",
  "horaFin": "17:00",
  "duracionCita": 60,
  "diasSemana": ["lunes", "martes", "miercoles", "jueves", "viernes"],
  "activa": true
}
```

### Nuevos Endpoints de Agenda

#### Agenda Día
**POST http://localhost:3004/api/schedule/agenda-dias**
```json
{
  "idAgenda": "507f1f77bcf86cd799439300", #reemplazar por id registrado
  "fecha": "2024-01-15",
  "horaInicio": "08:00",
  "horaFin": "17:00",
  "disponible": true,
  "observaciones": "Día normal de consultas"
}
```

#### Cita Contenido
**POST http://localhost:3004/api/schedule/citas-contenido**
```json
{
  "idCita": "507f1f77bcf86cd799439301", #reemplazar por id registrado
  "tipo": "evaluacion",
  "contenido": "Evaluación inicial del paciente",
  "observaciones": "Primera sesión de evaluación psicológica",
  "archivos": []
}
```

#### Cita Diagnóstico
**POST http://localhost:3004/api/schedule/citas-diagnostico**
```json
{
  "idCita": "507f1f77bcf86cd799439301", #reemplazar por id registrado
  "idTipoDiagnostico": "507f1f77bcf86cd799439302", #reemplazar por id registrado
  "codigo": "F41.1",
  "nombre": "Trastorno de ansiedad generalizada",
  "descripcion": "Ansiedad y preocupación excesivas",
  "observaciones": "Síntomas presentes durante 6 meses"
}
```

#### Registro de Cita
**POST http://localhost:3004/api/schedule/registros-cita**
```json
{
  "idCita": "507f1f77bcf86cd799439301", #reemplazar por id registrado
  "accion": "creada",
  "descripcion": "Cita creada por el especialista",
  "fechaRegistro": "2024-01-15T10:00:00.000Z"
}
```

#### Auditoría de Agenda
**GET http://localhost:3004/api/schedule/agenda-auditoria** - Consultar registros de auditoría
**GET http://localhost:3004/api/schedule/agenda-auditoria/stats** - Estadísticas de auditoría

#### PUT http://localhost:3004/api/agenda/agenda/:id
```json
{
  "nombre": "Consultas Psicológicas Dr. Juan Pérez",
  "horaInicio": "09:00",
  "horaFin": "18:00",
  "duracionCita": 45
}
```

### Citas

#### POST http://localhost:3004/api/agenda/citas
```json
{
  "idAgenda": "507f1f77bcf86cd799439081", #reemplazar por id  registrado
  "idUsuarioEspecialista": "507f1f77bcf86cd799439020", #reemplazar por id  registrado
  "idUsuarioPaciente": "507f1f77bcf86cd799439022", #reemplazar por id  registrado
  "fechaHoraInicio": "2024-01-15T10:00:00.000Z",
  "fechaHoraFin": "2024-01-15T11:00:00.000Z",
  "estado": "programada",
  "modalidad": "presencial",
  "ubicacion": "Consultorio 101",
  "notas": "Primera consulta - evaluación inicial"
}
```

#### PUT http://localhost:3004/api/agenda/citas/:id
```json
{
  "estado": "confirmada",
  "modalidad": "virtual",
  "ubicacion": "Zoom - Link enviado por email",
  "notas": "Primera consulta - evaluación inicial. Cambio a modalidad virtual por solicitud del paciente"
}
```

### Diagnósticos

#### POST http://localhost:3004/api/agenda/diagnosticos
```json
{
  "idTipoDiagnostico": "507f1f77bcf86cd799439090", #reemplazar por id  registrado
  "idCita": "507f1f77bcf86cd799439091", #reemplazar por id  registrado
  "idUsuarioPaciente": "507f1f77bcf86cd799439022", #reemplazar por id  registrado
  "codigo": "F41.1", #reemplazar por codigo registrado
  "nombre": "Trastorno de ansiedad generalizada",
  "descripcion": "Ansiedad y preocupación excesivas sobre múltiples eventos",
  "observaciones": "Síntomas presentes durante los últimos 6 meses",
  "fechaDiagnostico": "2024-01-15T11:00:00.000Z"
}
```

#### PUT http://localhost:3004/api/agenda/diagnosticos/:id
```json
{
  "descripcion": "Ansiedad y preocupación excesivas sobre múltiples eventos y actividades",
  "observaciones": "Síntomas presentes durante los últimos 6 meses. Mejora notable con tratamiento cognitivo-conductual"
}
```

### Seguimiento de Pacientes

#### POST http://localhost:3004/api/agenda/seguimientos
```json
{
  "idUsuarioPaciente": "507f1f77bcf86cd799439022", #reemplazar por id  registrado
  "idUsuarioEspecialista": "507f1f77bcf86cd799439020", #reemplazar por id  registrado
  "idCita": "507f1f77bcf86cd799439091", #reemplazar por id  registrado
  "fecha": "2024-01-15T11:30:00.000Z",
  "tipo": "post_consulta",
  "observaciones": "Paciente muestra buena respuesta al tratamiento inicial",
  "recomendaciones": "Continuar con ejercicios de respiración y técnicas de relajación",
  "proximaRevision": "2024-01-22T10:00:00.000Z"
}
```

#### PUT http://localhost:3004/api/agenda/seguimientos/:id
```json
{
  "observaciones": "Paciente muestra excelente respuesta al tratamiento. Reducción significativa de síntomas de ansiedad",
  "recomendaciones": "Continuar con ejercicios de respiración, técnicas de relajación y mindfulness diario",
  "proximaRevision": "2024-01-29T10:00:00.000Z"
}
```

##  Notas para QA

### IDs de Ejemplo
Los IDs utilizados en estos ejemplos son ObjectIds de MongoDB de ejemplo. En el testing real, debes:

1. **Crear primero los registros base** (países, departamentos, ciudades, tipos de usuario, etc.)
2. **Usar los IDs reales** devueltos por la API en las respuestas
3. **Seguir el orden de dependencias** (país → departamento → ciudad → persona → usuario)

### Validaciones Importantes

#### Campos Requeridos
- Todos los campos marcados como `required: true` en los modelos deben incluirse
- Los emails deben tener formato válido
- Los teléfonos deben seguir el patrón internacional
- Las fechas deben estar en formato ISO 8601

#### Tipos de Documento
- `CC`: Cédula de Ciudadanía
- `TI`: Tarjeta de Identidad
- `CE`: Cédula de Extranjería
- `PP`: Pasaporte
- `RC`: Registro Civil

#### Estados de Cita
- `programada`: Cita agendada
- `confirmada`: Cita confirmada por el paciente
- `en_curso`: Cita en desarrollo
- `completada`: Cita finalizada
- `cancelada`: Cita cancelada
- `no_asistio`: Paciente no asistió

#### Modalidades de Cita
- `presencial`: Cita en consultorio
- `virtual`: Cita por videollamada
- `telefonica`: Cita por teléfono

### Flujo de Testing Recomendado

1. **Desactivar JWT**: `node jwt-toggle.js disable`
2. **Crear datos base**: Países, departamentos, ciudades, tipos de usuario
3. **Crear usuarios**: Personas y usuarios del sistema
4. **Activar JWT**: `node jwt-toggle.js enable`
5. **Testing completo**: Probar todos los endpoints con autenticación

### Headers Requeridos (el header deve especificarse como Bearer token)

#### Sin JWT (JWT_DISABLED=true)
```
Content-Type: application/json
```

#### Con JWT (JWT_DISABLED=false)
```
Content-Type: application/json
Authorization: Bearer {token_jwt}
```
