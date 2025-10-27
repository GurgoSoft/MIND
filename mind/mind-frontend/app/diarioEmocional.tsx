// DiarioEmocionalScreen.js
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  ScrollView,
  Image,
  Platform,
  Modal,
  FlatList,
  TouchableOpacity,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { getUserProfile, listDiarios, createDiario } from "../services/api";

export default function DiarioEmocionalScreen() {
  // Estados
  const [userName, setUserName] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [diarios, setDiarios] = useState<any[]>([]);
  const [selectedEmotion, setSelectedEmotion] = useState("");
  const [selectedIntensity, setSelectedIntensity] = useState("");
  const [selectedFeeling, setSelectedFeeling] = useState("");
  const [selectedSymptom, setSelectedSymptom] = useState("");
  const [hoySiento, setHoySiento] = useState("");

  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<null | 'emocion' | 'intensidad' | 'sensacion' | 'sintoma'>(null);
  const [modalSearch, setModalSearch] = useState("");

  // Datos (modifícalos como quieras)
  const emociones = ["Tristeza", "Alegría", "Miedo", "Ansiedad", "Ira", "Calma"];
  const intensidades = [
    "Demasiado leve",
    "Muy leve",
    "Ligeramente leve",
    "Leve",
    "Presuntamente moderado",
    "Moderado",
    "Ligeramente intenso",
    "Intenso",
    "Bastante intenso",
    "Demasiado intenso",
  ];
  const sensaciones = [
    "Soledad",
    "Tranquilidad",
    "Cariño",
    "Admiración",
    "Motivación",
    "Compasión",
    "Resentimiento",
    "Gozo",
  ];
  const sintomas = [
    "Nauseas",
    "Estreñimiento",
    "Cefalea",
    "Migraña",
    "Pálido",
    "Enrojecimiento",
    "Gastritis",
    "Falta de líbido",
  ];

  // Abre modal y resetea búsqueda
  const openModal = (type: 'emocion' | 'intensidad' | 'sensacion' | 'sintoma') => {
    setModalType(type);
    setModalSearch("");
    setModalVisible(true);
  };

  // Cargar perfil y diarios recientes
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const profile = await getUserProfile();
        if (!mounted) return;
        const p = profile?.data;
        const uid = p?.usuario?._id || p?._id;
        const first = p?.persona?.nombres ? String(p.persona.nombres).split(' ')[0] : '';
        if (first) setUserName(first);
        if (uid) setUserId(uid);
        // cargar diarios del usuario
        if (uid) {
          try {
            const res = await listDiarios({ idUsuario: uid, page: 1, limit: 10 });
            if (mounted) setDiarios(res?.data || []);
          } catch {}
        }
      } catch (e: any) {
        if (mounted) setError(e?.message || 'No se pudo cargar tu perfil');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  async function handleGuardar() {
    if (!userId) { setError('Sesión requerida'); return; }
    try {
      setLoading(true);
      setError(null);
      // Derivar una calificación de 1-5 según la intensidad seleccionada (simple)
      let cal = 3;
      if (selectedIntensity) {
        const idx = intensidades.findIndex(i => i === selectedIntensity);
        if (idx >= 0) cal = Math.min(5, Math.max(1, Math.round((idx + 1) / 2)));
      }
      const titulo = selectedEmotion ? `Me siento: ${selectedEmotion}` : 'Diario emocional';
      const descripcion = hoySiento?.trim() || undefined;
      await createDiario({
        diario: {
          idUsuario: userId,
          fecha: new Date().toISOString(),
          titulo,
          calificacion: cal,
          descripcion,
        }
      });
      // recargar lista
      const res = await listDiarios({ idUsuario: userId, page: 1, limit: 10 });
      setDiarios(res?.data || []);
      // limpiar inputs básicos
      setSelectedEmotion("");
      setSelectedIntensity("");
      setSelectedFeeling("");
      setSelectedSymptom("");
      setHoySiento("");
    } catch (e: any) {
      setError(e?.payload?.message || e?.message || 'No se pudo guardar');
    } finally {
      setLoading(false);
    }
  }

  // Selección desde modal
  const handleSelect = (item: string) => {
    if (modalType === "emocion") {
      setSelectedEmotion(item);
    } else if (modalType === "intensidad") {
      setSelectedIntensity(item);
    } else if (modalType === "sensacion") {
      setSelectedFeeling(item);
    } else if (modalType === "sintoma") {
      setSelectedSymptom(item);
    }
    setModalVisible(false);
    setModalType(null);
  };

  // Contenido del modal filtrado según modalType y búsqueda
  const renderModalContent = () => {
  let data: string[] = [];
    let title = "";

    if (modalType === "emocion") {
      data = emociones;
      title = "¿Qué emoción tengo?";
    } else if (modalType === "intensidad") {
      data = intensidades;
      title = "Intensidad de la emoción";
    } else if (modalType === "sensacion") {
      data = sensaciones;
      title = "Tengo sensación de:";
    } else if (modalType === "sintoma") {
      data = sintomas;
      title = "Poseo síntomas de:";
    }

    const filtered = data.filter((d) =>
      d.toLowerCase().includes(modalSearch.trim().toLowerCase())
    );

    return (
      <View style={styles.modalBox}>
        {/* header del modal */}
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>{title}</Text>
          <Pressable
            style={styles.closeButton}
            onPress={() => {
              setModalVisible(false);
              setModalType(null);
            }}
          >
            <MaterialCommunityIcons name="close" size={22} color="#333" />
          </Pressable>
        </View>

        {/* input de búsqueda dentro del modal */}
        <View style={styles.modalSearch}>
          <TextInput
            placeholder="Buscar"
            placeholderTextColor="#999"
            value={modalSearch}
            onChangeText={(t) => setModalSearch(t)}
            style={styles.modalSearchInput}
          />
        </View>

        {/* lista */}
        <FlatList
          data={filtered}
          keyExtractor={(item, idx) => `${item}-${idx}`}
          ItemSeparatorComponent={() => <View style={styles.divider} />}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.optionItem}
              onPress={() => handleSelect(item)}
            >
              <Text style={styles.optionText}>{item}</Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={{ paddingBottom: 10 }}
        />

        {/* botón aceptar (cierra) */}
        <Pressable
          style={styles.modalButton}
          onPress={() => {
            setModalVisible(false);
            setModalType(null);
          }}
        >
          <Text style={styles.modalButtonText}>Aceptar</Text>
        </Pressable>
      </View>
    );
  };

  return (
    <LinearGradient
      colors={["#859CE8", "#6AB0D2"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.container}
    >
      {/* Header con saludo */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Pressable style={styles.menuButton}>
            <MaterialCommunityIcons name="menu" size={22} color="#fff" />
          </Pressable>
          <Text style={styles.greeting}>Hola{userName ? `, ${userName}` : ''}</Text>
        </View>
        <Image
          source={require("../assets/MINDLOGO_BLUE.png")}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      {/* Contenido scrollable */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.innerWrapper}>
          <Text style={styles.title}>Diario Emocional</Text>

          {/* Fecha (dejé placeholder simple) */}
          <View style={styles.field}>
            <Text style={styles.label}>Fecha:</Text>
            <View style={styles.inputRow}>
              <TextInput style={styles.inputRowText} placeholder="__/__/____" />
              <MaterialCommunityIcons
                name="calendar"
                size={20}
                color="#5E4AE3"
                style={{ marginLeft: 8 }}
              />
            </View>
          </View>

          {/* EMOCIÓN: pressable para seleccionar desde la lista */}
          <View style={styles.field}>
            <Text style={styles.label}>¿Qué emoción tengo?</Text>
            <Pressable
              style={styles.input}
              onPress={() => openModal("emocion")}
            >
              <Text style={selectedEmotion ? styles.inputText : styles.placeholderText}>
                {selectedEmotion || "Seleccionar emoción"}
              </Text>
            </Pressable>
          </View>

          {/* INTENSIDAD: solo habilitado si hay emoción */}
          <View style={styles.field}>
            <Text style={styles.label}>Intensidad de la emoción</Text>
            <Pressable
              onPress={() => selectedEmotion && openModal("intensidad")}
              style={[styles.input, !selectedEmotion && styles.disabled]}
              disabled={!selectedEmotion}
            >
              <Text style={selectedIntensity ? styles.inputText : styles.placeholderText}>
                {selectedIntensity || "Seleccionar intensidad"}
              </Text>
            </Pressable>
            {!selectedEmotion && (
              <Text style={styles.helperText}>Selecciona o escribe una emoción primero.</Text>
            )}
          </View>

          {/* SENSACIÓN */}
          <View style={styles.field}>
            <Text style={styles.label}>Tengo sensación de:</Text>
            <Pressable
              style={styles.input}
              onPress={() => openModal("sensacion")}
            >
              <Text style={selectedFeeling ? styles.inputText : styles.placeholderText}>
                {selectedFeeling || "Seleccionar sensación"}
              </Text>
            </Pressable>
          </View>

          {/* SÍNTOMAS */}
          <View style={styles.field}>
            <Text style={styles.label}>Poseo síntomas de:</Text>
            <Pressable
              style={styles.input}
              onPress={() => openModal("sintoma")}
            >
              <Text style={selectedSymptom ? styles.inputText : styles.placeholderText}>
                {selectedSymptom || "Seleccionar síntoma"}
              </Text>
            </Pressable>
          </View>

          {/* Hoy siento */}
          <View style={styles.field}>
            <Text style={styles.label}>Hoy siento:</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Describe cómo te sientes..."
              placeholderTextColor="#c7c7c7"
              multiline
              textAlignVertical="top"
              value={hoySiento}
              onChangeText={setHoySiento}
            />
          </View>

          {/* Botón Guardar */}
          <Pressable style={styles.saveButton} disabled={loading || !userId} onPress={handleGuardar}>
            <View style={styles.saveGradient}>
              <Text style={styles.saveText}>{loading ? 'Guardando…' : 'Guardar'}</Text>
            </View>
          </Pressable>

          {/* Lista de últimos registros */}
          <View style={{ marginTop: 24 }}>
            <Text style={{ color: '#fff', fontWeight: '700', marginBottom: 8 }}>Mis últimos registros</Text>
            {(diarios || []).map((d:any) => (
              <View key={d._id} style={{ backgroundColor:'#fff', borderRadius:12, padding:10, marginBottom:8 }}>
                <Text style={{ fontWeight:'700', color:'#333' }}>{d.titulo || 'Diario'}</Text>
                <Text style={{ color:'#555' }}>Fecha: {new Date(d.fecha || d.createdAt).toISOString().slice(0,10)}</Text>
                {typeof d.calificacion === 'number' && (
                  <Text style={{ color:'#555' }}>Calificación: {d.calificacion}</Text>
                )}
              </View>
            ))}
            {(!diarios || diarios.length===0) && (
              <Text style={{ color:'#fff' }}>Aún no tienes registros.</Text>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Modal general */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalContainer}>
          {renderModalContent()}
        </View>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  /* Container + header */
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingTop: Platform.OS === "android" ? 20 : 44,
    paddingBottom: 8,
    backgroundColor: "#7675DD",
  },
  headerLeft: { flexDirection: "row", alignItems: "center" },
  menuButton: { marginRight: 8 },
  greeting: { color: "#fff", fontSize: 15, fontWeight: "600" },
  logo: { width: 40, height: 40 },

  /* Scroll / wrapper */
  scrollContent: {
    flexGrow: 1,
    alignItems: "center",
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  innerWrapper: { width: "100%", maxWidth: 420, alignSelf: "center" },

  /* Titulos y campos */
  title: { fontSize: 18, fontWeight: "700", color: "#fff", marginBottom: 20 },
  field: { marginBottom: 16, width: "100%" },
  label: { fontSize: 14, color: "#fff", marginBottom: 6, fontWeight: "600" },

  /* Inputs */
  input: {
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    justifyContent: "center",
  },
  inputText: { color: "#333", fontSize: 14 },
  placeholderText: { color: "#9aa3c6", fontSize: 14 },
  textInput: {
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 8,
    color: "#333",
    fontSize: 14,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  inputRowText: { flex: 1, fontSize: 14, color: "#333" },
  textArea: {
    height: 120,
    borderRadius: 16,
    paddingTop: 12,
  },

  /* Helper text + disabled */
  helperText: { color: "#f1e9ff", marginTop: 6, fontSize: 12 },
  disabled: { opacity: 0.65, backgroundColor: "#f3f4f8" },

  /* Botón guardar */
  saveButton: { marginTop: 20, borderRadius: 30, overflow: "hidden" },
  saveGradient: {
    paddingVertical: 14,
    borderRadius: 30,
    alignItems: "center",
    backgroundColor: "#5E4AE3", 
  },
  saveText: { color: "#fff", fontSize: 16, fontWeight: "700" },

  /* Modal */
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  modalBox: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 16,
    maxHeight: "80%",
    // sombreado
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  modalTitle: { fontSize: 16, fontWeight: "700", color: "#222" },
  closeButton: { padding: 6 },

  /* Buscador en modal */
  modalSearch: {
    marginBottom: 10,
  },
  modalSearchInput: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e6e6e6",
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === "android" ? 8 : 10,
    color: "#333",
  },

  /* Opciones */
  optionItem: {
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  optionText: { fontSize: 15, color: "#222" },
  divider: { height: 1, backgroundColor: "#eee", marginVertical: 2 },

  /* Botón aceptar modal */
  modalButton: {
    marginTop: 12,
    backgroundColor: "#859CE8",
    alignSelf: "flex-end",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
  },
  modalButtonText: { color: "#fff", fontWeight: "700" },
  errorBox: { backgroundColor: '#ffdddd', borderRadius: 10, padding: 10, margin: 12 },
  errorText: { color: '#a22', fontWeight: '700' },
});
