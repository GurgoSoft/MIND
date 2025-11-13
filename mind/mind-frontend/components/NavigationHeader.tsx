import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  Platform,
  Modal,
  Animated,
  Dimensions,
  TouchableOpacity,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { getUserProfile } from "../services/api";
import { clearToken } from "../services/auth";

const { width } = Dimensions.get('window');

interface NavigationHeaderProps {
  title?: string;
  showBackButton?: boolean;
}

export default function NavigationHeader({ title, showBackButton = true }: NavigationHeaderProps) {
  const [userName, setUserName] = useState<string>('');
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const sidebarAnim = useState(new Animated.Value(-width * 0.8))[0];
  const overlayAnim = useState(new Animated.Value(0))[0];
  const router = useRouter();

  useEffect(() => {
    // Cargar perfil del usuario
    (async () => {
      try {
        const profileRes = await getUserProfile();
        const persona = profileRes?.data?.persona;
        if (persona?.nombres) setUserName(persona.nombres.split(' ')[0]);
      } catch (error) {
        // No bloquear si no se puede obtener el perfil
      }
    })();
  }, []);

  const handleBack = () => {
    router.push('/mainMenu');
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
    <>
      {/* Header igual al mainMenu */}
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

      {/* Botón de volver debajo de la barra */}
      {showBackButton && (
        <View style={styles.backButtonContainer}>
          <Pressable 
            style={styles.backButton} 
            onPress={handleBack}
            android_ripple={{ color: "#ffffff22" }}
          >
            <MaterialCommunityIcons name="arrow-left" size={28} color="#fff" />
          </Pressable>
        </View>
      )}

      {/* Sidebar Modal igual al mainMenu */}
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
    </>
  );
}

const styles = StyleSheet.create({
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
  
  // Botón de volver debajo de la barra
  backButtonContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },

  // Estilos del sidebar (copiados del mainMenu)
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