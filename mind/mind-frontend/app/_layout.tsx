// app/_layout.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { Stack, usePathname, useRouter } from "expo-router";
import { AuthProvider, useAuth } from "../context/AuthContext";
import { Modal, Text, TouchableOpacity, View } from 'react-native';

// Rutas públicas (accesibles sin autenticación)
const PUBLIC_ROUTES = new Set<string>(['/', '/index', '/home', '/login', '/register', '/forgotPassword']);

function RouteGuard({ children }: { children: React.ReactNode }) {
  const { token, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [showModal, setShowModal] = useState(false);

  // Normalizar path
  const current = useMemo(() => {
    if (!pathname) return '/';
    return pathname;
  }, [pathname]);

  useEffect(() => {
    if (loading) return; // esperando restaurar token
    const isPublic = PUBLIC_ROUTES.has(current);
    if (!token && !isPublic) {
      setShowModal(true);
    } else {
      setShowModal(false);
    }
  }, [token, loading, current]);

  return (
    <>
      {/* Evitar que las pantallas protegidas ejecuten efectos/navegaciones mientras se muestra el modal */}
      {!showModal && children}
  <Modal visible={showModal} transparent animationType="fade" onRequestClose={() => { /* Evitar cierre automático; forzar interacción explícita */ }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.45)', padding: 24 }}>
          <View style={{ backgroundColor: '#2E3A59', borderRadius: 16, padding: 18, width: '100%' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700' }}>Sesión requerida</Text>
              <TouchableOpacity onPress={() => { setShowModal(false); router.replace('/login'); }} accessibilityLabel="Cerrar y abrir login">
                <Text style={{ color: '#fff', fontSize: 18, fontWeight: '800' }}>×</Text>
              </TouchableOpacity>
            </View>
            <Text style={{ color: '#fff', marginTop: 8, marginBottom: 12 }}>Primero debes iniciar sesión para acceder a esta sección.</Text>
            <TouchableOpacity onPress={() => { setShowModal(false); router.replace('/login'); }} style={{ backgroundColor: '#7675DD', paddingVertical: 12, borderRadius: 12 }}>
              <Text style={{ color: '#fff', fontWeight: '700', textAlign: 'center' }}>Continuar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

export default function Layout() {
  return (
    <AuthProvider>
      <RouteGuard>
        <Stack 
          screenOptions={{ 
            headerShown: false,
            animation: 'fade'
          }}
        >
          <Stack.Screen name="index" /> {/* Este será el splash */}
          <Stack.Screen name="home" />   {/*  pantalla principal */}
          <Stack.Screen name="login" /> {/*  pantalla de login */}
          <Stack.Screen name="forgotPassword" /> {/* pantalla de recuperación de contraseña */}
          <Stack.Screen name="register" /> {/*  pantalla de registro */}
          <Stack.Screen name="mainMenu" /> {/*  pantalla del menú principal */}
          <Stack.Screen name="diarioEmocional" /> {/*  pantalla de diario emocional */}
          <Stack.Screen name="admin" /> {/*  pantalla de administración */}
        </Stack>
      </RouteGuard>
    </AuthProvider>
  );
}