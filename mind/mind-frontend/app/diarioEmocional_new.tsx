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
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { 
  getUserProfile, 
  createDiario, 
  listEmociones, 
  listSensaciones, 
  listSintomas, 
  listSentimientos,
  createSensacion,
  createSintoma,
  createSentimiento
} from "../services/api";
import NavigationHeader from "../components/NavigationHeader";

type ModalType = 'emocion' | 'sensacion' | 'sintoma' | 'sentimiento' | 'intensidad' | 'otro';

interface EmotionalItem {
  _id: string;
  nombre: string;
  descripcion?: string;
  tipo?: string;
}

interface SelectedItem extends EmotionalItem {
  intensidad?: number;
}

export default function DiarioEmocionalScreen() {
  const router = useRouter();
  
  // Estados básicos
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Estados del formulario
  const [selectedDate, setSelectedDate] = useState(new Date());
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

  // Estados del modal
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<ModalType | null>(null);
  const [modalSearch, setModalSearch] = useState("");
  const [modalData, setModalData] = useState<EmotionalItem[]>([]);
  const [currentSelection, setCurrentSelection] = useState<EmotionalItem | null>(null);
  const [selectedIntensity, setSelectedIntensity] = useState<number | null>(null);

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

  // Títulos de modales centralizados
  const getModalTitle = () => {
    const titles = {
      'emocion': '¿Qué emoción tengo?',
      'sensacion': 'Tengo sensación de',
      'sintoma': 'Poseo síntomas de',
      'sentimiento': 'Siento',
      'intensidad': 'Nivel de intensidad',
      'otro': 'Escribe tu respuesta'
    };
    return titles[modalType as keyof typeof titles] || '';
  };

  // Cargar datos iniciales
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      
      // Cargar perfil del usuario
      const profile = await getUserProfile();
      const uid = profile?.data?.usuario?._id || profile?.data?._id;
      if (uid) setUserId(uid);

      // Cargar datos en paralelo
      const [emocionesRes, sensacionesRes, sintomasRes, sentimientosRes] = await Promise.all([
        listEmociones(),
        listSensaciones(),
        listSintomas(),
        listSentimientos()
      ]);

      setEmociones(emocionesRes?.data || []);
      setSensaciones(sensacionesRes?.data || []);
      setSintomas(sintomasRes?.data || []);
      setSentimientos(sentimientosRes?.data || []);

    } catch (error) {
      console.error('Error cargando datos:', error);
      Alert.alert('Error', 'No se pudieron cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  // Validar fecha (no más de un mes atrás, no futuros)
  const validateDate = (date: Date): boolean => {
    const today = new Date();
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(today.getMonth() - 1);
    
    return date >= oneMonthAgo && date <= today;
  };

  // Formatear fecha para mostrar
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('es-ES');
  };

  // Validar palabras mínimas en el texto
  const validateMinWords = (text: string): boolean => {
    const words = text.trim().split(/\s+/).filter(word => word.length > 0);
    return words.length >= 25;
  };

  // Abrir modal para seleccionar
  const openModal = (type: ModalType, data: EmotionalItem[]) => {
    setModalType(type);
    
    // Agregar opción "Otro" al final de la lista para permitir crear elementos personalizados
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
    setModalData([]);
    setCurrentSelection(null);
    setSelectedIntensity(null);
    setCustomText("");
    setModalSearch("");
  };

  // Seleccionar item en modal
  const selectItem = (item: EmotionalItem) => {
    if (item.nombre === "Otro") {
      setModalType('otro');
      return;
    }
    
    setCurrentSelection(item);
    // Si no es una opción negativa, pedir intensidad
    if (!item.nombre.toLowerCase().includes('no tengo') && 
        !item.nombre.toLowerCase().includes('no siento')) {
      setModalType('intensidad');
    } else {
      // Confirmar selección sin intensidad
      confirmSelection(item, null);
    }
  };

  // Confirmar selección con intensidad
  const confirmSelection = async (item: EmotionalItem, intensidad: number | null) => {
    const selectedWithIntensity: SelectedItem = { ...item, intensidad: intensidad ?? undefined };

    switch (modalType) {
      case 'emocion':
        setSelectedEmocion(selectedWithIntensity);
        break;
      case 'sensacion':
        setSelectedSensacion(selectedWithIntensity);
        break;
      case 'sintoma':
        setSelectedSintoma(selectedWithIntensity);
        break;
      case 'sentimiento':
        setSelectedSentimiento(selectedWithIntensity);
        break;
    }
    
    closeModal();
  };

  // Crear elemento personalizado
  const createCustomItem = async () => {
    if (!customText.trim()) {
      Alert.alert('Error', 'Debes escribir el nombre del elemento');
      return;
    }

    try {
      let newItem: EmotionalItem | null = null;

      switch (modalType) {
        case 'sensacion':
          const sensacionRes = await createSensacion({
            nombre: customText.trim(),
            tipo: 'Otros'
          });
          newItem = sensacionRes.data;
          break;
        case 'sintoma':
          const sintomaRes = await createSintoma({
            nombre: customText.trim(),
            tipo: 'Otros'
          });
          newItem = sintomaRes.data;
          break;
        case 'sentimiento':
          const sentimientoRes = await createSentimiento({
            nombre: customText.trim(),
            tipo: 'Otros'
          });
          newItem = sentimientoRes.data;
          break;
      }

      if (newItem) {
        setCurrentSelection(newItem);
        setModalType('intensidad');
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo crear el elemento personalizado');
    }
  };

  // Validar formulario
  const validateForm = (): boolean => {
    if (!selectedEmocion) {
      Alert.alert('Campo requerido', 'Debes seleccionar una emoción');
      return false;
    }
    if (!selectedSensacion) {
      Alert.alert('Campo requerido', 'Debes seleccionar una sensación');
      return false;
    }
    if (!selectedSintoma) {
      Alert.alert('Campo requerido', 'Debes seleccionar un síntoma');
      return false;
    }
    if (!selectedSentimiento) {
      Alert.alert('Campo requerido', 'Debes seleccionar un sentimiento');
      return false;
    }
    if (!validateMinWords(hoySiento)) {
      Alert.alert('Campo requerido', 'El campo "Hoy siento" debe tener al menos 25 palabras');
      return false;
    }
    return true;
  };

  // Guardar diario
  const handleSave = async () => {
    if (!validateForm() || !userId) return;

    try {
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

      await createDiario(payload);

      // Limpiar formulario
      setSelectedEmocion(null);
      setSelectedSensacion(null);
      setSelectedSintoma(null);
      setSelectedSentimiento(null);
      setHoySiento("");
      setSelectedDate(new Date());

      Alert.alert('Éxito', 'Registro guardado correctamente');

      // Redirigir al mainMenu después de cerrar el alert
      setTimeout(() => {
        router.push('/mainMenu');
      }, 1500);

    } catch (error: any) {
      Alert.alert('Error', error?.message || 'No se pudo guardar el registro');
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
            <Pressable style={styles.dateButton} onPress={() => {}}>
              <Text style={styles.dateText}>{formatDate(selectedDate)}</Text>
              <MaterialCommunityIcons name="calendar" size={20} color="#5E4AE3" />
            </Pressable>
          </View>

          {/* Emoción */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>¿Qué emoción tengo? *</Text>
            <Pressable 
              style={styles.selectButton} 
              onPress={() => openModal('emocion', emociones)}
            >
              <Text style={selectedEmocion ? styles.selectedText : styles.placeholderText}>
                {selectedEmocion ? `${selectedEmocion.nombre}${selectedEmocion.intensidad ? ` (${selectedEmocion.intensidad}/10)` : ''}` : 'Seleccionar emoción'}
              </Text>
              <MaterialCommunityIcons name="chevron-down" size={20} color="#666" />
            </Pressable>
          </View>

          {/* Sensación */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Tengo sensación de *</Text>
            <Pressable 
              style={styles.selectButton} 
              onPress={() => openModal('sensacion', sensaciones)}
            >
              <Text style={selectedSensacion ? styles.selectedText : styles.placeholderText}>
                {selectedSensacion ? `${selectedSensacion.nombre}${selectedSensacion.intensidad ? ` (${selectedSensacion.intensidad}/10)` : ''}` : 'Seleccionar sensación'}
              </Text>
              <MaterialCommunityIcons name="chevron-down" size={20} color="#666" />
            </Pressable>
          </View>

          {/* Síntomas */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Poseo síntomas de *</Text>
            <Pressable 
              style={styles.selectButton} 
              onPress={() => openModal('sintoma', sintomas)}
            >
              <Text style={selectedSintoma ? styles.selectedText : styles.placeholderText}>
                {selectedSintoma ? `${selectedSintoma.nombre}${selectedSintoma.intensidad ? ` (${selectedSintoma.intensidad}/10)` : ''}` : 'Seleccionar síntoma'}
              </Text>
              <MaterialCommunityIcons name="chevron-down" size={20} color="#666" />
            </Pressable>
          </View>

          {/* Sentimientos */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Siento *</Text>
            <Pressable 
              style={styles.selectButton} 
              onPress={() => openModal('sentimiento', sentimientos)}
            >
              <Text style={selectedSentimiento ? styles.selectedText : styles.placeholderText}>
                {selectedSentimiento ? `${selectedSentimiento.nombre}${selectedSentimiento.intensidad ? ` (${selectedSentimiento.intensidad}/10)` : ''}` : 'Seleccionar sentimiento'}
              </Text>
              <MaterialCommunityIcons name="chevron-down" size={20} color="#666" />
            </Pressable>
          </View>

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
              // Modal de intensidad
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
                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.modalButtonCancel]}
                    onPress={closeModal}
                  >
                    <Text style={styles.modalButtonTextCancel}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.modalButton, 
                      styles.modalButtonAccept,
                      !selectedIntensity && styles.modalButtonDisabled
                    ]}
                    onPress={() => {
                      if (selectedIntensity && currentSelection) {
                        confirmSelection(currentSelection, selectedIntensity);
                      } else {
                        Alert.alert('Campo requerido', 'Debes seleccionar un nivel de intensidad');
                      }
                    }}
                    disabled={!selectedIntensity}
                  >
                    <Text style={styles.modalButtonTextAccept}>Aceptar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : modalType === 'otro' ? (
              // Modal de texto personalizado
              <View style={styles.modalContent}>
                <TextInput
                  style={styles.customInput}
                  placeholder="Escribe tu respuesta..."
                  value={customText}
                  onChangeText={setCustomText}
                  autoFocus
                />
                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.modalButtonCancel]}
                    onPress={closeModal}
                  >
                    <Text style={styles.modalButtonTextCancel}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.modalButtonAccept]}
                    onPress={createCustomItem}
                  >
                    <Text style={styles.modalButtonTextAccept}>Crear</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              // Modal de selección de items
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
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.modalItem}
                      onPress={() => selectItem(item)}
                    >
                      <Text style={styles.modalItemText}>{item.nombre}</Text>
                      {item.descripcion && (
                        <Text style={styles.modalItemDescription}>{item.descripcion}</Text>
                      )}
                    </TouchableOpacity>
                  )}
                  style={styles.modalList}
                  ItemSeparatorComponent={() => <View style={styles.modalSeparator} />}
                />
              </View>
            )}
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
});