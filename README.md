# MIND

Proyecto compuesto por un **backend en Django** y un **frontend móvil en React Native con Expo**.

## Instalación y ejecución (todo en uno)

```bash
# ======================
# BACKEND (Django)
# ======================

# Ir a la carpeta del backend
cd backend

# Crear entorno virtual
python -m venv .venv

# Activar entorno virtual
# En Windows (PowerShell):
.venv\Scripts\activate
# En Linux/MacOS:
# source .venv/bin/activate

# Instalar Django y dependencias mínimas (los requirements/*.txt están vacíos por ahora)
pip install django djangorestframework

# Crear migraciones iniciales
python manage.py migrate

# Ejecutar servidor de desarrollo
python manage.py runserver

# ======================
# FRONTEND (React Native con Expo)
# ======================

# Salir del entorno virtual de Python antes de seguir con Expo
deactivate

# Ir a la carpeta del frontend
cd ../mobile/mind-frontend

# Instalar dependencias base
npm install

# Instalar dependencias de navegación
npm install @react-navigation/native
npm install react-native-screens react-native-safe-area-context
npm install @react-navigation/native-stack

# Instalar dependencias adicionales
npx expo install expo-linear-gradient
npx expo install expo-splash-screen

# Ejecutar proyecto Expo
npx expo start

MIND/
│── backend/                 # Proyecto Django
│   ├── apps/                # Aplicaciones internas
│   ├── core/                # Configuración principal
│   ├── requirements/        # Archivos de dependencias (actualmente vacíos)
│   ├── manage.py
│   └── .venv/               # Entorno virtual
│
└── mobile/                  # Proyecto React Native con Expo
    └── mind-frontend/
        ├── app/             # Pantallas y navegación
        ├── assets/          # Logos, splash, íconos
        ├── package.json
        └── app.json
