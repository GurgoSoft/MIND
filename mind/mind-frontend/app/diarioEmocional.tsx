import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  ScrollView,
  Platform,
  Modal,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  StatusBar,
  Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as ScreenCapture from 'expo-screen-capture';
import { 
  getUserProfile, 
  createDiario, 
  listEmociones, 
  listSensaciones, 
  listSintomas, 
  listSentimientos,
  listTiposEmocion,
  createEmocion,
  createSensacion,
  createSintoma,
  createSentimiento,
  createTipoEmocion
} from "../services/api";
import { getToken } from "../services/auth";
import NavigationHeader from "../components/NavigationHeader";

type ModalType = 'emocion' | 'sensacion' | 'sintoma' | 'sentimiento' | 'intensidad' | 'otro' | 'confirmacion';

interface EmotionalItem {
  _id: string;
  nombre: string;
  descripcion?: string;
  tipo?: string;
  codigo?: string;
  imagenId?: {
    _id: string;
    url: string;
    tipo: string;
    metadata?: {
      size?: number;
      width?: number;
      height?: number;
      format?: string;
    };
  };
}

interface SelectedItem extends EmotionalItem {
  intensidad?: number;
}

// Mapeo de imágenes locales para emociones
const emotionImagesMap: { [key: string]: any } = {
  'abandonado.png': require('../assets/abandonado.png'),
  'aceptado.png': require('../assets/aceptado.png'),
};

// Función para obtener la imagen local
const getEmotionImage = (imageUrl?: string) => {
  if (!imageUrl) return null;
  const fileName = imageUrl.split('/').pop();
  return fileName ? emotionImagesMap[fileName] : null;
};

export default function DiarioEmocionalScreen() {
  const router = useRouter();
  
  // Estados básicos
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Estados del formulario
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempDate, setTempDate] = useState(new Date());
  const [selectedEmocion, setSelectedEmocion] = useState<SelectedItem | null>(null);
  const [selectedSensacion, setSelectedSensacion] = useState<SelectedItem | null>(null);
  const [selectedSintoma, setSelectedSintoma] = useState<SelectedItem | null>(null);
  const [selectedSentimiento, setSelectedSentimiento] = useState<SelectedItem | null>(null);
  const [hoySiento, setHoySiento] = useState("");
  const [customText, setCustomText] = useState("");

  // Estados de datos
  const [emociones, setEmociones] = useState<EmotionalItem[]>([]);
  const [sensaciones, setSensaciones] = useState<EmotionalItem[]>([]);
  const [sintomas, setSintomas] = useState<EmotionalItem[]>([]);
  const [sentimientos, setSentimientos] = useState<EmotionalItem[]>([]);
  const [tiposEmocion, setTiposEmocion] = useState<EmotionalItem[]>([]);

  // Estados del modal
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<ModalType | null>(null);
  const [originalModalType, setOriginalModalType] = useState<ModalType | null>(null);
  const [modalSearch, setModalSearch] = useState("");
  const [modalData, setModalData] = useState<EmotionalItem[]>([]);
  const [currentSelection, setCurrentSelection] = useState<EmotionalItem | null>(null);
  const [selectedIntensity, setSelectedIntensity] = useState<number | null>(null);
  const [creatingCustomItem, setCreatingCustomItem] = useState(false);

  // Estados para alertas personalizadas
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState<'success' | 'error' | 'warning'>('error');

  // Intensidades de 1 a 10
  const intensidades = [
    { value: 1, label: "Demasiado leve" },
    { value: 2, label: "Muy leve" },
    { value: 3, label: "Ligeramente leve" },
    { value: 4, label: "Leve" },
    { value: 5, label: "Presuntamente moderado" },
    { value: 6, label: "Moderado" },
    { value: 7, label: "Ligeramente intenso" },
    { value: 8, label: "Intenso" },
    { value: 9, label: "Bastante intenso" },
    { value: 10, label: "Demasiado intenso" },
  ];

  // Función para mostrar alertas personalizadas
  const showAlert = (title: string, message: string, type: 'success' | 'error' | 'warning' = 'error') => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertType(type);
    setAlertVisible(true);
  };

  // Función para obtener imagen de emoción
  const emotionImagesMap: { [key: string]: any } = {
    'abandonado.png': require('../assets/abandonado.png'),
    'aceptado.png': require('../assets/aceptado.png'),
    // También mapear sin la extensión por si acaso
    'abandonado': require('../assets/abandonado.png'),
    'aceptado': require('../assets/aceptado.png'),
  };

  const getEmotionImage = (imageUrl?: string) => {
    console.log('🔍 getEmotionImage llamada con:', imageUrl);
    if (!imageUrl) {
      console.log('❌ No hay imageUrl');
      return null;
    }
    
    // Intentar obtener el nombre del archivo
    const fileName = imageUrl.split('/').pop();
    console.log('📁 Nombre de archivo extraído:', fileName);
    
    if (!fileName) {
      console.log('❌ No se pudo extraer el nombre del archivo');
      return null;
    }
    
    // Buscar en el mapa
    const image = emotionImagesMap[fileName];
    console.log('🖼️ Imagen encontrada en el mapa:', image ? 'Sí' : 'No');
    
    // Si no se encuentra con extensión, intentar sin extensión
    if (!image && fileName.includes('.')) {
      const fileNameWithoutExt = fileName.split('.')[0];
      console.log('🔄 Intentando sin extensión:', fileNameWithoutExt);
      return emotionImagesMap[fileNameWithoutExt] || null;
    }
    
    return image || null;
  };

  // Componentes de Modal reutilizables
  const ModalActions = ({ onCancel, onAccept, acceptDisabled = false, acceptText = 'Aceptar' }: {
    onCancel: () => void;
    onAccept: () => void;
    acceptDisabled?: boolean;
    acceptText?: string;
  }) => (
    <View style={styles.modalActions}>
      <TouchableOpacity
        style={[styles.modalButton, styles.modalButtonCancel]}
        onPress={onCancel}
      >
        <Text style={styles.modalButtonTextCancel}>Cancelar</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[
          styles.modalButton,
          styles.modalButtonAccept,
          acceptDisabled && styles.modalButtonDisabled
        ]}
        onPress={onAccept}
        disabled={acceptDisabled}
      >
        <Text style={styles.modalButtonTextAccept}>{acceptText}</Text>
      </TouchableOpacity>
    </View>
  );

  const ModalIntensity = () => (
    <View style={styles.modalContent}>
      <Text style={styles.modalSubtitle}>
        Selecciona la intensidad para: {currentSelection?.nombre}
      </Text>
      <FlatList
        data={intensidades}
        keyExtractor={(item) => item.value.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.intensityItem,
              selectedIntensity === item.value && styles.intensityItemSelected
            ]}
            onPress={() => setSelectedIntensity(item.value)}
          >
            <Text style={[
              styles.intensityText,
              selectedIntensity === item.value && styles.intensityTextSelected
            ]}>
              {item.value} - {item.label}
            </Text>
          </TouchableOpacity>
        )}
        style={styles.modalList}
      />
      <ModalActions
        onCancel={closeModal}
        onAccept={() => {
          if (selectedIntensity && currentSelection) {
            confirmSelection(currentSelection, selectedIntensity);
          } else {
            Alert.alert('Campo requerido', 'Debes seleccionar un nivel de intensidad');
          }
        }}
        acceptDisabled={!selectedIntensity}
      />
    </View>
  );

  const ModalConfirmacion = () => {
    // Intentar obtener la imagen desde imagenId, o directamente desde el nombre
    let localImage = getEmotionImage(currentSelection?.imagenId?.url);
    
    // Si no hay imagen desde imagenId, intentar mapear directamente por nombre
    if (!localImage && currentSelection?.nombre) {
      const nombreLower = currentSelection.nombre.toLowerCase();
      if (nombreLower === 'abandonado') {
        localImage = require('../assets/abandonado.png');
      } else if (nombreLower === 'aceptado') {
        localImage = require('../assets/aceptado.png');
      }
    }
    
    console.log('🖼️ ModalConfirmacion - currentSelection:', currentSelection);
    console.log('🖼️ ModalConfirmacion - imagenId:', currentSelection?.imagenId);
    console.log('🖼️ ModalConfirmacion - url:', currentSelection?.imagenId?.url);
    console.log('🖼️ ModalConfirmacion - localImage:', localImage);
    
    return (
      <View style={styles.modalContent}>
        <View style={styles.confirmacionContainer}>
          <View style={styles.confirmacionImageContainer}>
            {localImage ? (
              <Image
                source={localImage}
                style={styles.confirmacionImage}
                resizeMode="contain"
              />
            ) : (
              <MaterialCommunityIcons 
                name="emoticon-happy-outline" 
                size={80} 
                color="#5E4AE3" 
              />
            )}
          </View>
          <Text style={styles.confirmacionTitle}>{currentSelection?.nombre}</Text>
          {currentSelection?.descripcion && (
            <Text style={styles.confirmacionDescription}>{currentSelection.descripcion}</Text>
          )}
        </View>
        <ModalActions
          onCancel={closeModal}
          onAccept={() => {
            // Pasar al modal de intensidad
            setModalType('intensidad');
            setSelectedIntensity(null);
          }}
          acceptText="Continuar"
        />
      </View>
    );
  };

  const ModalCustom = () => (
    <View style={styles.modalContent}>
      <TextInput
        style={styles.customInput}
        placeholder="Escribe tu respuesta..."
        value={customText}
        onChangeText={setCustomText}
        autoFocus
      />
      <ModalActions
        onCancel={closeModal}
        onAccept={createCustomItem}
        acceptDisabled={creatingCustomItem || !customText.trim()}
        acceptText={creatingCustomItem ? 'Creando...' : 'Crear'}
      />
    </View>
  );

  const ModalSelection = () => (
    <View style={styles.modalContent}>
      <TextInput
        style={styles.searchInput}
        placeholder="Buscar..."
        value={modalSearch}
        onChangeText={setModalSearch}
      />
      <FlatList
        data={getFilteredModalData()}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => {
          const localImage = getEmotionImage(item.imagenId?.url);
          return (
            <TouchableOpacity
              style={styles.modalItem}
              onPress={() => selectItem(item)}
            >
              <View style={styles.modalItemContent}>
                {localImage && (
                  <Image
                    source={localImage}
                    style={styles.modalItemImage}
                    resizeMode="contain"
                  />
                )}
                <View style={styles.modalItemTextContainer}>
                  <Text style={styles.modalItemText}>{item.nombre}</Text>
                  {item.descripcion && (
                    <Text style={styles.modalItemDescription}>{item.descripcion}</Text>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
        style={styles.modalList}
        ItemSeparatorComponent={() => <View style={styles.modalSeparator} />}
      />
    </View>
  );

  // Componente reutilizable para campos de selección
  const SelectField = ({ 
    label, 
    value, 
    placeholder, 
    onPress 
  }: { 
    label: string; 
    value: SelectedItem | null; 
    placeholder: string; 
    onPress: () => void; 
  }) => (
    <View style={styles.fieldContainer}>
      <Text style={styles.label}>{label} *</Text>
      <Pressable style={styles.selectButton} onPress={onPress}>
        <Text style={value ? styles.selectedText : styles.placeholderText}>
          {value 
            ? `${value.nombre}${value.intensidad ? ` (${value.intensidad}/10)` : ''}` 
            : placeholder
          }
        </Text>
        <MaterialCommunityIcons name="chevron-down" size={20} color="#666" />
      </Pressable>
    </View>
  );

  // Títulos de modales centralizados
  const getModalTitle = () => {
    const titles = {
      'emocion': '¿Qué emoción tengo?',
      'sensacion': 'Tengo sensación de',
      'sintoma': 'Poseo síntomas de',
      'sentimiento': 'Siento',
      'intensidad': 'Nivel de intensidad',
      'otro': 'Escribe tu respuesta',
      'confirmacion': 'Has seleccionado'
    };
    return titles[modalType as keyof typeof titles] || '';
  };
  useEffect(() => {
    loadInitialData();
  }, []);

  // Prevenir capturas de pantalla
  useEffect(() => {
    const preventScreenCapture = async () => {
      try {
        await ScreenCapture.preventScreenCaptureAsync();
      } catch (error) {
        console.log('Error activando protección contra capturas:', error);
      }
    };

    const allowScreenCapture = async () => {
      try {
        await ScreenCapture.allowScreenCaptureAsync();
      } catch (error) {
        console.log('Error desactivando protección contra capturas:', error);
      }
    };

    // Activar protección al montar el componente
    preventScreenCapture();

    // Desactivar protección al desmontar el componente
    return () => {
      allowScreenCapture();
    };
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      
      // Cargar perfil del usuario
      console.log('🔵 Cargando perfil del usuario...');
      const profile = await getUserProfile();
      console.log('📝 Respuesta completa del perfil:', JSON.stringify(profile, null, 2));
      
      // Intentar obtener el userId de diferentes ubicaciones posibles
      let uid = profile?.data?.usuario?._id || 
                profile?.data?._id || 
                profile?.usuario?._id || 
                profile?._id;
      
      // Si no se encuentra en la respuesta, intentar decodificar el token JWT
      if (!uid) {
        console.log('⚠️ No se encontró userId en la respuesta, intentando decodificar token...');
        const token = await getToken();
        if (token) {
          try {
            // Decodificar el JWT (solo la parte del payload)
            const payload = JSON.parse(atob(token.split('.')[1]));
            console.log('🔓 Payload del token:', payload);
            uid = payload.userId || payload.id || payload.sub || payload._id;
            console.log('🎯 userId del token:', uid);
          } catch (e) {
            console.error('❌ Error decodificando token:', e);
          }
        }
      }
      
      console.log('🎯 userId final extraído:', uid);
      
      if (uid) {
        setUserId(uid);
        console.log('✅ userId configurado exitosamente:', uid);
      } else {
        console.error('⚠️ No se pudo extraer el userId');
        console.error('Estructura recibida:', profile);
        showAlert('Advertencia', 'No se pudo obtener tu información de usuario. Por favor, cierra sesión y vuelve a ingresar.', 'warning');
      }

      // Cargar datos en paralelo
      const [emocionesRes, sensacionesRes, sintomasRes, sentimientosRes, tiposEmocionRes] = await Promise.all([
        listEmociones(),
        listSensaciones(),
        listSintomas(),
        listSentimientos(),
        listTiposEmocion()
      ]);

      console.log('🎨 Emociones recibidas:', emocionesRes?.data);
      console.log('🖼️ Emociones con imagen:', emocionesRes?.data?.filter((e: any) => e.imagenId));

      setEmociones(emocionesRes?.data || []);
      setSensaciones(sensacionesRes?.data || []);
      setSintomas(sintomasRes?.data || []);
      setSentimientos(sentimientosRes?.data || []);
      setTiposEmocion(tiposEmocionRes?.data || []);

    } catch (error) {
      console.error('❌ Error cargando datos:', error);
      showAlert('Error', 'No se pudieron cargar los datos', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Validar fecha (no más de un mes atrás, no futuros)
  const validateDate = (date: Date): boolean => {
    const today = new Date();
    today.setHours(23, 59, 59, 999); // Hasta el final del día actual
    
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(today.getMonth() - 1);
    oneMonthAgo.setHours(0, 0, 0, 0); // Desde el inicio del día hace un mes
    
    return date >= oneMonthAgo && date <= today;
  };

  // Formatear fecha para mostrar
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('es-ES');
  };

  // Generar días válidos (hoy y hasta un mes atrás)
  const getValidDates = (): Date[] => {
    const dates: Date[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Generar 30 días hacia atrás desde hoy
    for (let i = 0; i <= 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      dates.push(date);
    }
    
    return dates;
  };

  // Abrir modal de fecha
  const openDatePicker = () => {
    setTempDate(new Date(selectedDate));
    setShowDatePicker(true);
  };

  // Confirmar selección de fecha
  const confirmDateSelection = () => {
    setSelectedDate(tempDate);
    setShowDatePicker(false);
  };

  // Manejar cambio de fecha
  const onDateChange = (event: any, selectedDate?: Date) => {
    // En Android, cerrar el picker inmediatamente
    setShowDatePicker(Platform.OS === 'ios');
    
    if (selectedDate && event.type !== 'dismissed') {
      if (validateDate(selectedDate)) {
        setSelectedDate(selectedDate);
      } else {
        showAlert(
          'Fecha no válida', 
          'Solo puedes seleccionar fechas de hasta un mes atrás y no fechas futuras.',
          'warning'
        );
      }
    }
  };

  // Validar palabras mínimas en el texto
  const validateMinWords = (text: string): boolean => {
    const words = text.trim().split(/\s+/).filter(word => word.length > 0);
    return words.length >= 25;
  };

  // Abrir modal para seleccionar
  const openModal = (type: ModalType, data: EmotionalItem[]) => {
    setModalType(type);
    setOriginalModalType(type);
    
    // Agregar opción "Otro" al final de la lista
    const dataWithOtro = [
      ...data,
      { _id: 'otro', nombre: 'Otro', tipo: 'especial' }
    ];
    
    setModalData(dataWithOtro);
    setModalSearch("");
    setCurrentSelection(null);
    setSelectedIntensity(null);
    setCustomText("");
    setModalVisible(true);
  };

  // Cerrar modal
  const closeModal = () => {
    setModalVisible(false);
    setModalType(null);
    setOriginalModalType(null);
    setModalData([]);
    setCurrentSelection(null);
    setSelectedIntensity(null);
    setCustomText("");
    setModalSearch("");
    setCreatingCustomItem(false);
  };

  // Seleccionar item en modal
  const selectItem = (item: EmotionalItem) => {
    console.log('selectItem llamado con:', item);
    if (item.nombre === "Otro") {
      console.log('Cambiando modalType a "otro"');
      setModalType('otro');
      return;
    }
    
    setCurrentSelection(item);
    // Si no es una opción negativa, mostrar confirmación y luego pedir intensidad
    if (!item.nombre.toLowerCase().includes('no tengo') && 
        !item.nombre.toLowerCase().includes('no siento')) {
      setModalType('confirmacion');
    } else {
      // Confirmar selección sin intensidad
      confirmSelection(item, null);
    }
  };

  // Confirmar selección con intensidad
  const confirmSelection = async (item: EmotionalItem, intensidad: number | null) => {
    console.log('✅ confirmSelection llamado con:', { item, intensidad, modalType, originalModalType });
    const selectedWithIntensity: SelectedItem = { ...item, intensidad: intensidad ?? undefined };

    // Usar originalModalType si existe, sino usar modalType
    const typeToUse = originalModalType || modalType;
    console.log('📌 Tipo a usar para guardar:', typeToUse);

    switch (typeToUse) {
      case 'emocion':
        console.log('💚 Guardando emoción:', selectedWithIntensity);
        setSelectedEmocion(selectedWithIntensity);
        break;
      case 'sensacion':
        console.log('💙 Guardando sensación:', selectedWithIntensity);
        setSelectedSensacion(selectedWithIntensity);
        break;
      case 'sintoma':
        console.log('💛 Guardando síntoma:', selectedWithIntensity);
        setSelectedSintoma(selectedWithIntensity);
        break;
      case 'sentimiento':
        console.log('💜 Guardando sentimiento:', selectedWithIntensity);
        setSelectedSentimiento(selectedWithIntensity);
        break;
    }
    
    closeModal();
  };

  // Crear elemento personalizado
  const createCustomItem = async () => {
    if (creatingCustomItem) {
      console.log('Ya se está creando un item, ignorando');
      return;
    }

    console.log('=== INICIO createCustomItem ===');
    console.log('createCustomItem llamado con:', {
      modalType,
      originalModalType,
      customText: customText.trim(),
      tiposEmocionLength: tiposEmocion.length
    });

    if (!customText.trim()) {
      console.log('Texto vacío, mostrando alerta');
      Alert.alert('Error', 'Debes escribir el nombre del elemento');
      return;
    }

    setCreatingCustomItem(true);

    try {
      let newItem: EmotionalItem | null = null;

      switch (originalModalType) {
        case 'emocion':
          console.log('🔵 INICIO CASO EMOCIÓN - Versión Nueva');
          // Buscar el tipo "Personalizada" o usar el primero disponible
          let defaultTipoEmocion = null;
          
          if (tiposEmocion.length === 0) {
            console.log('⚠️ No hay tipos de emoción cargados, recargando...');
            Alert.alert('Error', 'No hay tipos de emoción disponibles. Por favor, recarga la aplicación.');
            return;
          } else {
            // Buscar el tipo "Personalizada" primero
            const personalizada = tiposEmocion.find(t => t.nombre === 'Personalizada' || t.codigo === 'PERSONALIZADA');
            if (personalizada) {
              defaultTipoEmocion = personalizada._id;
              console.log('✅ Usando tipo "Personalizada":', defaultTipoEmocion);
            } else {
              // Si no existe, usar el primero disponible
              defaultTipoEmocion = tiposEmocion[0]._id;
              console.log('✅ Usando primer tipo disponible:', tiposEmocion[0].nombre);
            }
          }
          
          if (!defaultTipoEmocion) {
            console.log('❌ No se pudo obtener defaultTipoEmocion');
            Alert.alert('Error', 'No se pudo obtener un tipo de emoción válido');
            return;
          }

          console.log('📝 Preparando datos de emoción...');
          const emocionData = {
            nombre: customText.trim(),
            descripcion: `Emoción personalizada: ${customText.trim()}`,
            idTipoEmocion: defaultTipoEmocion,
            idEmocion: `CUSTOM_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
          };
          console.log('🌐 Enviando datos de emoción al servidor:', emocionData);
          const emocionRes = await createEmocion(emocionData);
          console.log('🎉 Emoción creada exitosamente:', emocionRes);
          newItem = emocionRes.data;
          break;
        case 'sensacion':
          console.log('🔵 Creando sensación personalizada...');
          const sensacionData = {
            nombre: customText.trim(),
            tipo: 'fisica' // Usar un valor válido del enum
          };
          console.log('📝 Enviando datos de sensación:', sensacionData);
          const sensacionRes = await createSensacion(sensacionData);
          console.log('🎉 Sensación creada exitosamente:', sensacionRes);
          newItem = sensacionRes.data;
          break;
        case 'sintoma':
          console.log('🔵 Creando síntoma personalizado...');
          const sintomaData = {
            nombre: customText.trim(),
            tipo: 'fisico' // Usar un valor válido del enum
          };
          console.log('📝 Enviando datos de síntoma:', sintomaData);
          const sintomaRes = await createSintoma(sintomaData);
          console.log('🎉 Síntoma creado exitosamente:', sintomaRes);
          newItem = sintomaRes.data;
          break;
        case 'sentimiento':
          console.log('🔵 Creando sentimiento personalizado...');
          const sentimientoData = {
            nombre: customText.trim(),
            tipo: 'neutro' // Usar un valor válido del enum
          };
          console.log('📝 Enviando datos de sentimiento:', sentimientoData);
          const sentimientoRes = await createSentimiento(sentimientoData);
          console.log('🎉 Sentimiento creado exitosamente:', sentimientoRes);
          newItem = sentimientoRes.data;
          break;
      }

      if (newItem) {
        console.log('Item creado exitosamente:', newItem);
        // Actualizar la lista local para que aparezca inmediatamente
        switch (originalModalType) {
          case 'emocion':
            console.log('Actualizando lista de emociones...');
            setEmociones(prev => [...prev, newItem]);
            break;
          case 'sensacion':
            console.log('Actualizando lista de sensaciones...');
            setSensaciones(prev => [...prev, newItem]);
            break;
          case 'sintoma':
            console.log('Actualizando lista de síntomas...');
            setSintomas(prev => [...prev, newItem]);
            break;
          case 'sentimiento':
            console.log('Actualizando lista de sentimientos...');
            setSentimientos(prev => [...prev, newItem]);
            break;
        }
        
        console.log('Pasando a modal de intensidad con item:', newItem);
        setCurrentSelection(newItem);
        setModalType('intensidad');
      }
    } catch (error) {
      console.error('Error en createCustomItem:', error);
      Alert.alert('Error', 'No se pudo crear el elemento personalizado');
    } finally {
      setCreatingCustomItem(false);
    }
    console.log('=== FIN createCustomItem ===');
  };

  // Validar formulario
  const validateForm = (): boolean => {
    console.log('🔍 Validando formulario...');
    console.log('  - selectedEmocion:', selectedEmocion);
    console.log('  - selectedSensacion:', selectedSensacion);
    console.log('  - selectedSintoma:', selectedSintoma);
    console.log('  - selectedSentimiento:', selectedSentimiento);
    console.log('  - hoySiento palabras:', hoySiento.trim().split(/\s+/).filter(word => word.length > 0).length);
    
    const missingFields: string[] = [];
    
    if (!selectedEmocion) missingFields.push('Emoción');
    if (!selectedSensacion) missingFields.push('Sensación');
    if (!selectedSintoma) missingFields.push('Síntoma');
    if (!selectedSentimiento) missingFields.push('Sentimiento');
    if (!validateMinWords(hoySiento)) missingFields.push('Hoy siento (mínimo 25 palabras)');
    
    if (missingFields.length > 0) {
      showAlert(
        'Campos requeridos',
        `Por favor completa los siguientes campos obligatorios:\n\n• ${missingFields.join('\n• ')}`,
        'warning'
      );
      return false;
    }
    
    return true;
  };

  // Guardar diario
  const handleSave = async () => {
    console.log('🔵 handleSave llamado');
    console.log('📝 userId actual:', userId);
    
    if (!validateForm()) {
      console.log('❌ Validación fallida');
      return;
    }
    
    if (!userId) {
      console.error('❌ No hay userId disponible');
      showAlert(
        'Error de sesión', 
        'No se pudo identificar tu usuario. Por favor, cierra sesión y vuelve a ingresar.',
        'error'
      );
      return;
    }

    try {
      console.log('✅ Iniciando guardado...');
      setSaving(true);

      const payload = {
        diario: {
          idUsuario: userId,
          fecha: selectedDate.toISOString(),
          titulo: `Diario del ${formatDate(selectedDate)}`,
          nota: hoySiento.trim(),
          calificacion: Math.round((
            (selectedEmocion?.intensidad || 5) +
            (selectedSensacion?.intensidad || 5) +
            (selectedSintoma?.intensidad || 5) +
            (selectedSentimiento?.intensidad || 5)
          ) / 4)
        },
        emociones: selectedEmocion ? [{
          idEmocion: selectedEmocion._id,
          intensidad: selectedEmocion.intensidad || 5
        }] : [],
        sensaciones: selectedSensacion ? [{
          idSensacion: selectedSensacion._id,
          intensidad: selectedSensacion.intensidad || 5
        }] : [],
        sintomas: selectedSintoma ? [{
          idSintoma: selectedSintoma._id,
          intensidad: selectedSintoma.intensidad || 5
        }] : [],
        sentimientos: selectedSentimiento ? [{
          idSentimiento: selectedSentimiento._id,
          intensidad: selectedSentimiento.intensidad || 5
        }] : []
      };

      console.log('📤 Enviando payload:', JSON.stringify(payload, null, 2));
      
      const result = await createDiario(payload);
      
      console.log('✅ Resultado:', result);

      // Limpiar formulario
      setSelectedEmocion(null);
      setSelectedSensacion(null);
      setSelectedSintoma(null);
      setSelectedSentimiento(null);
      setHoySiento("");
      setSelectedDate(new Date());

      showAlert('Éxito', 'Registro guardado correctamente', 'success');

      // Redirigir al mainMenu después de 2 segundos
      setTimeout(() => {
        setAlertVisible(false);
        router.push('/mainMenu');
      }, 2000);

    } catch (error: any) {
      console.error('❌ Error guardando:', error);
      console.error('❌ Error message:', error?.message);
      console.error('❌ Error response:', error?.response?.data);
      console.error('❌ Full error:', JSON.stringify(error, null, 2));
      showAlert('Error', error?.message || 'No se pudo guardar el registro', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Filtrar datos del modal
  const getFilteredModalData = () => {
    // Filtrar por búsqueda
    if (modalSearch.trim()) {
      return modalData.filter(item => 
        item.nombre.toLowerCase().includes(modalSearch.toLowerCase())
      );
    }
    
    return modalData;
  };

  if (loading) {
    return (
      <LinearGradient colors={["#859CE8", "#6AB0D2"]} style={styles.container}>
        <StatusBar barStyle="light-content" />
        <NavigationHeader />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingText}>Cargando...</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={["#859CE8", "#6AB0D2"]} style={styles.container}>
      <StatusBar barStyle="light-content" />
      <NavigationHeader />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <Text style={styles.title}>Diario Emocional</Text>
          
          {/* Fecha */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Fecha *</Text>
            <Pressable style={styles.dateButton} onPress={openDatePicker}>
              <Text style={styles.dateText}>{formatDate(selectedDate)}</Text>
              <MaterialCommunityIcons name="calendar" size={20} color="#5E4AE3" />
            </Pressable>
          </View>

          {/* Emoción */}
          <SelectField
            label="¿Qué emoción tengo?"
            value={selectedEmocion}
            placeholder="Seleccionar emoción"
            onPress={() => openModal('emocion', emociones)}
          />

          {/* Sensación */}
          <SelectField
            label="Tengo sensación de"
            value={selectedSensacion}
            placeholder="Seleccionar sensación"
            onPress={() => openModal('sensacion', sensaciones)}
          />

          {/* Síntomas */}
          <SelectField
            label="Poseo síntomas de"
            value={selectedSintoma}
            placeholder="Seleccionar síntoma"
            onPress={() => openModal('sintoma', sintomas)}
          />

          {/* Sentimientos */}
          <SelectField
            label="Siento"
            value={selectedSentimiento}
            placeholder="Seleccionar sentimiento"
            onPress={() => openModal('sentimiento', sentimientos)}
          />

          {/* Hoy siento */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Hoy siento * (mínimo 25 palabras)</Text>
            <TextInput
              style={styles.textArea}
              placeholder="Describe cómo te sientes hoy..."
              placeholderTextColor="#999"
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              value={hoySiento}
              onChangeText={setHoySiento}
              maxLength={2000}
            />
            <Text style={styles.wordCount}>
              Palabras: {hoySiento.trim().split(/\s+/).filter(word => word.length > 0).length}/25
            </Text>
          </View>

          {/* Botón Guardar */}
          <Pressable 
            style={[styles.saveButton, saving && styles.saveButtonDisabled]} 
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>Guardar Registro</Text>
            )}
          </Pressable>
        </View>
      </ScrollView>

      {/* Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{getModalTitle()}</Text>
              <TouchableOpacity onPress={closeModal}>
                <MaterialCommunityIcons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            {modalType === 'intensidad' ? (
              <ModalIntensity />
            ) : modalType === 'otro' ? (
              <ModalCustom />
            ) : modalType === 'confirmacion' ? (
              <ModalConfirmacion />
            ) : (
              <ModalSelection />
            )}
          </View>
        </View>
      </Modal>

      {/* Modal de selección de fecha */}
      <Modal visible={showDatePicker} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Seleccionar Fecha</Text>
              <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalContent}>
              <Text style={styles.modalSubtitle}>
                Puedes seleccionar desde hoy hasta un mes atrás
              </Text>
              <ScrollView style={styles.dateList}>
                {getValidDates().map((date, index) => {
                  const isSelected = date.toDateString() === tempDate.toDateString();
                  const isToday = date.toDateString() === new Date().toDateString();
                  
                  return (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.dateItem,
                        isSelected && styles.dateItemSelected
                      ]}
                      onPress={() => setTempDate(date)}
                    >
                      <Text style={[
                        styles.dateItemText,
                        isSelected && styles.dateItemTextSelected
                      ]}>
                        {formatDate(date)}
                        {isToday && ' (Hoy)'}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonCancel]}
                  onPress={() => setShowDatePicker(false)}
                >
                  <Text style={styles.modalButtonTextCancel}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonAccept]}
                  onPress={confirmDateSelection}
                >
                  <Text style={styles.modalButtonTextAccept}>Aceptar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Alerta Personalizada */}
      <Modal
        visible={alertVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setAlertVisible(false)}
      >
        <View style={styles.alertOverlay}>
          <View style={styles.alertContainer}>
            <View style={[
              styles.alertIconContainer,
              alertType === 'success' && styles.alertIconSuccess,
              alertType === 'error' && styles.alertIconError,
              alertType === 'warning' && styles.alertIconWarning
            ]}>
              <MaterialCommunityIcons 
                name={
                  alertType === 'success' ? 'check-circle' : 
                  alertType === 'error' ? 'close-circle' : 
                  'alert-circle'
                } 
                size={50} 
                color="#fff" 
              />
            </View>
            <Text style={styles.alertTitle}>{alertTitle}</Text>
            <Text style={styles.alertMessage}>{alertMessage}</Text>
            <Pressable 
              style={[
                styles.alertButton,
                alertType === 'success' && styles.alertButtonSuccess,
                alertType === 'error' && styles.alertButtonError,
                alertType === 'warning' && styles.alertButtonWarning
              ]} 
              onPress={() => setAlertVisible(false)}
            >
              <Text style={styles.alertButtonText}>Entendido</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 12,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 24,
    textAlign: 'center',
  },
  fieldContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  dateButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 16,
    color: '#333',
  },
  selectButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectedText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  placeholderText: {
    fontSize: 16,
    color: '#999',
    flex: 1,
  },
  textArea: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#333',
    minHeight: 120,
  },
  wordCount: {
    fontSize: 12,
    color: '#fff',
    marginTop: 4,
    textAlign: 'right',
  },
  saveButton: {
    backgroundColor: '#5E4AE3',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    margin: 20,
    maxHeight: '80%',
    width: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  modalContent: {
    padding: 20,
    flex: 1,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  modalList: {
    flex: 1,
  },
  modalItem: {
    padding: 16,
  },
  modalItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalItemImage: {
    width: 40,
    height: 40,
    marginRight: 12,
    borderRadius: 8,
  },
  modalItemTextContainer: {
    flex: 1,
  },
  modalItemText: {
    fontSize: 16,
    color: '#333',
  },
  modalItemDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  modalSeparator: {
    height: 1,
    backgroundColor: '#eee',
  },
  intensityItem: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#f8f9fa',
  },
  intensityItemSelected: {
    backgroundColor: '#5E4AE3',
  },
  intensityText: {
    fontSize: 16,
    color: '#333',
  },
  intensityTextSelected: {
    color: '#fff',
  },
  // Estilos para modal de confirmación
  confirmacionContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  confirmacionImageContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  confirmacionImage: {
    width: 200,
    height: 200,
  },
  confirmacionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  confirmacionDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  customInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 8,
  },
  modalButtonCancel: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  modalButtonAccept: {
    backgroundColor: '#5E4AE3',
  },
  modalButtonDisabled: {
    opacity: 0.5,
  },
  modalButtonTextCancel: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  modalButtonTextAccept: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  // Estilos para modal de fecha
  dateList: {
    maxHeight: 400,
    marginBottom: 16,
  },
  dateItem: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#f8f9fa',
  },
  dateItemSelected: {
    backgroundColor: '#5E4AE3',
  },
  dateItemText: {
    fontSize: 16,
    color: '#333',
  },
  dateItemTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  // Estilos de alerta personalizada
  alertOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  alertContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  alertIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  alertIconSuccess: {
    backgroundColor: '#4CAF50',
  },
  alertIconError: {
    backgroundColor: '#F44336',
  },
  alertIconWarning: {
    backgroundColor: '#FF9800',
  },
  alertTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  alertMessage: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 24,
  },
  alertButton: {
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
    minWidth: 120,
  },
  alertButtonSuccess: {
    backgroundColor: '#4CAF50',
  },
  alertButtonError: {
    backgroundColor: '#F44336',
  },
  alertButtonWarning: {
    backgroundColor: '#FF9800',
  },
  alertButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});