import React, { useEffect, useState } from "react";
import { 
  View, 
  StyleSheet, 
  Image, 
  ActivityIndicator 
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";

export default function Splash() {
  const [showSpinner, setShowSpinner] = useState(false);
  const [appLoaded, setAppLoaded] = useState(false);

  useEffect(() => {
    let isMounted = true;
    
    // Simular carga de la app
    const loadApp = async () => {
      try {
        // Simular tiempo de carga variable (1-5 segundos)
        const loadTime = Math.random() * 4000 + 1000; // 1-5 segundos
        
        await new Promise(resolve => setTimeout(resolve, loadTime));
        
        if (isMounted) {
          setAppLoaded(true);
        }
      } catch (error) {
        console.log("Error cargando la app:", error);
        if (isMounted) {
          setAppLoaded(true);
        }
      }
    };

    // Timer para mostrar el spinner si tarda más de 3.5 segundos
    const spinnerTimer = setTimeout(() => {
      if (isMounted && !appLoaded) {
        setShowSpinner(true);
      }
    }, 3500);

    // Timer mínimo para mostrar el logo por 3 segundos
  let minimumTimer: ReturnType<typeof setTimeout>;
    const startTime = Date.now();
    
    const checkAndNavigate = () => {
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, 3000 - elapsedTime);
      
      if (remainingTime > 0) {
        minimumTimer = setTimeout(() => {
          if (isMounted) {
            router.replace("/home");
          }
        }, remainingTime);
      } else {
        if (isMounted) {
          router.replace("/home");
        }
      }
    };

    // Iniciar la carga
    loadApp();

    // Escuchar cuando la app esté cargada
    const checkLoaded = () => {
      if (appLoaded) {
        checkAndNavigate();
      } else {
        setTimeout(checkLoaded, 100);
      }
    };
    
    setTimeout(checkLoaded, 3000); // Empezar a verificar después de 3 segundos

    // Cleanup
    return () => {
      isMounted = false;
      clearTimeout(spinnerTimer);
      clearTimeout(minimumTimer);
    };
  }, [appLoaded]);

  return (
    <LinearGradient 
      colors={["#859CE8", "#6AB0D2"]} 
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
    >
      {/* Logo Container */}
      <View style={styles.logoContainer}>
          <Image 
            source={require('../assets/MINDLOGO_BLUE.png')} 
            style={styles.logo}
            resizeMode="contain"
          />
      </View>

      {/* Spinner - Solo se muestra si la app tarda más de 3.5 segundos */}
      {showSpinner && (
        <View style={styles.spinnerContainer}>
          <ActivityIndicator 
            size="large" 
            color="#FFFFFF" 
            style={styles.spinner}
          />
        </View>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  logoContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  logo: {
    width: 300,
    height: 300,
  },
  spinnerContainer: {
    position: "absolute",
    bottom: 100,
    alignItems: "center",
  },
  spinner: {
    marginTop: 50,
  },
});