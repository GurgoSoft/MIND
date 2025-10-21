import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, FlatList, Modal, Alert, StatusBar, SafeAreaView, RefreshControl, Platform, useWindowDimensions } from 'react-native';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { listUsers, listEstados, listAccesos, listNotificaciones, filterEstados, createEstado, updateEstado, deleteEstado, listTiposUsuario, createAcceso, updateAcceso, deleteAcceso, createNotificacion, updateNotificacion, deleteNotificacion, register, updateUser } from '../services/api';

type IoniconsName = ComponentProps<typeof Ionicons>["name"];
type UserStateKey = '0001'|'0002'|'0003'|'0004'|'0005'|'0006';
type AdminUser = {
  id: string;
  name: string;
  email: string;
  idEstado: UserStateKey;
  verified?: boolean;
  license?: string;
  registrationDate?: string;
};

// Definición de estados con sus configuraciones
const USER_STATES: Record<UserStateKey, { name: string; color: string; icon: IoniconsName; permissions: string[] }> = {
  '0001': {
    name: 'Super Administrador',
    color: '#6AB9D2',
    icon: 'shield-checkmark',
    permissions: ['all']
  },
  '0002': {
    name: 'Administrador',
    color: '#D276C3',
    icon: 'person-circle',
    permissions: ['manage_users', 'view_reports']
  },
  '0003': {
    name: 'Activo',
    color: '#40C9A2',
    icon: 'checkmark-circle',
    permissions: ['basic']
  },
  '0004': {
    name: 'Pendiente de Verificación',
    color: '#E8871E',
    icon: 'time-outline',
    permissions: ['limited']
  },
  '0005': {
    name: 'Especialista de Salud Mental',
    color: '#7B68EE',
    icon: 'medkit-outline',
    permissions: ['view_daily_records', 'filter_patients']
  },
  '0006': {
    name: 'Inactivo',
    color: '#FF6B6B',
    icon: 'close-circle',
    permissions: []
  }
};

// Componente de Badge de Estado
const StatusBadge = ({ stateId }: { stateId: UserStateKey }) => {
  const state = USER_STATES[stateId] || USER_STATES['0004'];
  
  return (
    <View style={[styles.statusBadge, { backgroundColor: state.color + '20' }]}>
      <View style={[styles.statusDot, { backgroundColor: state.color }]} />
      <Text style={[styles.statusText, { color: state.color }]}>
        {state.name}
      </Text>
    </View>
  );
};

// Componente de tarjeta de usuario
const UserCard = ({ user, onPress }: { user: AdminUser; onPress: (u: AdminUser) => void }) => {
  const state = USER_STATES[user.idEstado] || USER_STATES['0004'];
  
  return (
    <TouchableOpacity 
      style={[styles.userCard, { borderLeftColor: state.color }]}
      onPress={() => onPress(user)}
      activeOpacity={0.7}
    >
      <View style={styles.userCardContent}>
        <View style={styles.userAvatar}>
          <Ionicons name={state.icon} size={24} color={state.color} />
        </View>
        
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{user.name}</Text>
          <Text style={styles.userEmail}>{user.email}</Text>
          {user.license && user.idEstado === '0005' && (
            <View style={styles.licenseContainer}>
              <FontAwesome5 name="id-card" size={12} color="#666" />
              <Text style={styles.licenseText}>Lic: {user.license}</Text>
            </View>
          )}
        </View>
        
        <View style={styles.userActions}>
          <StatusBadge stateId={user.idEstado} />
          {user.verified && (
            <Ionicons 
              name="checkmark-circle" 
              size={20} 
              color="#40C9A2" 
              style={styles.verifiedIcon}
            />
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

// Modal de detalles del usuario
const UserDetailsModal = ({ visible, user, onClose, onUpdateStatus, onChangeRole }: { visible: boolean; user: AdminUser | null; onClose: () => void; onUpdateStatus: (userId: string, newStatus: UserStateKey) => void; onChangeRole: (userId: string, tipoUsuarioId: string) => void; }) => {
  if (!user) return null;

  const state = USER_STATES[user.idEstado] || USER_STATES['0004'];
  
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={[styles.modalHeader, { backgroundColor: state.color }]}>
            <Text style={styles.modalTitle}>Detalles del Usuario</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="white" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalBody}>
            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>Nombre:</Text>
              <Text style={styles.detailValue}>{user.name}</Text>
            </View>
            
            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>Email:</Text>
              <Text style={styles.detailValue}>{user.email}</Text>
            </View>
            
            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>Estado Actual:</Text>
              <StatusBadge stateId={user.idEstado} />
            </View>

            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>Rol (Tipo de Usuario):</Text>
              {/* Selector simple por ahora: botones para roles conocidos */}
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {[
                  { label: 'Super Administrador', code: 'SUPERADMIN' },
                  { label: 'Administrador', code: 'ADMIN' },
                  { label: 'Paciente', code: 'PACIENTE' },
                  { label: 'Especialista', code: 'ESPECIALISTA' },
                ].map(r => (
                  <TouchableOpacity key={r.code} style={styles.roleChip} onPress={() => onChangeRole(user.id, r.code)}>
                    <Text style={styles.roleChipText}>{r.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            
            {user.idEstado === '0005' && (
              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Licencia:</Text>
                <Text style={styles.detailValue}>{user.license || 'No especificada'}</Text>
              </View>
            )}
            
            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>Fecha de Registro:</Text>
              <Text style={styles.detailValue}>{user.registrationDate}</Text>
            </View>
            
            <View style={styles.statusChangeSection}>
              <Text style={styles.sectionTitle}>Cambiar Estado</Text>
              <View style={styles.statusOptions}>
                {Object.entries(USER_STATES).map(([id, stateInfo]) => (
                  <TouchableOpacity
                    key={id}
                    style={[
                      styles.statusOption,
                      { borderColor: stateInfo.color },
                      user.idEstado === id && { backgroundColor: stateInfo.color + '20' }
                    ]}
                    onPress={() => onUpdateStatus(user.id, id as UserStateKey)}
                  >
                    <Ionicons name={stateInfo.icon as IoniconsName} size={16} color={stateInfo.color} />
                    <Text style={[styles.statusOptionText, { color: stateInfo.color }]}>
                      {stateInfo.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

// Componente principal
export default function UserManagementSystem() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<AdminUser[]>([]);
  const [searchText, setSearchText] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  // Crear usuario
  const [tiposUsuario, setTiposUsuario] = useState<any[]>([]);
  const [createUserOpen, setCreateUserOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState({
    nombres: '',
    apellidos: '',
    numDoc: '',
    fechaNacimiento: '', // YYYY-MM-DD
    email: '',
    password: '',
    tipoCode: 'ADMIN' as 'SUPERADMIN'|'ADMIN'|'PACIENTE'|'ESPECIALISTA',
  });

  // NUEVO: datos admin
  const [estados, setEstados] = useState([]);
  const [accesos, setAccesos] = useState([]);
  const [notificaciones, setNotificaciones] = useState([]);
  const [section, setSection] = useState<'usuarios'|'estados'|'mensajes'|'notificaciones'|'registros'|'personas'>('usuarios');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // NUEVO: filtros y estado modal para estados
  const [estadoFilters, setEstadoFilters] = useState({ nombre: '', simbolo: '', modulo: '', visible: undefined as undefined | boolean });
  const [estadoModalOpen, setEstadoModalOpen] = useState(false);
  const [estadoEditing, setEstadoEditing] = useState<any>(null);
  const [estadoForm, setEstadoForm] = useState({ codigo: '', nombre: '', simbolo: '', color: '', descripcion: '', modulo: 'TODOS', visible: true });
  const [estadoPage, setEstadoPage] = useState(1);
  const [estadoPageSize, setEstadoPageSize] = useState(10);

  useEffect(() => {
    loadAll();
  }, []);

  // Auto-refresh cada 30 segundos para la sección de usuarios
  useEffect(() => {
    if (section !== 'usuarios') return;
    
    const interval = setInterval(() => {
      if (!loading && !refreshing) {
        loadAll();
      }
    }, 30000); // 30 segundos

    return () => clearInterval(interval);
  }, [section, loading, refreshing]);

  async function loadAll() {
    setLoading(true);
    setErrorMsg('');
    try {
      const [usersRes, estRes, accRes, notifRes] = await Promise.all([
        listUsers() as any,
        listEstados() as any,
        listAccesos() as any,
        listNotificaciones() as any,
      ]);

      const validCodes = new Set<UserStateKey>(['0001','0002','0003','0004','0005','0006']);
      const realUsers: AdminUser[] = (usersRes?.data || []).map((u: any) => {
        const fullName = `${u.idPersona?.nombres || ''} ${u.idPersona?.apellidos || ''}`.trim();
        const code: string | undefined = u.idEstado?.codigo;
        const idEstado: UserStateKey = validCodes.has(code as UserStateKey)
          ? (code as UserStateKey)
          : (u.idTipoUsuario?.codigo === 'PACIENTE' ? '0004' : '0002');
        return {
          id: u._id,
          name: fullName || u.email,
          email: u.email,
          idEstado,
          verified: !!u.activo,
          registrationDate: new Date(u.createdAt || u.fechaCreacion || Date.now()).toISOString().slice(0,10),
        };
      });

      setUsers(realUsers);
      setFilteredUsers(realUsers);
      setEstados(estRes?.data || []);
      setAccesos(accRes?.data || []);
      setNotificaciones(notifRes?.data || []);
      // Tipos de usuario para crear/cambiar rol
      try {
        const tu = await listTiposUsuario() as any;
        setTiposUsuario(tu?.data || []);
      } catch {}
    } catch (e: any) {
      setErrorMsg(e?.message || 'Error cargando datos de administración');
    } finally {
      setLoading(false);
    }
  }

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    loadAll().finally(() => setRefreshing(false));
  }, []);

  // Filtrar usuarios
  useEffect(() => {
  let filtered: AdminUser[] = [...users];
    
    // Filtro por texto
    if (searchText) {
      filtered = filtered.filter(user =>
        user.name.toLowerCase().includes(searchText.toLowerCase()) ||
        user.email.toLowerCase().includes(searchText.toLowerCase())
      );
    }
    
    // Filtro por estado
    if (selectedFilter !== 'all') {
  filtered = filtered.filter(user => user.idEstado === (selectedFilter as UserStateKey));
    }
    
    setFilteredUsers(filtered);
  }, [searchText, selectedFilter, users]);

  const handleStatusUpdate = async (userId: string, newStatus: UserStateKey) => {
    Alert.alert(
      'Confirmar Cambio',
      `¿Desea cambiar el estado del usuario a ${USER_STATES[newStatus].name}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: async () => {
            try {
              // Buscar el estado correspondiente
              const estadoCorrespondiente = estados.find((e: any) => e.codigo === newStatus) as any;
              if (estadoCorrespondiente) {
                await updateUser(userId, { idEstado: estadoCorrespondiente._id });
              }
              
              // Actualizar localmente y recargar datos
              setUsers((prevUsers: AdminUser[]) => 
                prevUsers.map((user) => 
                  user.id === userId ? { ...user, idEstado: newStatus } : user
                )
              );
              setModalVisible(false);
              
              // Recargar todos los datos para asegurar consistencia
              await loadAll();
              
              Alert.alert('Éxito', 'Estado actualizado correctamente');
            } catch (error: any) {
              Alert.alert('Error', error?.message || 'No se pudo actualizar el estado');
            }
          }
        }
      ]
    );
  };

  async function handleChangeRole(userId: string, roleCode: string) {
    try {
      // Resolver idTipoUsuario desde lista de tipos
      let tipos = tiposUsuario;
      if (!tipos || tipos.length === 0) {
        try { const tu = await listTiposUsuario() as any; tipos = tu?.data || []; setTiposUsuario(tipos); } catch {}
      }
      const match = (tipos || []).find((t:any) => (t.codigo || t.nmTipoUsuario || '').toUpperCase() === roleCode.toUpperCase());
      const idValor = match?._id || roleCode; // fallback: enviar code si backend lo acepta
      // Llamada API
      await updateUser(userId, { idTipoUsuario: idValor as any });
      Alert.alert('Rol actualizado', 'El rol del usuario fue actualizado.');
    } catch (e:any) {
      Alert.alert('Error', e?.payload?.message || e?.message || 'No se pudo actualizar el rol');
    }
  }

  const getStatCount = (stateId: UserStateKey) => {
    return users.filter(user => user.idEstado === stateId).length;
  };

  // NUEVO: aplicar filtros de estados
  async function applyEstadoFilters() {
    try {
      const res = await filterEstados({
        nombre: estadoFilters.nombre || undefined,
        simbolo: estadoFilters.simbolo || undefined,
        modulo: estadoFilters.modulo || undefined,
        visible: typeof estadoFilters.visible === 'boolean' ? estadoFilters.visible : undefined,
      }) as any;
      setEstados(res?.data || []);
    } catch (e:any) {
      setErrorMsg(e?.message || 'Error filtrando estados');
    }
  }

  // NUEVO: abrir modal de nuevo estado
  function openNewEstado() {
    setEstadoEditing(null);
    setEstadoForm({ codigo: '', nombre: '', simbolo: '', color: '', descripcion: '', modulo: 'TODOS', visible: true });
    setEstadoModalOpen(true);
  }
  // NUEVO: abrir modal de editar estado
  function openEditEstado(e: any) {
    setEstadoEditing(e);
    setEstadoForm({
      codigo: e.codigo || '',
      nombre: e.nombre || '',
      simbolo: e.simbolo || '',
      color: e.color || '',
      descripcion: e.descripcion || '',
      modulo: e.modulo || 'TODOS',
      visible: typeof e.visible === 'boolean' ? e.visible : true,
    });
    setEstadoModalOpen(true);
  }
  // NUEVO: guardar estado (nuevo o editado)
  async function saveEstado() {
    try {
      if (!estadoForm.codigo.trim() || !estadoForm.nombre.trim()) {
        Alert.alert('Validación', 'Código y Nombre son requeridos');
        return;
      }
      if (estadoEditing?._id) {
        await updateEstado(estadoEditing._id, estadoForm);
      } else {
        await createEstado(estadoForm as any);
      }
      setEstadoModalOpen(false);
      await applyEstadoFilters();
    } catch (e:any) {
      Alert.alert('Error', e?.payload?.message || e?.message || 'Error guardando estado');
    }
  }
  // NUEVO: eliminar estado
  async function removeEstado(e:any) {
    Alert.alert('Confirmar', `¿Eliminar el estado ${e.nombre}?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: async () => {
        try { await deleteEstado(e._id); await applyEstadoFilters(); }
        catch (err:any) { Alert.alert('Error', err?.payload?.message || err?.message || 'Error eliminando estado'); }
      }}
    ]);
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#6B5B95" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeftArea}>
          <TouchableOpacity style={styles.hamburger} accessibilityLabel="Menú">
            <Ionicons name="menu" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.appTitle}>Panel de Administración</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsContent} style={styles.tabsScroll}>
          {(['usuarios','estados','mensajes','notificaciones','registros','personas'] as const).map((s) => (
            <TouchableOpacity
              key={s}
              style={[styles.tabPill, section===s && styles.tabPillActive]}
              onPress={() => setSection(s)}
            >
              <Text style={[styles.tabPillText, section===s && styles.tabPillTextActive]}>
                {s === 'usuarios' ? 'Usuarios' : s === 'estados' ? 'Estados' : s === 'mensajes' ? 'Mensajes' : s === 'notificaciones' ? 'Notificaciones' : s === 'registros' ? 'Registros Diarios' : 'Registro de Personas'}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Contenido centrado y responsive */}
      <View style={styles.pageBody}>
        <View style={styles.contentMax}>
          {errorMsg ? (
            <View style={{ padding: 16 }}>
              <Text style={{ color: 'red' }}>{errorMsg}</Text>
            </View>
          ) : null}

      {section === 'usuarios' && (
        <View style={{ flex: 1 }}>
          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <View style={[styles.searchBar, styles.searchBarWide]}>
              <Ionicons name="search" size={20} color="#666" />
              <TextInput
                style={styles.searchInput}
                placeholder="Buscar por nombre o email..."
                value={searchText}
                onChangeText={setSearchText}
              />
              <TouchableOpacity 
                onPress={onRefresh} 
                style={styles.refreshButton}
                disabled={refreshing}
              >
                <Ionicons 
                  name="refresh" 
                  size={20} 
                  color={refreshing ? "#ccc" : "#666"} 
                />
              </TouchableOpacity>
            </View>
            <View style={[styles.userActionsRow, isDesktop && styles.userActionsRowWide]}>
              <TouchableOpacity style={styles.primaryButtonSm} onPress={() => setCreateUserOpen(true)}>
                <Text style={styles.primaryButtonSmText}>+ Adicionar Usuario</Text>
              </TouchableOpacity>
              {isDesktop ? (
                <View style={[styles.chipsWrapRow, { flex: 1 }]}>
                  <TouchableOpacity
                    style={[styles.filterChip, selectedFilter === 'all' && styles.filterChipActive]}
                    onPress={() => setSelectedFilter('all')}
                  >
                    <Text style={[styles.filterChipText, selectedFilter === 'all' && styles.filterChipTextActive]}>
                      Todos
                    </Text>
                  </TouchableOpacity>
                  {Object.entries(USER_STATES).map(([id, state]) => (
                    <TouchableOpacity
                      key={id}
                      style={[
                        styles.filterChip,
                        selectedFilter === id && styles.filterChipActive,
                        selectedFilter === id && { backgroundColor: state.color }
                      ]}
                      onPress={() => setSelectedFilter(id)}
                    >
                      <Text style={[
                        styles.filterChipText,
                        selectedFilter === id && styles.filterChipTextActive
                      ]}>
                        {state.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterChipsRow} style={styles.chipsInlineScroll}>
                  <TouchableOpacity
                    style={[styles.filterChip, selectedFilter === 'all' && styles.filterChipActive]}
                    onPress={() => setSelectedFilter('all')}
                  >
                    <Text style={[styles.filterChipText, selectedFilter === 'all' && styles.filterChipTextActive]}>
                      Todos
                    </Text>
                  </TouchableOpacity>
                  {Object.entries(USER_STATES).map(([id, state]) => (
                    <TouchableOpacity
                      key={id}
                      style={[
                        styles.filterChip,
                        selectedFilter === id && styles.filterChipActive,
                        selectedFilter === id && { backgroundColor: state.color }
                      ]}
                      onPress={() => setSelectedFilter(id)}
                    >
                      <Text style={[
                        styles.filterChipText,
                        selectedFilter === id && styles.filterChipTextActive
                      ]}>
                        {state.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </View>
          </View>


          {/* User List */}
          <FlatList
            data={filteredUsers}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <UserCard
                user={item}
                onPress={() => {
                  setSelectedUser(item);
                  setModalVisible(true);
                }}
              />
            )}
            contentContainerStyle={styles.listContainer}
            style={{ flex: 1 }}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="people-outline" size={64} color="#ccc" />
                <Text style={styles.emptyText}>No se encontraron usuarios</Text>
              </View>
            }
          />

          {/* User Details Modal */}
          <UserDetailsModal
            visible={modalVisible}
            user={selectedUser}
            onClose={() => {
              setModalVisible(false);
              setSelectedUser(null);
            }}
            onUpdateStatus={handleStatusUpdate}
            onChangeRole={handleChangeRole}
          />

          {/* Modal crear usuario */}
          <Modal visible={createUserOpen} transparent animationType="fade" onRequestClose={()=> setCreateUserOpen(false)}>
            <View style={styles.modalOverlayCenter}>
              <View style={[styles.modalCard, { backgroundColor: '#fff' }] }>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ fontSize: 16, fontWeight: '700' }}>Adicionar Usuario</Text>
                  <TouchableOpacity onPress={()=> setCreateUserOpen(false)}><Ionicons name="close" size={22} color="#333" /></TouchableOpacity>
                </View>
                <ScrollView style={{ marginTop: 10, maxHeight: 480 }}>
                  <Text style={styles.formLabel}>Nombres*</Text>
                  <TextInput style={styles.formInput} value={createForm.nombres} onChangeText={(t)=> setCreateForm(s=> ({...s, nombres:t}))} />
                  <Text style={styles.formLabel}>Apellidos*</Text>
                  <TextInput style={styles.formInput} value={createForm.apellidos} onChangeText={(t)=> setCreateForm(s=> ({...s, apellidos:t}))} />
                  <Text style={styles.formLabel}>Documento*</Text>
                  <TextInput style={styles.formInput} value={createForm.numDoc} onChangeText={(t)=> setCreateForm(s=> ({...s, numDoc:t}))} />
                  <Text style={styles.formLabel}>Fecha Nacimiento (YYYY-MM-DD)*</Text>
                  <TextInput style={styles.formInput} placeholder="2000-01-01" value={createForm.fechaNacimiento} onChangeText={(t)=> setCreateForm(s=> ({...s, fechaNacimiento:t}))} />
                  <Text style={styles.formLabel}>Correo*</Text>
                  <TextInput style={styles.formInput} keyboardType="email-address" autoCapitalize="none" value={createForm.email} onChangeText={(t)=> setCreateForm(s=> ({...s, email:t}))} />
                  <Text style={styles.formLabel}>Contraseña*</Text>
                  <TextInput style={styles.formInput} secureTextEntry value={createForm.password} onChangeText={(t)=> setCreateForm(s=> ({...s, password:t}))} />
                  <Text style={styles.formLabel}>Rol</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6 }}>
                    {(['SUPERADMIN','ADMIN','PACIENTE','ESPECIALISTA'] as const).map(rc => (
                      <TouchableOpacity key={rc} style={[styles.roleChip, createForm.tipoCode===rc && { backgroundColor: '#6B5B95' }]} onPress={()=> setCreateForm(s=> ({...s, tipoCode: rc}))}>
                        <Text style={[styles.roleChipText, createForm.tipoCode===rc && { color: '#fff' }]}>{rc}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
                <TouchableOpacity disabled={creating} style={[styles.tableFilterButton, { marginTop: 14, backgroundColor: creating? '#aaa':'#6AB9D2' }]} onPress={async ()=>{
                  // Validación mínima
                  if (!createForm.nombres.trim() || !createForm.apellidos.trim() || !createForm.numDoc.trim() || !createForm.fechaNacimiento.trim() || !createForm.email.trim() || !createForm.password) {
                    Alert.alert('Validación', 'Todos los campos marcados con * son obligatorios.');
                    return;
                  }
                  setCreating(true);
                  try {
                    // Resolver idTipoUsuario por código
                    let tipos = tiposUsuario;
                    if (!tipos || tipos.length === 0) {
                      try { const tu = await listTiposUsuario() as any; tipos = tu?.data || []; setTiposUsuario(tipos); } catch {}
                    }
                    const match = (tipos || []).find((t:any) => (t.codigo || t.nmTipoUsuario || '').toUpperCase() === createForm.tipoCode);
                    const idTipo = match?._id || createForm.tipoCode;
                    const payload = {
                      persona: {
                        nombres: createForm.nombres.trim(),
                        apellidos: createForm.apellidos.trim(),
                        numDoc: createForm.numDoc.trim(),
                        fechaNacimiento: new Date(createForm.fechaNacimiento).toISOString(),
                      },
                      usuario: {
                        idTipoUsuario: idTipo,
                        email: createForm.email.trim(),
                        passwordHash: createForm.password,
                      }
                    };
                    await register(payload as any);
                    setCreateUserOpen(false);
                    // recargar usuarios
                    await loadAll();
                    Alert.alert('Usuario creado', 'El usuario fue creado correctamente.');
                  } catch (e:any) {
                    Alert.alert('Error', e?.payload?.message || e?.message || 'No se pudo crear el usuario');
                  } finally {
                    setCreating(false);
                  }
                }}>
                  <Text style={{ color: '#fff', fontWeight: '700', textAlign: 'center' }}>{creating? 'Guardando...':'Guardar'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        </View>
      )}

      {section === 'estados' && (
        <View style={{ flex: 1 }}>
          {/* Filtros */}
          <View style={styles.filtersBar}>
            <View style={styles.filterItem}>
              <Text style={styles.smallLabel}>Nombre Estado</Text>
              <TextInput style={styles.tableFilterInput} placeholder="Filtrar por nombre" value={estadoFilters.nombre} onChangeText={(t)=>setEstadoFilters(s=>({...s,nombre:t}))} />
            </View>
            <View style={styles.filterItem}>
              <Text style={styles.smallLabel}>Símbolo Estado</Text>
              <TextInput style={styles.tableFilterInput} placeholder="Filtrar por símbolo" value={estadoFilters.simbolo} onChangeText={(t)=>setEstadoFilters(s=>({...s,simbolo:t}))} />
            </View>
            <View style={[styles.filterItem, styles.filterItemColor]}>
              <Text style={styles.smallLabel}>Color</Text>
              <View style={[styles.tableFilterInput, styles.colorInputRow]}>
                <Text style={{ color: '#666', flex: 1 }}>Color estado</Text>
                <TouchableOpacity accessibilityLabel="Limpiar color">
                  <Ionicons name="close-circle" size={18} color="#c9c9c9" />
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.filterItem}>
              <Text style={styles.smallLabel}>Módulo</Text>
              <TextInput style={styles.tableFilterInput} placeholder="Filtrar por módulo" value={estadoFilters.modulo} onChangeText={(t)=>setEstadoFilters(s=>({...s,modulo:t}))} />
            </View>
            <View style={[styles.filterItem, styles.visibleItem]}>
              <Text style={styles.smallLabel}>Visible</Text>
              <View style={styles.visibleRow}>
                {[
                  {label: 'Todos', value: undefined},
                  {label: 'Sí', value: true},
                  {label: 'No', value: false},
                ].map(opt => (
                  <TouchableOpacity
                    key={String(opt.value)}
                    onPress={() => setEstadoFilters(s=>({...s, visible: opt.value as any}))}
                    style={[styles.visibleChip, estadoFilters.visible === opt.value && styles.visibleChipActive]}
                  >
                    <Text style={[styles.visibleChipText, estadoFilters.visible === opt.value && styles.visibleChipTextActive]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <View style={styles.filterActions}>
              <TouchableOpacity style={styles.tableFilterButton} onPress={applyEstadoFilters}>
                <Text style={{ color: '#fff', fontWeight: '700' }}>Filtrar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.tableFilterButton, { backgroundColor: '#6AB9D2', marginLeft: 8 }]} onPress={openNewEstado}>
                <Text style={{ color: '#fff', fontWeight: '700' }}>+ Adicionar Estado</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Tabla */}
          <ScrollView style={styles.tableWrapper} contentContainerStyle={styles.tableContent}>
            {/* Header tabla */}
            <View style={styles.tableHeaderRow}>
              {['Identificador', 'Nombre Estado', 'Símbolo', 'Descripción', 'Color', 'Visible', 'Módulo', 'Acciones'].map((h)=> (
                <View key={h} style={[styles.th, h==='Descripción'? { flex: 2 } : {} ]}><Text style={styles.thText}>{h}</Text></View>
              ))}
            </View>
            {/* Filas */}
            {(estados||[]).slice((estadoPage-1)*estadoPageSize, estadoPage*estadoPageSize).map((e:any)=> (
              <View key={e._id} style={styles.tableRow}>
                <View style={styles.td}><Text style={styles.tdText}>{e.codigo}</Text></View>
                <View style={styles.td}><Text style={styles.tdText}>{e.nombre}</Text></View>
                <View style={styles.td}><Text style={styles.tdText}>{e.simbolo || ''}</Text></View>
                <View style={[styles.td, { flex: 2 }]}><Text style={styles.tdText} numberOfLines={2}>{e.descripcion || ''}</Text></View>
                <View style={styles.td}><View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: e.color || '#ccc' }} /></View>
                <View style={styles.td}><Text style={styles.tdText}>{e.visible ? 'Sí' : 'No'}</Text></View>
                <View style={styles.td}><Text style={styles.tdText}>{e.modulo || 'TODOS'}</Text></View>
                <View style={[styles.td, { flexDirection: 'row', gap: 8 }] }>
                  <TouchableOpacity onPress={() => openEditEstado(e)}>
                    <Ionicons name="create-outline" size={18} color="#666" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => removeEstado(e)}>
                    <Ionicons name="trash-outline" size={18} color="#C44" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}

            {/* Paginación simple */}
            <View style={styles.paginationRow}>
              <View style={styles.itemsPerPage}>
                <Text style={styles.itemsPerPageLabel}>Items per page:</Text>
                <View style={styles.itemsPerPageBox}><Text style={styles.itemsPerPageValue}>{estadoPageSize}</Text></View>
              </View>
              <View style={{ flex: 1 }} />
              <Text style={styles.rangeText}>{`${(estadoPage-1)*estadoPageSize + 1}–${Math.min(estadoPage*estadoPageSize, (estados?.length||0))} of ${(estados?.length||0)}`}</Text>
              <View style={{ width: 8 }} />
              <TouchableOpacity disabled={estadoPage<=1} onPress={()=> setEstadoPage(p => Math.max(1, p-1))}>
                <Ionicons name="chevron-back" size={18} color={estadoPage<=1? '#ccc':'#333'} />
              </TouchableOpacity>
              <TouchableOpacity disabled={estadoPage*estadoPageSize >= (estados?.length||0)} onPress={()=> setEstadoPage(p => p+1)}>
                <Ionicons name="chevron-forward" size={18} color={estadoPage*estadoPageSize >= (estados?.length||0)? '#ccc':'#333'} />
              </TouchableOpacity>
            </View>
          </ScrollView>

          {/* Modal crear/editar */}
          <Modal visible={estadoModalOpen} transparent animationType="fade" onRequestClose={()=>setEstadoModalOpen(false)}>
            <View style={styles.modalOverlayCenter}>
              <View style={[styles.modalCard, { backgroundColor: '#fff' }] }>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ fontSize: 16, fontWeight: '700' }}>{estadoEditing? 'Editar Estado' : 'Adicionar Estado'}</Text>
                  <TouchableOpacity onPress={()=>setEstadoModalOpen(false)}><Ionicons name="close" size={22} color="#333" /></TouchableOpacity>
                </View>
                <View style={{ marginTop: 10 }}>
                  <Text style={styles.formLabel}>Identificador (código)*</Text>
                  <TextInput style={styles.formInput} value={estadoForm.codigo} onChangeText={(t)=>setEstadoForm(s=>({...s,codigo:t}))} />
                  <Text style={styles.formLabel}>Nombre*</Text>
                  <TextInput style={styles.formInput} value={estadoForm.nombre} onChangeText={(t)=>setEstadoForm(s=>({...s,nombre:t}))} />
                  <Text style={styles.formLabel}>Símbolo</Text>
                  <TextInput style={styles.formInput} value={estadoForm.simbolo} onChangeText={(t)=>setEstadoForm(s=>({...s,simbolo:t}))} />
                  <Text style={styles.formLabel}>Descripción</Text>
                  <TextInput style={[styles.formInput, { height: 80 }]} multiline value={estadoForm.descripcion} onChangeText={(t)=>setEstadoForm(s=>({...s,descripcion:t}))} />
                  <Text style={styles.formLabel}>Color (hex)</Text>
                  <TextInput style={styles.formInput} placeholder="#40C9A2" value={estadoForm.color} onChangeText={(t)=>setEstadoForm(s=>({...s,color:t}))} />
                  <Text style={styles.formLabel}>Módulo</Text>
                  <TextInput style={styles.formInput} value={estadoForm.modulo} onChangeText={(t)=>setEstadoForm(s=>({...s,modulo:t}))} />
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                    <TouchableOpacity onPress={()=> setEstadoForm(s=>({...s, visible: !s.visible}))} style={{ width: 20, height: 20, borderWidth: 1, borderColor: '#aaa', marginRight: 10, backgroundColor: estadoForm.visible? '#6AB9D2' : '#fff' }} />
                    <Text>Visible</Text>
                  </View>
                  <TouchableOpacity style={[styles.tableFilterButton, { marginTop: 14 }]} onPress={saveEstado}>
                    <Text style={{ color: '#fff', fontWeight: '700', textAlign: 'center' }}>Guardar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        </View>
      )}

      {section === 'mensajes' && (
        <ScrollView contentContainerStyle={{ padding: 16 }}>
          {(accesos || []).map((a: any) => (
            <View key={a._id} style={{ backgroundColor: '#fff', borderRadius: 10, padding: 12, marginBottom: 10 }}>
              <Text style={{ fontWeight: '700' }}>{a.nombre}</Text>
              <Text style={{ color: '#666' }}>Código: {a.codigo}</Text>
              {a.scope ? <Text style={{ color: '#666' }}>Scope: {a.scope}</Text> : null}
            </View>
          ))}
          {(!accesos || accesos.length === 0) && (
            <Text style={{ color: '#666' }}>Sin mensajes/accesos</Text>
          )}
        </ScrollView>
      )}

      {section === 'notificaciones' && (
        <ScrollView contentContainerStyle={{ padding: 16 }}>
          {(notificaciones || []).map((n: any) => (
            <View key={n._id} style={{ backgroundColor: '#fff', borderRadius: 10, padding: 12, marginBottom: 10 }}>
              <Text style={{ fontWeight: '700' }}>{n.asunto || n.titulo || 'Notificación'}</Text>
              <Text style={{ color: '#666' }}>Tipo: {n.idTipoNotificacion?.nombre || n.tipo || 'N/A'}</Text>
              {n.destinatario ? <Text style={{ color: '#666' }}>Destinatario: {n.destinatario}</Text> : null}
            </View>
          ))}
          {(!notificaciones || notificaciones.length === 0) && (
            <Text style={{ color: '#666' }}>Sin notificaciones</Text>
          )}
        </ScrollView>
      )}

      {section === 'registros' && (
        <View style={{ padding: 16 }}>
          <Text style={{ color: '#333' }}>Registros Diarios: Aquí podrás listar y filtrar diarios por identificación del paciente (pendiente de wiring a backend).</Text>
        </View>
      )}

      {section === 'personas' && (
        <View style={{ padding: 16 }}>
          <Text style={{ color: '#333' }}>Registro de Personas: Aquí podrás consultar y gestionar personas asociadas a usuarios (pendiente de wiring a backend).</Text>
        </View>
      )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  header: {
    backgroundColor: '#6B5B95',
    padding: 20,
    paddingTop: 30,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5
  },
  headerLeftArea: { flexDirection: 'row', alignItems: 'center' },
  hamburger: { marginRight: 8, padding: 8 },
  appTitle: { fontSize: 18, color: '#fff', fontWeight: '700' },
  pageBody: { flex: 1, paddingHorizontal: 12, paddingVertical: 12 },
  contentMax: { width: '100%', maxWidth: 1200, alignSelf: 'center', flex: 1 },
  headerStats: {
    flexDirection: 'row',
    justifyContent: 'space-around'
  },
  statItem: {
    alignItems: 'center'
  },
  statNumber: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white'
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2
  },
  searchContainer: {
    paddingHorizontal: 0,
    paddingVertical: 12
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2
  },
  searchBarWide: { maxWidth: 900, alignSelf: 'center' },
  userActionsRow: { marginTop: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start', flexWrap: 'wrap', gap: 8 },
  userActionsRowWide: { maxWidth: 900, alignSelf: 'center' },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16
  },
  refreshButton: {
    padding: 8,
    marginLeft: 8,
    borderRadius: 6,
    backgroundColor: '#f0f0f0'
  },
  filtersBar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    alignItems: 'flex-end',
    paddingVertical: 12,
  },
  filterItem: { minWidth: 140, flexGrow: 1, flexShrink: 1 },
  filterItemColor: { maxWidth: 220 },
  filterActions: { flexDirection: 'row', alignItems: 'center', marginLeft: 'auto', flexWrap: 'wrap', gap: 8 },
  filterChip: {
    paddingHorizontal: 15,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#ddd'
  },
  filterChipActive: {
    backgroundColor: '#6B5B95',
    borderColor: '#6B5B95'
  },
  filterChipText: { fontSize: 13, color: '#666' },
  filterChipTextActive: {
    color: 'white',
    fontWeight: '600'
  },
  filterChipsRow: { alignItems: 'center', paddingVertical: 6 },
  chipsWrapRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8, paddingVertical: 6, paddingLeft: 12 },
  chipsInlineScroll: { marginLeft: 12, flex: 1, minWidth: 0 },
  primaryButtonSm: {
    backgroundColor: '#6B5B95',
    height: 36,
    paddingHorizontal: 14,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center'
  },
  primaryButtonSmText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  listContainer: { paddingBottom: 20, paddingHorizontal: 8 },
  userCard: { backgroundColor: 'white', marginHorizontal: 8, marginVertical: 5, borderRadius: 12, padding: 15, borderLeftWidth: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
  userCardContent: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  userAvatar: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  userInfo: {
    flex: 1
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2
  },
  userEmail: {
    fontSize: 14,
    color: '#666'
  },
  licenseContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4
  },
  licenseText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 5
  },
  userActions: {
    alignItems: 'flex-end'
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600'
  },
  verifiedIcon: {
    marginTop: 5
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 10
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end'
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%'
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white'
  },
  modalBody: {
    padding: 20
  },
  detailSection: {
    marginBottom: 15
  },
  detailLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5
  },
  detailValue: {
    fontSize: 16,
    color: '#333'
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
    marginTop: 10
  },
  statusChangeSection: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee'
  },
  statusOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10
  },
  statusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    marginRight: 8,
    marginBottom: 8
  },
  statusOptionText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 5
  },
  roleChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, backgroundColor: '#f2f2f7' },
  roleChipText: { color: '#333', fontWeight: '600' },
  tabsScroll: { marginTop: 12 },
  tabsContent: { paddingRight: 12, alignItems: 'center' },
  tabPill: { backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, marginRight: 8 },
  tabPillActive: { backgroundColor: 'rgba(255,255,255,0.35)' },
  tabPillText: { color: 'white', fontWeight: '600' },
  tabPillTextActive: { textDecorationLine: 'underline' },
  // NUEVO: estilos para tabla de estados
  smallLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4
  },
  tableFilterInput: {
    backgroundColor: 'white',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    marginRight: 8,
    minWidth: 120
  },
  tableFilterButton: {
    backgroundColor: '#6AB9D2',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 120
  },
  colorInputRow: { flexDirection: 'row', alignItems: 'center' },
  visibleItem: { minWidth: 200 },
  visibleRow: { flexDirection: 'row', gap: 8 },
  visibleChip: { paddingHorizontal: 10, paddingVertical: 8, backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd', borderRadius: 8 },
  visibleChipActive: { backgroundColor: '#6B5B95', borderColor: '#6B5B95' },
  visibleChipText: { color: '#666', fontWeight: '600' },
  visibleChipTextActive: { color: '#fff' },
  tableWrapper: { flex: 1, marginTop: 10 },
  tableContent: { paddingHorizontal: 0, paddingBottom: 16 },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2
  },
  th: {
    flex: 1,
    alignItems: 'flex-start'
  },
  thText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333'
  },
  tableRow: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2
  },
  td: {
    flex: 1,
    alignItems: 'flex-start'
  },
  tdText: {
    fontSize: 14,
    color: '#333'
  },
  paginationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingTop: 10
  },
  itemsPerPage: { flexDirection: 'row', alignItems: 'center' },
  itemsPerPageLabel: { color: '#666' },
  itemsPerPageBox: { marginHorizontal: 8, borderWidth: 1, borderColor: '#ddd', paddingHorizontal: 8, paddingVertical: Platform.OS === 'android' ? 4 : 6, borderRadius: 6, backgroundColor: '#fff' },
  itemsPerPageValue: { fontWeight: '700' },
  rangeText: { color: '#666' },
  modalOverlayCenter: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  modalCard: {
    width: '90%',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginTop: 10
  },
  formInput: {
    backgroundColor: 'white',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    marginTop: 6
  },
});