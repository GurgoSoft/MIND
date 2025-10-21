// Menú principal dinámico
import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Image,
  Platform,
  ActivityIndicator,
  Modal,
  Animated,
  Dimensions,
  TouchableOpacity,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { getRootMenus, getUserProfile, type MenuItem } from "../services/api";
import { clearToken } from "../services/auth";

const { width } = Dimensions.get('window');

export default function MainMenuScreen() {
  const [pressedId, setPressedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [menus, setMenus] = useState<MenuItem[]>([]);
  const [userName, setUserName] = useState<string>('');
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const sidebarAnim = useState(new Animated.Value(-width * 0.8))[0];
  const overlayAnim = useState(new Animated.Value(0))[0];
  const router = useRouter();

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        
        // Cargar menús y perfil del usuario en paralelo
        const [menusRes, profileRes] = await Promise.all([
          getRootMenus(),
          getUserProfile()
        ]);
        
        if (!mounted) return;
        
        setMenus(menusRes.data || []);
        
        // Extraer nombre del usuario
        const persona = profileRes?.data?.persona;
        if (persona?.nombres) {
          setUserName(persona.nombres.split(' ')[0]); // Solo el primer nombre
        }
        
      } catch (e: any) {
        if (!mounted) return;
        // Evitar redirección aquí; el guard global mostrará el modal y gestionará el login
        setError(e?.message || (e?.status === 401 ? 'Sesión requerida' : 'No se pudo cargar el menú'));
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const iconMap = useMemo<Record<string, string>>(
    () => ({
      // Mappings posibles de nombres de menú a íconos MaterialCommunityIcons
      "¿Cómo me siento hoy?": "emoticon-happy-outline",
      "Diario Emocional": "emoticon-happy-outline",
      "Actividades sensoriales": "meditation",
      "Agendamiento de acompañamiento": "calendar-clock",
      "Eventos y actividades grupales": "account-group-outline",
      "Personalización de espacio": "cog-outline",
      "Suscripción y beneficios": "crown-outline",
    }),
    []
  );

  const handleNavigate = (menu: MenuItem) => {
    // Si el backend define 'ruta', úsala tal cual
    if (menu.ruta) {
      router.push(menu.ruta as any);
      return;
    }
    // Fallback por nombre a rutas existentes
    const name = (menu.nombre || "").toLowerCase();
    if (name.includes("diario") || name.includes("siento")) return router.push("/diarioEmocional");
    if (name.includes("sensori")) return; // TODO: ruta cuando exista
    if (name.includes("agenda")) return; // TODO
    if (name.includes("evento") || name.includes("grupal")) return; // TODO
    if (name.includes("personaliz")) return; // TODO
    if (name.includes("suscrip") || name.includes("benef")) return; // TODO
  };

  const openSidebar = () => {
    setSidebarVisible(true);
    Animated.parallel([
      Animated.timing(sidebarAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(overlayAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const closeSidebar = () => {
    Animated.parallel([
      Animated.timing(sidebarAnim, {
        toValue: -width * 0.8,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(overlayAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setSidebarVisible(false);
    });
  };

  const handleLogout = async () => {
    try {
      await clearToken();
      closeSidebar();
      router.replace('/login');
    } catch (error) {
      console.error('Error cerrando sesión:', error);
    }
  };

  return (
    <LinearGradient
      colors={["#859CE8", "#6AB0D2"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.container}
    >
      {/* Header fijo */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Pressable 
            style={styles.menuButton} 
            onPress={openSidebar}
            android_ripple={{ color: "#ffffff22" }}
          >
            <MaterialCommunityIcons name="menu" size={26} color="#fff" />
          </Pressable>
          <Text style={styles.greeting}>
            Bienvenido{userName ? `, ${userName}` : ''}
          </Text>
        </View>

        <Image source={require("../assets/MINDLOGO_BLUE.png")} style={styles.logo} />
      </View>

      {/* Estado de carga/errores */}
      {loading ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator color="#fff" size="large" />
          <Text style={{ color: "#fff", marginTop: 12 }}>Cargando menú…</Text>
        </View>
      ) : error ? (
        <View style={{ padding: 16 }}>
          <Text style={{ color: "#fff" }}>{error}</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          {menus.map((m) => {
            const isPressed = pressedId === m._id;
            const iconName = m.icono || iconMap[m.nombre] || "chevron-right";
            return (
              <Pressable
                key={m._id}
                onPressIn={() => setPressedId(m._id)}
                onPressOut={() => setPressedId(null)}
                onPress={() => handleNavigate(m)}
                style={styles.cardWrapper}
              >
                <LinearGradient
                  colors={isPressed ? ["#FFA1CC", "#FC6DAB"] : ["#FFFFFF", "#FFFFFF"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.card}
                >
                  <Text style={[styles.cardText, isPressed && styles.cardTextPressed]}>
                    {m.nombre}
                  </Text>
                  <MaterialCommunityIcons
                    name={iconName as any}
                    size={38}
                    color={"#5E4AE3"}
                    style={styles.cardIcon}
                  />
                </LinearGradient>
              </Pressable>
            );
          })}
        </ScrollView>
      )}

      {/* Sidebar Modal */}
      <Modal
        visible={sidebarVisible}
        transparent={true}
        animationType="none"
        onRequestClose={closeSidebar}
      >
        <View style={styles.modalContainer}>
          {/* Overlay */}
          <Animated.View 
            style={[
              styles.overlay,
              {
                opacity: overlayAnim,
              }
            ]}
          >
            <TouchableOpacity 
              style={styles.overlayTouch}
              onPress={closeSidebar}
              activeOpacity={1}
            />
          </Animated.View>

          {/* Sidebar */}
          <Animated.View
            style={[
              styles.sidebar,
              {
                transform: [{ translateX: sidebarAnim }],
              }
            ]}
          >
            <LinearGradient
              colors={["#7675DD", "#5E4AE3"]}
              style={styles.sidebarGradient}
            >
              {/* Header del sidebar */}
              <View style={styles.sidebarHeader}>
                <View style={styles.userInfo}>
                  <View style={styles.avatarContainer}>
                    <MaterialCommunityIcons name="account-circle" size={60} color="#fff" />
                  </View>
                  <Text style={styles.userName}>
                    {userName || 'Usuario'}
                  </Text>
                  <Text style={styles.userRole}>MIND App</Text>
                </View>
              </View>

              {/* Contenido del sidebar */}
              <View style={styles.sidebarContent}>
                {/* Opción de cerrar sesión */}
                <TouchableOpacity
                  style={styles.sidebarOption}
                  onPress={handleLogout}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons 
                    name="logout" 
                    size={24} 
                    color="#fff" 
                    style={styles.sidebarIcon}
                  />
                  <Text style={styles.sidebarOptionText}>Cerrar Sesión</Text>
                </TouchableOpacity>
              </View>

              {/* Botón de cerrar */}
              <TouchableOpacity
                style={styles.closeButton}
                onPress={closeSidebar}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </LinearGradient>
          </Animated.View>
        </View>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  /* header fijo */
  header: {
    flexDirection: "row",
    alignItems: "center", 
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "android" ? 14 : 32, 
    paddingBottom: 10, 
    backgroundColor: "#7675DD",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  menuButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  greeting: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  logo: {
    width: 40, 
    height: 40,
    borderRadius: 999,
  },

  /* lista */
  scroll: {
    padding: 16,
    paddingBottom: 40,
    flexGrow: 1,
  },

  cardWrapper: {
    marginBottom: 18,
    borderRadius: 20,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
      },
      android: {
        elevation: 4,
      },
    }),
  },

  card: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 36,
    paddingHorizontal: 20,
    borderRadius: 20,
  },

  cardText: {
    flex: 1,
    color: "#5E4AE3",
    fontSize: 16,
    fontWeight: "600",
    lineHeight: 22,
  },
  cardTextPressed: {
    color: "#fff",
  },

  cardIcon: {
    marginLeft: 12,
  },

  // Estilos del sidebar
  modalContainer: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  overlayTouch: {
    flex: 1,
  },
  sidebar: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: width * 0.8,
    maxWidth: 320,
  },
  sidebarGradient: {
    flex: 1,
  },
  sidebarHeader: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 30,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  userInfo: {
    alignItems: 'center',
  },
  avatarContainer: {
    marginBottom: 12,
  },
  userName: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  userRole: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    fontWeight: '500',
  },
  sidebarContent: {
    flex: 1,
    paddingTop: 20,
  },
  sidebarOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginHorizontal: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 8,
  },
  sidebarIcon: {
    marginRight: 16,
  },
  sidebarOptionText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  closeButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 30,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
