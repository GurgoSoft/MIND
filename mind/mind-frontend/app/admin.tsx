import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, FlatList, Modal, Alert, StatusBar, SafeAreaView, RefreshControl, Platform, useWindowDimensions, TouchableWithoutFeedback } from 'react-native';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { listUsers, listEstados, listAccesos, listNotificaciones, filterEstados, createEstado, updateEstado, deleteEstado, listTiposUsuario, createAcceso, updateAcceso, deleteAcceso, createNotificacion, updateNotificacion, deleteNotificacion, register, updateUser, listDiarios, listPersonas, listMenus, updateMenu } from '../services/api';

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
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback>
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
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

// Componente principal
export default function UserManagementSystem() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;
  const isSmall = width < 480;
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<AdminUser[]>([]);
  const [searchText, setSearchText] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
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
  const [createStep, setCreateStep] = useState<1|2>(1);
  // Fecha de nacimiento (picker personalizado estilo Register)
  const [dobModalOpen, setDobModalOpen] = useState(false);
  const [dobStep, setDobStep] = useState<'year'|'month'|'day'>('year');
  const [tempYear, setTempYear] = useState<number>(new Date().getFullYear());
  const [tempMonth, setTempMonth] = useState<number | null>(null); // 1-12
  const [tempDay, setTempDay] = useState<number | null>(null);
  const monthsEs = [
    'Enero','Febrero','Marzo','Abril','Mayo','Junio',
    'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'
  ];
  const today = new Date();
  const clampToMax = (y: number, m: number, d: number) => {
    const selected = new Date(y, m - 1, d);
    return selected > today ? today : selected;
  };
  const daysInMonth = (y: number, m: number) => new Date(y, m, 0).getDate();
  const isFutureMonth = (y: number, m: number) => y === today.getFullYear() && m > (today.getMonth() + 1);
  const isFutureDay = (y: number, m: number, d: number) => y === today.getFullYear() && m === (today.getMonth() + 1) && d > today.getDate();
  function openDobModal() {
    // Prefijar con la fecha actual seleccionada si existe
    try {
      if (createForm.fechaNacimiento) {
        const d = new Date(createForm.fechaNacimiento);
        if (!isNaN(d.getTime())) {
          setTempYear(d.getFullYear());
          setTempMonth(d.getMonth() + 1);
          setTempDay(d.getDate());
        } else {
          setTempYear(today.getFullYear()); setTempMonth(null); setTempDay(null);
        }
      } else {
        setTempYear(today.getFullYear()); setTempMonth(null); setTempDay(null);
      }
    } catch {
      setTempYear(today.getFullYear()); setTempMonth(null); setTempDay(null);
    }
    setDobStep('year');
    setDobModalOpen(true);
  }
  function confirmDob() {
    if (!tempYear || !tempMonth || !tempDay) return;
    const final = clampToMax(tempYear, tempMonth, tempDay);
    setCreateForm(s=> ({...s, fechaNacimiento: new Date(final).toISOString().slice(0,10)}));
    setDobModalOpen(false);
  }
  function formatFecha(iso: string) {
    if (!iso) return 'Seleccionar fecha';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return 'Seleccionar fecha';
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  }
  const [showPassword, setShowPassword] = useState(false);
  const [roleModalOpen, setRoleModalOpen] = useState(false);

  // NUEVO: datos admin
  const [estados, setEstados] = useState([]);
  const [accesos, setAccesos] = useState([]);
  const [notificaciones, setNotificaciones] = useState([]);
  const [section, setSection] = useState<'usuarios'|'estados'|'mensajes'|'notificaciones'|'registros'|'personas'|'menu'>('usuarios');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  // Menú derecho
  const [menuOpen, setMenuOpen] = useState(false);
  // Toast simple
  const [toast, setToast] = useState<{ type: 'success'|'error'|'info'; message: string } | null>(null);

  // NUEVO: filtros y estado modal para estados
  const [estadoFilters, setEstadoFilters] = useState({ nombre: '', simbolo: '', modulo: '', visible: undefined as undefined | boolean });
  const [estadoModalOpen, setEstadoModalOpen] = useState(false);
  const [estadoEditing, setEstadoEditing] = useState<any>(null);
  const [estadoForm, setEstadoForm] = useState({ codigo: '', nombre: '', simbolo: '', color: '', descripcion: '', modulo: 'TODOS', visible: true });
  const [estadoPage, setEstadoPage] = useState(1);
  const [estadoPageSize, setEstadoPageSize] = useState(10);

  // Accesos/Mensajes: modal
  const [accesoModalOpen, setAccesoModalOpen] = useState(false);
  const [accesoEditing, setAccesoEditing] = useState<any>(null);
  const [accesoForm, setAccesoForm] = useState({ nombre: '', codigo: '', scope: 'READ' as 'READ'|'WRITE'|'DELETE'|'ADMIN', visible: true });

  // Notificaciones: modal
  const [notifModalOpen, setNotifModalOpen] = useState(false);
  const [notifEditing, setNotifEditing] = useState<any>(null);
  const [notifForm, setNotifForm] = useState({ titulo: '', asunto: '', destinatario: '', tipo: '', visible: true, contenido: '' });

  // Personas
  const [personas, setPersonas] = useState<any[]>([]);
  const [qPersona, setQPersona] = useState('');
  const [personasPage, setPersonasPage] = useState(1);
  const [personasTotal, setPersonasTotal] = useState(0);

  // Diarios
  const [diarios, setDiarios] = useState<any[]>([]);
  const [diarioFilters, setDiarioFilters] = useState({ idUsuario: '', fechaInicio: '', fechaFin: '' });
  const [diariosPage, setDiariosPage] = useState(1);
  const [diariosTotal, setDiariosTotal] = useState(0);

  // Menús
  const [menus, setMenus] = useState<any[]>([]);
  const [menusLoading, setMenusLoading] = useState(false);
  const [menuModalOpen, setMenuModalOpen] = useState(false);
  const [menuEditing, setMenuEditing] = useState<any|null>(null);
  const [menuForm, setMenuForm] = useState<{ nombre: string; ruta?: string; icono?: string; orden: string; menuSuperiorId?: string|null; activo: boolean }>({ nombre: '', ruta: '', icono: '', orden: '0', menuSuperiorId: null, activo: true });
  const [menusRootOnly, setMenusRootOnly] = useState(true);
  function openNewMenu(){
    setMenuEditing(null);
    setMenuForm({ nombre:'', ruta:'', icono:'', orden:'0', menuSuperiorId: null, activo: true });
    setMenuModalOpen(true);
  }
  function openEditMenu(m:any){
    setMenuEditing(m);
    const parentId = typeof m.menuSuperior === 'string' ? m.menuSuperior : (m.menuSuperior?._id || null);
    setMenuForm({ nombre: m.nombre || '', ruta: m.ruta || '', icono: m.icono || '', orden: String(m.orden ?? 0), menuSuperiorId: parentId, activo: m.activo !== false });
    setMenuModalOpen(true);
  }
  async function saveMenu(){
    try{
      if(!menuForm.nombre.trim()) { setToast({ type:'error', message:'Nombre es requerido' }); return; }
      const ordenNum = Number(menuForm.orden);
      if(Number.isNaN(ordenNum)) { setToast({ type:'error', message:'Orden debe ser numérico' }); return; }
      const payload:any = {
        nombre: menuForm.nombre.trim(),
        ruta: menuForm.ruta?.trim() || undefined,
        icono: menuForm.icono?.trim() || undefined,
        orden: ordenNum,
        menuSuperior: menuForm.menuSuperiorId || null,
        activo: !!menuForm.activo,
      };
      if(menuEditing?._id){
        await updateMenu(menuEditing._id, payload);
      } else {
        await (await import('../services/api')).createMenu(payload);
      }
      setMenuModalOpen(false);
      const mm:any = await listMenus();
      setMenus(mm?.data || []);
      setToast({ type:'success', message:'Menú guardado' });
    } catch(e:any){ setToast({ type:'error', message: e?.payload?.message || e?.message || 'No se pudo guardar el menú' }); }
  }
  async function removeMenu(m:any){
    try{
      const del = (await import('../services/api')).deleteMenu; 
      await del(m._id);
      const mm:any = await listMenus();
      setMenus(mm?.data || []);
      setToast({ type:'success', message:'Menú eliminado' });
    }catch(e:any){ setToast({ type:'error', message: e?.payload?.message || e?.message || 'No se pudo eliminar' }); }
  }

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
      // Personas inicial
      try {
        const per = await listPersonas({ page: 1, limit: 10 }) as any;
        setPersonas(per?.data || []);
        setPersonasTotal(per?.total || (per?.data?.length || 0));
      } catch {}
      // Diarios inicial
      try {
        const d = await listDiarios({ page: 1, limit: 10 }) as any;
        setDiarios(d?.data || []);
        setDiariosTotal(d?.total || (d?.data?.length || 0));
      } catch {}
      // Tipos de usuario para crear/cambiar rol
      try {
        const tu = await listTiposUsuario() as any;
        setTiposUsuario(tu?.data || []);
      } catch {}

      // Menús (lista completa para administración)
      try {
        const mm:any = await listMenus();
        setMenus(mm?.data || []);
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
              
              setToast({ type: 'success', message: 'Estado actualizado correctamente' });
            } catch (error: any) {
              setToast({ type: 'error', message: error?.message || 'No se pudo actualizar el estado' });
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
      setToast({ type: 'success', message: 'Estado guardado' });
    } catch (e:any) {
      setToast({ type: 'error', message: e?.payload?.message || e?.message || 'Error guardando estado' });
    }
  }
  // NUEVO: eliminar estado
  async function removeEstado(e:any) {
    Alert.alert('Confirmar', `¿Eliminar el estado ${e.nombre}?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: async () => {
        try { await deleteEstado(e._id); await applyEstadoFilters(); setToast({ type: 'success', message: 'Estado eliminado' }); }
        catch (err:any) { setToast({ type: 'error', message: err?.payload?.message || err?.message || 'Error eliminando estado' }); }
      }}
    ]);
  }

  // Accesos (mensajes) helpers
  function openNewAcceso() {
    setAccesoEditing(null);
    setAccesoForm({ nombre: '', codigo: '', scope: 'READ', visible: true });
    setAccesoModalOpen(true);
  }
  function openEditAcceso(a:any) {
    setAccesoEditing(a);
    setAccesoForm({ nombre: a.nombre || '', codigo: a.codigo || '', scope: (a.scope || 'READ'), visible: a.visible ?? true });
    setAccesoModalOpen(true);
  }
  async function saveAcceso() {
    try {
      if (!accesoForm.nombre.trim() || !accesoForm.codigo.trim()) { Alert.alert('Validación','Código y nombre requeridos'); return; }
      if (accesoEditing?._id) await updateAcceso(accesoEditing._id, accesoForm);
      else await createAcceso(accesoForm as any);
      setAccesoModalOpen(false);
      const accRes:any = await listAccesos();
      setAccesos(accRes?.data || []);
    } catch (e:any) { Alert.alert('Error', e?.payload?.message || e?.message || 'Error guardando acceso'); }
  }
  async function removeAcceso(a:any) {
    Alert.alert('Confirmar',`¿Eliminar "${a.nombre}"?`,[
      { text:'Cancelar', style:'cancel' },
      { text:'Eliminar', style:'destructive', onPress: async()=>{
        try { await deleteAcceso(a._id); const acc:any = await listAccesos(); setAccesos(acc?.data||[]); }
        catch(err:any){ Alert.alert('Error', err?.payload?.message || err?.message || 'Error eliminando acceso'); }
      } }
    ]);
  }

  // Notificaciones helpers
  function openNewNotif() {
    setNotifEditing(null);
    setNotifForm({ titulo: '', asunto: '', destinatario: '', tipo: '', visible: true, contenido: '' });
    setNotifModalOpen(true);
  }
  function openEditNotif(n:any) {
    setNotifEditing(n);
    setNotifForm({ titulo: n.titulo || n.asunto || '', asunto: n.asunto || '', destinatario: n.destinatario || '', tipo: n.idTipoNotificacion?.nombre || n.tipo || '', visible: n.visible ?? true, contenido: n.mensaje || n.contenido || '' });
    setNotifModalOpen(true);
  }
  async function saveNotif() {
    try {
      if (!notifForm.titulo.trim() && !notifForm.asunto.trim()) { Alert.alert('Validación','Título o asunto requerido'); return; }
      if (notifEditing?._id) await updateNotificacion(notifEditing._id, notifForm as any);
      else await createNotificacion(notifForm as any);
      setNotifModalOpen(false);
      const n:any = await listNotificaciones(); setNotificaciones(n?.data||[]);
    } catch(e:any){ Alert.alert('Error', e?.payload?.message || e?.message || 'Error guardando notificación'); }
  }
  async function removeNotif(n:any){
    Alert.alert('Confirmar',`¿Eliminar notificación "${n.titulo || n.asunto || 'Notificación'}"?`,[
      { text:'Cancelar', style:'cancel' },
      { text:'Eliminar', style:'destructive', onPress: async()=>{
        try{ await deleteNotificacion(n._id); const res:any = await listNotificaciones(); setNotificaciones(res?.data||[]); }
        catch(err:any){ Alert.alert('Error', err?.payload?.message || err?.message || 'Error eliminando notificación'); }
      }}
    ]);
  }

  // Personas/Diarios loaders
  async function loadPersonas() {
    const res:any = await listPersonas({ page: personasPage, limit: 10, q: qPersona || undefined });
    setPersonas(res?.data || []);
    setPersonasTotal(res?.total || (res?.data?.length || 0));
  }
  async function loadDiarios() {
    const res:any = await listDiarios({ page: diariosPage, limit: 10, ...diarioFilters, fechaInicio: diarioFilters.fechaInicio || undefined, fechaFin: diarioFilters.fechaFin || undefined, idUsuario: diarioFilters.idUsuario || undefined });
    setDiarios(res?.data || []);
    setDiariosTotal(res?.total || (res?.data?.length || 0));
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#6B5B95" />

      {/* Toast */}
      {toast && (
        <View style={[styles.toast, toast.type==='success' && styles.toastSuccess, toast.type==='error' && styles.toastError]}>
          <Text style={styles.toastText}>{toast.message}</Text>
          <TouchableOpacity onPress={()=> setToast(null)}><Ionicons name="close" size={18} color="#fff" /></TouchableOpacity>
        </View>
      )}

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeftArea}>
          <TouchableOpacity style={styles.hamburger} accessibilityLabel="Menú">
            <Ionicons name="menu" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.appTitle}>Panel de Administración</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsContent} style={styles.tabsScroll}>
          {(['usuarios','estados','mensajes','notificaciones','registros','personas','menu'] as const).map((s) => (
            <TouchableOpacity
              key={s}
              style={[styles.tabPill, section===s && styles.tabPillActive]}
              onPress={() => setSection(s)}
            >
              <Text style={[styles.tabPillText, section===s && styles.tabPillTextActive]}>
                {s === 'usuarios' ? 'Usuarios' : s === 'estados' ? 'Estados' : s === 'mensajes' ? 'Mensajes' : s === 'notificaciones' ? 'Notificaciones' : s === 'registros' ? 'Registros Diarios' : s === 'personas' ? 'Registro de Personas' : 'Menú'}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        {/* Menú derecho desplegable */}
        <View style={styles.headerRightArea}>
          <TouchableOpacity onPress={()=> setMenuOpen(o=>!o)} style={styles.userBadge} accessibilityLabel="Menú de administración">
            <Ionicons name="person-circle" color="#fff" size={22} />
            <Text style={styles.userBadgeText}>Administración</Text>
            <Ionicons name={menuOpen? 'chevron-up' : 'chevron-down'} color="#fff" size={16} />
          </TouchableOpacity>
          {menuOpen && (
            <View style={[styles.dropdownMenu, isSmall && styles.dropdownMenuMobile]}>
              {[
                { key:'usuarios', label:'Usuarios', icon:'people-outline' },
                { key:'estados', label:'Estados', icon:'color-palette-outline' },
                { key:'mensajes', label:'Mensajes', icon:'document-text-outline' },
                { key:'notificaciones', label:'Notificaciones', icon:'notifications-outline' },
                { key:'registros', label:'Registros Diarios', icon:'newspaper-outline' },
                { key:'personas', label:'Registro de Personas', icon:'id-card-outline' },
                { key:'menu', label:'Menú', icon:'list-outline' },
              ].map(mi => (
                <TouchableOpacity key={mi.key} style={styles.dropdownItem} onPress={()=> { setSection(mi.key as any); setMenuOpen(false); }}>
                  <Ionicons name={mi.icon as any} size={16} color="#333" />
                  <Text style={styles.dropdownItemText}>{mi.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </View>

      {/* Backdrop para cerrar el menú al tocar fuera */}
      {menuOpen && (
        <TouchableWithoutFeedback onPress={()=> setMenuOpen(false)}>
          <View style={styles.menuBackdrop} />
        </TouchableWithoutFeedback>
      )}

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
            <View style={[styles.searchBar, styles.searchBarWide, searchFocused && styles.searchBarFocused]}>
              <Ionicons name="search" size={18} color={searchFocused ? '#6B5B95' : '#9aa0a6'} />
              <TextInput
                style={styles.searchInput}
                placeholder="Buscar usuario"
                value={searchText}
                onChangeText={setSearchText}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                placeholderTextColor="#94a3b8"
                selectionColor="#6B5B95"
                returnKeyType="search"
              />
              {!!searchText && (
                <TouchableOpacity 
                  onPress={() => setSearchText('')} 
                  style={styles.searchClearButton}
                  accessibilityLabel="Limpiar búsqueda"
                >
                  <Ionicons name="close-circle" size={18} color="#b0b8c1" />
                </TouchableOpacity>
              )}
            </View>
            <View style={[styles.userActionsRow, isDesktop && styles.userActionsRowWide]}>
              <TouchableOpacity style={styles.primaryButtonSm} onPress={() => { setCreateStep(1); setCreateUserOpen(true); }}>
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

          {/* Modal crear usuario con pasos */}
          <Modal visible={createUserOpen} transparent animationType="fade" onRequestClose={()=> setCreateUserOpen(false)}>
            <TouchableWithoutFeedback onPress={()=> setCreateUserOpen(false)}>
              <View style={styles.modalOverlayCenter}>
                <TouchableWithoutFeedback>
                  <View style={[styles.modalCard, { backgroundColor: '#fff' }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ fontSize: 16, fontWeight: '700' }}>Adicionar Usuario</Text>
                  <TouchableOpacity onPress={()=> setCreateUserOpen(false)}><Ionicons name="close" size={22} color="#333" /></TouchableOpacity>
                </View>
                <View style={{ marginTop: 10 }}>
                  <View style={styles.stepperRow}>
                    <View style={[styles.stepDot, createStep>=1 && styles.stepDotActive]} />
                    <View style={styles.stepLine} />
                    <View style={[styles.stepDot, createStep>=2 && styles.stepDotActive]} />
                  </View>
                  {createStep === 1 && (
                    <ScrollView style={{ maxHeight: 420 }}>
                      <Text style={styles.formLabel}>Nombres*</Text>
                      <TextInput style={styles.formInput} value={createForm.nombres} onChangeText={(t)=> setCreateForm(s=> ({...s, nombres:t}))} />
                      <Text style={styles.formLabel}>Apellidos*</Text>
                      <TextInput style={styles.formInput} value={createForm.apellidos} onChangeText={(t)=> setCreateForm(s=> ({...s, apellidos:t}))} />
                      <Text style={styles.formLabel}>Documento*</Text>
                      <TextInput style={styles.formInput} keyboardType="numeric" value={createForm.numDoc} onChangeText={(t)=> setCreateForm(s=> ({...s, numDoc:t.replace(/[^0-9]/g,'')}))} />
                      <Text style={styles.formLabel}>Fecha Nacimiento*</Text>
                      <TouchableOpacity style={[styles.formInput, { flexDirection:'row', alignItems:'center' }] } onPress={openDobModal}>
                        <Ionicons name="calendar-outline" size={18} color="#666" />
                        <Text style={{ marginLeft: 8, color:'#333' }}>{formatFecha(createForm.fechaNacimiento)}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.tableFilterButton, { marginTop: 14 }]} onPress={()=> setCreateStep(2)}>
                        <Text style={{ color:'#fff', fontWeight:'700', textAlign:'center' }}>Continuar</Text>
                      </TouchableOpacity>
                    </ScrollView>
                  )}
                  {createStep === 2 && (
                    <ScrollView style={{ maxHeight: 420 }}>
                      <Text style={styles.formLabel}>Correo*</Text>
                      <TextInput style={styles.formInput} keyboardType="email-address" autoCapitalize="none" value={createForm.email} onChangeText={(t)=> setCreateForm(s=> ({...s, email:t}))} />
                      <Text style={styles.formLabel}>Contraseña*</Text>
                      <View style={{ position:'relative' }}>
                        <TextInput style={[styles.formInput, { paddingRight: 80 }]} secureTextEntry={!showPassword} value={createForm.password} onChangeText={(t)=> setCreateForm(s=> ({...s, password:t}))} />
                        <TouchableOpacity onPress={()=> setShowPassword(s=> !s)} style={{ position:'absolute', right:40, top:12, padding:4 }}>
                          <Ionicons name={showPassword? 'eye-off-outline':'eye-outline'} size={18} color="#666" />
                        </TouchableOpacity>
                        <View style={{ position:'absolute', right:10, top:14 }}>
                          <Text style={{ color: passwordStrength(createForm.password).color, fontWeight:'700' }}>{passwordStrength(createForm.password).label}</Text>
                        </View>
                      </View>
                      <Text style={styles.formLabel}>Rol</Text>
                      <TouchableOpacity onPress={()=> setRoleModalOpen(true)} style={[styles.formInput, { flexDirection:'row', alignItems:'center' }]}>
                        <Ionicons name="person-outline" size={18} color="#666" />
                        <Text style={{ marginLeft: 8, fontWeight:'700', color:'#333' }}>{createForm.tipoCode}</Text>
                        <View style={{ marginLeft:'auto' }}><Ionicons name="chevron-down" size={18} color="#666" /></View>
                      </TouchableOpacity>
                      <View style={{ flexDirection:'row', gap:10, marginTop:12 }}>
                        <TouchableOpacity style={[styles.secondaryButton, { flex:1 }]} onPress={()=> setCreateStep(1)}>
                          <Text style={styles.secondaryButtonText}>Atrás</Text>
                        </TouchableOpacity>
                        <TouchableOpacity disabled={creating} style={[styles.tableFilterButton, { flex:1, backgroundColor: creating? '#aaa':'#6AB9D2' }]} onPress={async ()=>{
                          if (!createForm.nombres.trim() || !createForm.apellidos.trim() || !createForm.numDoc.trim() || !createForm.fechaNacimiento.trim() || !createForm.email.trim() || !createForm.password) {
                            setToast({ type:'error', message:'Todos los campos marcados con * son obligatorios.' });
                            return;
                          }
                          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(createForm.email)) { setToast({ type:'error', message:'Correo inválido' }); return; }
                          setCreating(true);
                          try {
                            let tipos = tiposUsuario;
                            if (!tipos || tipos.length === 0) {
                              try { const tu = await listTiposUsuario() as any; tipos = tu?.data || []; setTiposUsuario(tipos); } catch {}
                            }
                            const match = (tipos || []).find((t:any) => (t.codigo || t.nmTipoUsuario || '').toUpperCase() === createForm.tipoCode);
                            const idTipo = match?._id || createForm.tipoCode;
                            // Convertir fechaNacimiento (YYYY-MM-DD) a ISO UTC para evitar desfases por zona horaria
                            let fechaIso = '';
                            try {
                              const [y, m, d] = createForm.fechaNacimiento.split('-').map(Number);
                              if (y && m && d) {
                                const utcDate = new Date(Date.UTC(y, (m as number)-1, d as number));
                                fechaIso = utcDate.toISOString();
                              } else {
                                fechaIso = new Date(createForm.fechaNacimiento).toISOString();
                              }
                            } catch {
                              fechaIso = new Date(createForm.fechaNacimiento).toISOString();
                            }
                            const payload = {
                              persona: {
                                nombres: createForm.nombres.trim(),
                                apellidos: createForm.apellidos.trim(),
                                numDoc: createForm.numDoc.trim(),
                                fechaNacimiento: fechaIso,
                              },
                              usuario: {
                                idTipoUsuario: idTipo,
                                email: createForm.email.trim(),
                                passwordHash: createForm.password,
                              }
                            };
                            await register(payload as any);
                            setCreateUserOpen(false);
                            await loadAll();
                            setToast({ type:'success', message:'Usuario creado correctamente' });
                          } catch (e:any) {
                            setToast({ type:'error', message: e?.payload?.message || e?.message || 'No se pudo crear el usuario' });
                          } finally {
                            setCreating(false);
                          }
                        }}>
                          <Text style={{ color:'#fff', fontWeight:'700', textAlign:'center' }}>{creating? 'Guardando...':'Guardar'}</Text>
                        </TouchableOpacity>
                      </View>
                    </ScrollView>
                  )}
                </View>
                
                {/* Modal seleccionar rol */}
                <Modal visible={roleModalOpen} transparent animationType="fade" onRequestClose={()=> setRoleModalOpen(false)}>
                  <TouchableWithoutFeedback onPress={()=> setRoleModalOpen(false)}>
                    <View style={styles.modalOverlayCenter}>
                      <TouchableWithoutFeedback>
                        <View style={[styles.modalCard, { backgroundColor:'#fff' }]}>
                      <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center' }}>
                        <Text style={{ fontWeight:'700', fontSize:16 }}>Seleccionar Rol</Text>
                        <TouchableOpacity onPress={()=> setRoleModalOpen(false)}><Ionicons name="close" size={22} color="#333"/></TouchableOpacity>
                      </View>
                      <View style={{ marginTop: 10 }}>
                        {([
                          { code:'SUPERADMIN', label:'Super Administrador', icon:'shield-checkmark', color:'#6AB9D2' },
                          { code:'ADMIN', label:'Administrador', icon:'person-circle', color:'#D276C3' },
                          { code:'PACIENTE', label:'Paciente', icon:'person-outline', color:'#40C9A2' },
                          { code:'ESPECIALISTA', label:'Especialista', icon:'medkit-outline', color:'#7B68EE' },
                        ] as const).map(o => (
                          <TouchableOpacity key={o.code} style={styles.optionRow} onPress={()=> { setCreateForm(s=> ({...s, tipoCode: o.code})); setRoleModalOpen(false); }}>
                            <Ionicons name={o.icon as any} size={18} color={o.color} />
                            <Text style={styles.optionRowText}>{o.label}</Text>
                            {createForm.tipoCode === o.code && <Ionicons name="checkmark" size={18} color={o.color} style={{ marginLeft: 'auto' }} />}
                          </TouchableOpacity>
                        ))}
                      </View>
                        </View>
                      </TouchableWithoutFeedback>
                    </View>
                  </TouchableWithoutFeedback>
                </Modal>

                  </View>
                </TouchableWithoutFeedback>
              </View>
            </TouchableWithoutFeedback>
          </Modal>

            {/* Modal selector de fecha de nacimiento (estilo Register) */}
            <Modal visible={dobModalOpen} transparent animationType="fade" onRequestClose={()=> setDobModalOpen(false)}>
              <TouchableWithoutFeedback onPress={()=> setDobModalOpen(false)}>
                <View style={styles.modalOverlayCenter}>
                  <TouchableWithoutFeedback>
                    <View style={[styles.modalCard, { backgroundColor:'#fff' }]}>
                      <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center' }}>
                        <Text style={{ fontWeight:'700', fontSize:16 }}>Seleccionar fecha de nacimiento</Text>
                        <TouchableOpacity onPress={()=> setDobModalOpen(false)}><Ionicons name="close" size={22} color="#333"/></TouchableOpacity>
                      </View>
                      <View style={{ marginTop: 10 }}>
                        <View style={styles.stepRow}>
                          <Text style={[styles.step, dobStep==='year' && styles.stepActive]}>Año</Text>
                          <Text style={styles.stepSeparator}>›</Text>
                          <Text style={[styles.step, dobStep==='month' && styles.stepActive]}>Mes</Text>
                          <Text style={styles.stepSeparator}>›</Text>
                          <Text style={[styles.step, dobStep==='day' && styles.stepActive]}>Día</Text>
                        </View>

                        {dobStep === 'year' && (
                          <ScrollView style={{ maxHeight: 260 }} contentContainerStyle={styles.gridWrap}>
                            {Array.from({ length: 120 }).map((_, idx) => {
                              const year = today.getFullYear() - idx;
                              return (
                                <TouchableOpacity key={year} style={[styles.gridItem, tempYear === year && styles.gridItemActive]} onPress={()=> { setTempYear(year); setDobStep('month'); }}>
                                  <Text style={styles.gridText}>{year}</Text>
                                </TouchableOpacity>
                              );
                            })}
                          </ScrollView>
                        )}

                        {dobStep === 'month' && (
                          <View>
                            <ScrollView style={{ maxHeight: 260 }}>
                              <View style={styles.monthsWrap}>
                                {monthsEs.map((m, i) => {
                                  const monthNumber = i + 1;
                                  const disabled = isFutureMonth(tempYear, monthNumber);
                                  return (
                                    <TouchableOpacity key={m} disabled={disabled} style={[styles.monthItem, tempMonth === monthNumber && styles.gridItemActive, disabled && styles.disabledItem]} onPress={()=> { setTempMonth(monthNumber); setDobStep('day'); }}>
                                      <Text style={[styles.gridText, { color: disabled? '#999':'#333' }]}>{m}</Text>
                                    </TouchableOpacity>
                                  );
                                })}
                              </View>
                            </ScrollView>
                            <View style={{ marginTop: 8 }}>
                              <TouchableOpacity onPress={()=> setDobStep('year')}><Text style={styles.linkCta}>Atrás</Text></TouchableOpacity>
                            </View>
                          </View>
                        )}

                        {dobStep === 'day' && tempMonth && (
                          <View>
                            <ScrollView style={{ maxHeight: 260 }}>
                              <View style={styles.daysWrap}>
                                {Array.from({ length: daysInMonth(tempYear, tempMonth) }).map((_, i) => {
                                  const d = i + 1;
                                  const disabled = isFutureDay(tempYear, tempMonth!, d);
                                  return (
                                    <TouchableOpacity key={d} disabled={disabled} style={[styles.dayItem, tempDay === d && styles.gridItemActive, disabled && styles.disabledItem]} onPress={()=> { setTempDay(d); }}>
                                      <Text style={[styles.gridText, { color: disabled? '#999':'#333' }]}>{d.toString().padStart(2,'0')}</Text>
                                    </TouchableOpacity>
                                  );
                                })}
                              </View>
                            </ScrollView>
                            <View style={{ flexDirection:'row', justifyContent:'space-between', marginTop: 8 }}>
                              <TouchableOpacity onPress={()=> setDobStep('month')}><Text style={styles.linkCta}>Atrás</Text></TouchableOpacity>
                              <TouchableOpacity style={[styles.tableFilterButton, { minWidth: 140 }]} onPress={confirmDob} disabled={!(tempYear && tempMonth && tempDay)}>
                                <Text style={{ color:'#fff', fontWeight:'700' }}>Confirmar</Text>
                              </TouchableOpacity>
                            </View>
                          </View>
                        )}
                      </View>
                    </View>
                  </TouchableWithoutFeedback>
                </View>
              </TouchableWithoutFeedback>
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
            <TouchableWithoutFeedback onPress={()=> setEstadoModalOpen(false)}>
              <View style={styles.modalOverlayCenter}>
                <TouchableWithoutFeedback>
                  <View style={[styles.modalCard, { backgroundColor: '#fff' }]}>
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
                </TouchableWithoutFeedback>
              </View>
            </TouchableWithoutFeedback>
          </Modal>
        </View>
      )}

      {section === 'mensajes' && (
        <ScrollView contentContainerStyle={{ padding: 16 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 10 }}>
            <TouchableOpacity onPress={openNewAcceso} style={[styles.tableFilterButton, { backgroundColor: '#6B5B95' }]}>
              <Text style={{ color:'#fff', fontWeight:'700' }}>+ Nuevo Mensaje/Acceso</Text>
            </TouchableOpacity>
          </View>
          {(accesos || []).map((a: any) => (
            <View key={a._id} style={{ backgroundColor: '#fff', borderRadius: 10, padding: 12, marginBottom: 10 }}>
              <Text style={{ fontWeight: '700' }}>{a.nombre}</Text>
              <Text style={{ color: '#666' }}>Código: {a.codigo}</Text>
              {a.scope ? <Text style={{ color: '#666' }}>Scope: {a.scope}</Text> : null}
              <View style={{ flexDirection:'row', gap: 10, marginTop: 8 }}>
                <TouchableOpacity onPress={()=> openEditAcceso(a)}><Ionicons name="create-outline" size={18} color="#666" /></TouchableOpacity>
                <TouchableOpacity onPress={()=> removeAcceso(a)}><Ionicons name="trash-outline" size={18} color="#C44" /></TouchableOpacity>
              </View>
            </View>
          ))}
          {(!accesos || accesos.length === 0) && (
            <Text style={{ color: '#666' }}>Sin mensajes/accesos</Text>
          )}

          {/* Modal acceso */}
          <Modal visible={accesoModalOpen} transparent animationType="fade" onRequestClose={()=> setAccesoModalOpen(false)}>
            <TouchableWithoutFeedback onPress={()=> setAccesoModalOpen(false)}>
              <View style={styles.modalOverlayCenter}>
                <TouchableWithoutFeedback>
                  <View style={[styles.modalCard, { backgroundColor:'#fff' }] }>
                <View style={{ flexDirection: 'row', justifyContent:'space-between', alignItems:'center' }}>
                  <Text style={{ fontWeight:'700', fontSize:16 }}>{accesoEditing? 'Editar Mensaje/Acceso':'Nuevo Mensaje/Acceso'}</Text>
                  <TouchableOpacity onPress={()=> setAccesoModalOpen(false)}><Ionicons name="close" size={22} color="#333"/></TouchableOpacity>
                </View>
                <Text style={styles.formLabel}>Código*</Text>
                <TextInput style={styles.formInput} value={accesoForm.codigo} onChangeText={(t)=> setAccesoForm(s=>({...s,codigo:t}))} />
                <Text style={styles.formLabel}>Nombre*</Text>
                <TextInput style={styles.formInput} value={accesoForm.nombre} onChangeText={(t)=> setAccesoForm(s=>({...s,nombre:t}))} />
                <Text style={styles.formLabel}>Scope</Text>
                <View style={{ flexDirection:'row', flexWrap:'wrap', gap:8, marginTop:6 }}>
                  {(['READ','WRITE','DELETE','ADMIN'] as const).map(sc => (
                    <TouchableOpacity key={sc} onPress={()=> setAccesoForm(s=>({...s, scope: sc}))} style={[styles.roleChip, accesoForm.scope===sc && { backgroundColor:'#6B5B95' }]}><Text style={[styles.roleChipText, accesoForm.scope===sc && { color:'#fff' }]}>{sc}</Text></TouchableOpacity>
                  ))}
                </View>
                <TouchableOpacity style={[styles.tableFilterButton, { marginTop: 14 }]} onPress={saveAcceso}><Text style={{ color:'#fff', fontWeight:'700', textAlign:'center' }}>Guardar</Text></TouchableOpacity>
                  </View>
                </TouchableWithoutFeedback>
              </View>
            </TouchableWithoutFeedback>
          </Modal>
        </ScrollView>
      )}

      {section === 'notificaciones' && (
        <ScrollView contentContainerStyle={{ padding: 16 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 10 }}>
            <TouchableOpacity onPress={openNewNotif} style={[styles.tableFilterButton, { backgroundColor: '#6B5B95' }]}>
              <Text style={{ color:'#fff', fontWeight:'700' }}>+ Nueva Notificación</Text>
            </TouchableOpacity>
          </View>
          {(notificaciones || []).map((n: any) => (
            <View key={n._id} style={{ backgroundColor: '#fff', borderRadius: 10, padding: 12, marginBottom: 10 }}>
              <Text style={{ fontWeight: '700' }}>{n.asunto || n.titulo || 'Notificación'}</Text>
              <Text style={{ color: '#666' }}>Tipo: {n.idTipoNotificacion?.nombre || n.tipo || 'N/A'}</Text>
              {n.destinatario ? <Text style={{ color: '#666' }}>Destinatario: {n.destinatario}</Text> : null}
              <View style={{ flexDirection:'row', gap:10, marginTop: 8 }}>
                <TouchableOpacity onPress={()=> openEditNotif(n)}><Ionicons name="create-outline" size={18} color="#666" /></TouchableOpacity>
                <TouchableOpacity onPress={()=> removeNotif(n)}><Ionicons name="trash-outline" size={18} color="#C44" /></TouchableOpacity>
              </View>
            </View>
          ))}
          {(!notificaciones || notificaciones.length === 0) && (
            <Text style={{ color: '#666' }}>Sin notificaciones</Text>
          )}

          {/* Modal notificación */}
          <Modal visible={notifModalOpen} transparent animationType="fade" onRequestClose={()=> setNotifModalOpen(false)}>
            <TouchableWithoutFeedback onPress={()=> setNotifModalOpen(false)}>
              <View style={styles.modalOverlayCenter}>
                <TouchableWithoutFeedback>
                  <View style={[styles.modalCard, { backgroundColor:'#fff' }] }>
                <View style={{ flexDirection: 'row', justifyContent:'space-between', alignItems:'center' }}>
                  <Text style={{ fontWeight:'700', fontSize:16 }}>{notifEditing? 'Editar Notificación':'Nueva Notificación'}</Text>
                  <TouchableOpacity onPress={()=> setNotifModalOpen(false)}><Ionicons name="close" size={22} color="#333"/></TouchableOpacity>
                </View>
                <Text style={styles.formLabel}>Título</Text>
                <TextInput style={styles.formInput} value={notifForm.titulo} onChangeText={(t)=> setNotifForm(s=>({...s,titulo:t}))} />
                <Text style={styles.formLabel}>Asunto</Text>
                <TextInput style={styles.formInput} value={notifForm.asunto} onChangeText={(t)=> setNotifForm(s=>({...s,asunto:t}))} />
                <Text style={styles.formLabel}>Contenido</Text>
                <TextInput style={[styles.formInput, { height: 90 }]} multiline value={notifForm.contenido} onChangeText={(t)=> setNotifForm(s=>({...s,contenido:t}))} />
                <Text style={styles.formLabel}>Tipo</Text>
                <TextInput style={styles.formInput} value={notifForm.tipo} onChangeText={(t)=> setNotifForm(s=>({...s,tipo:t}))} />
                <Text style={styles.formLabel}>Destinatario (id)</Text>
                <TextInput style={styles.formInput} value={notifForm.destinatario} onChangeText={(t)=> setNotifForm(s=>({...s,destinatario:t}))} />
                <TouchableOpacity style={[styles.tableFilterButton, { marginTop: 14 }]} onPress={saveNotif}><Text style={{ color:'#fff', fontWeight:'700', textAlign:'center' }}>Guardar</Text></TouchableOpacity>
                  </View>
                </TouchableWithoutFeedback>
              </View>
            </TouchableWithoutFeedback>
          </Modal>
        </ScrollView>
      )}

      {section === 'registros' && (
        <View style={{ padding: 16, flex: 1 }}>
          <View style={[styles.filtersBar, { paddingVertical: 0 }]}>
            <View style={styles.filterItem}>
              <Text style={styles.smallLabel}>idUsuario</Text>
              <TextInput style={styles.tableFilterInput} placeholder="ID de usuario" value={diarioFilters.idUsuario} onChangeText={(t)=> setDiarioFilters(s=>({...s,idUsuario:t}))} />
            </View>
            <View style={styles.filterItem}>
              <Text style={styles.smallLabel}>Fecha Inicio (YYYY-MM-DD)</Text>
              <TextInput style={styles.tableFilterInput} placeholder="2025-01-01" value={diarioFilters.fechaInicio} onChangeText={(t)=> setDiarioFilters(s=>({...s,fechaInicio:t}))} />
            </View>
            <View style={styles.filterItem}>
              <Text style={styles.smallLabel}>Fecha Fin (YYYY-MM-DD)</Text>
              <TextInput style={styles.tableFilterInput} placeholder="2025-12-31" value={diarioFilters.fechaFin} onChangeText={(t)=> setDiarioFilters(s=>({...s,fechaFin:t}))} />
            </View>
            <View style={styles.filterActions}>
              <TouchableOpacity style={styles.tableFilterButton} onPress={loadDiarios}><Text style={{ color:'#fff', fontWeight:'700' }}>Filtrar</Text></TouchableOpacity>
            </View>
          </View>
          <ScrollView style={styles.tableWrapper} contentContainerStyle={styles.tableContent}>
            <View style={styles.tableHeaderRow}>
              {['Fecha','Usuario','Título','Calificación'].map(h => (<View key={h} style={styles.th}><Text style={styles.thText}>{h}</Text></View>))}
            </View>
            {(diarios||[]).map((d:any) => (
              <View key={d._id} style={styles.tableRow}>
                <View style={styles.td}><Text style={styles.tdText}>{new Date(d.fecha || d.diario?.fecha || d.createdAt).toISOString().slice(0,10)}</Text></View>
                <View style={styles.td}><Text style={styles.tdText}>{d.idUsuario || d.diario?.idUsuario || '—'}</Text></View>
                <View style={[styles.td, { flex: 2 }]}><Text style={styles.tdText} numberOfLines={2}>{d.titulo || d.diario?.titulo}</Text></View>
                <View style={styles.td}><Text style={styles.tdText}>{d.calificacion || d.diario?.calificacion}</Text></View>
              </View>
            ))}
            {(!diarios || diarios.length===0) && (
              <Text style={{ color:'#666' }}>Sin registros</Text>
            )}
          </ScrollView>
        </View>
      )}

      {section === 'personas' && (
        <View style={{ padding: 16, flex: 1 }}>
          <View style={[styles.filtersBar, { paddingVertical: 0 }]}>
            <View style={[styles.filterItem, { minWidth: 220 }] }>
              <Text style={styles.smallLabel}>Buscar</Text>
              <TextInput style={styles.tableFilterInput} placeholder="Nombre, documento, email" value={qPersona} onChangeText={setQPersona} />
            </View>
            <View style={styles.filterActions}>
              <TouchableOpacity style={styles.tableFilterButton} onPress={loadPersonas}><Text style={{ color:'#fff', fontWeight:'700' }}>Filtrar</Text></TouchableOpacity>
            </View>
          </View>
          <ScrollView style={styles.tableWrapper} contentContainerStyle={styles.tableContent}>
            <View style={styles.tableHeaderRow}>
              {['Nombres','Apellidos','Tipo Doc','Documento','Fecha Nac.'].map(h => (<View key={h} style={styles.th}><Text style={styles.thText}>{h}</Text></View>))}
            </View>
            {(personas||[]).map((p:any) => (
              <View key={p._id} style={styles.tableRow}>
                <View style={styles.td}><Text style={styles.tdText}>{p.nombres}</Text></View>
                <View style={styles.td}><Text style={styles.tdText}>{p.apellidos}</Text></View>
                <View style={styles.td}><Text style={styles.tdText}>{p.tipoDoc}</Text></View>
                <View style={styles.td}><Text style={styles.tdText}>{p.numDoc}</Text></View>
                <View style={styles.td}><Text style={styles.tdText}>{p.fechaNacimiento ? new Date(p.fechaNacimiento).toISOString().slice(0,10) : '—'}</Text></View>
              </View>
            ))}
            {(!personas || personas.length===0) && (
              <Text style={{ color:'#666' }}>Sin personas</Text>
            )}
          </ScrollView>
        </View>
      )}

      {section === 'menu' && (
        <View style={{ padding: 16, flex: 1 }}>
          <View style={[styles.filtersBar, { paddingVertical: 0, alignItems: 'center' }]}>
            <Text style={[styles.smallLabel, { marginRight: 8 }]}>Listando Menús (todos):</Text>
            <TouchableOpacity
              style={[styles.tableFilterButton, { backgroundColor: '#6B5B95' }]}
              onPress={async ()=>{ setMenusLoading(true); try { const mm:any = await listMenus(); setMenus(mm?.data || []); } finally { setMenusLoading(false); } }}
            >
              <Text style={{ color:'#fff', fontWeight:'700' }}>{menusLoading? 'Actualizando...' : 'Actualizar'}</Text>
            </TouchableOpacity>
            <View style={{ flexDirection:'row', gap: 8, marginLeft: 8 }}>
              <TouchableOpacity
                style={[styles.filterChip, menusRootOnly && styles.filterChipActive]}
                onPress={()=> setMenusRootOnly(true)}
              >
                <Text style={[styles.filterChipText, menusRootOnly && styles.filterChipTextActive]}>Solo raíz</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterChip, !menusRootOnly && styles.filterChipActive]}
                onPress={()=> setMenusRootOnly(false)}
              >
                <Text style={[styles.filterChipText, !menusRootOnly && styles.filterChipTextActive]}>Todos</Text>
              </TouchableOpacity>
            </View>
          </View>
          <ScrollView style={styles.tableWrapper} contentContainerStyle={styles.tableContent}>
            <View style={styles.tableHeaderRow}>
              {['Nombre','Ruta','Orden','Padre','Activo','Acciones'].map(h => (<View key={h} style={styles.th}><Text style={styles.thText}>{h}</Text></View>))}
            </View>
            {((menus||[])
              .filter((m:any)=> menusRootOnly ? !m.menuSuperior : true)
              .sort((a:any,b:any)=> (a.orden||0)-(b.orden||0))
            ).map((m:any)=> (
              <View key={m._id} style={styles.tableRow}>
                <View style={styles.td}><Text style={styles.tdText}>{m.nombre}</Text></View>
                <View style={styles.td}><Text style={styles.tdText}>{m.ruta || '—'}</Text></View>
                <View style={styles.td}><Text style={styles.tdText}>{m.orden ?? 0}</Text></View>
                <View style={styles.td}><Text style={styles.tdText}>{m.menuSuperior?.nombre || m.menuSuperior || '—'}</Text></View>
                <View style={[styles.td, { flexDirection:'row', alignItems:'center', gap:8 }]}>
                  <TouchableOpacity
                    onPress={async ()=>{
                      try {
                        await updateMenu(m._id, { activo: !(m.activo===true) });
                        const mm:any = await listMenus();
                        setMenus(mm?.data || []);
                        setToast({ type:'success', message: `Menú ${!(m.activo===true) ? 'activado' : 'inactivado'}` });
                      } catch(e:any) {
                        setToast({ type:'error', message: e?.payload?.message || e?.message || 'No se pudo actualizar el menú' });
                      }
                    }}
                    style={[styles.filterChip, (m.activo===true) && styles.filterChipActive]}
                  >
                    <Text style={[styles.filterChipText, (m.activo===true) && styles.filterChipTextActive]}>
                      {m.activo===true ? 'Activo' : 'Inactivo'}
                    </Text>
                  </TouchableOpacity>
                  {(!m.menuSuperior && m.activo===true) && (
                    <Text style={{ color:'#27ae60', fontWeight:'600' }}>Visible en MainMenu</Text>
                  )}
                  {(!m.menuSuperior && m.activo!==true) && (
                    <Text style={{ color:'#999' }}>No visible (inactivo)</Text>
                  )}
                </View>
                <View style={[styles.td, { flexDirection:'row', gap: 12 }] }>
                  {/* Solo toggle activo/inactivo solicitado */}
                </View>
              </View>
            ))}
            {(!menus || menus.length===0) && (
              <Text style={{ color:'#666' }}>No hay menús. Activa menús raíz para que aparezcan en el MainMenu.</Text>
            )}
          </ScrollView>
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
    elevation: 5,
    zIndex: 1200
  },
  headerLeftArea: { flexDirection: 'row', alignItems: 'center' },
  headerRightArea: { position: 'absolute', right: 12, top: 24, alignItems: 'flex-end', zIndex: 1500 },
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
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#e6e8eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1
  },
  searchBarFocused: {
    borderColor: '#6B5B95',
    shadowOpacity: 0.08,
    elevation: 2,
  },
  searchBarWide: { maxWidth: 900, alignSelf: 'center' },
  userActionsRow: { marginTop: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start', flexWrap: 'wrap', gap: 8 },
  userActionsRowWide: { maxWidth: 900, alignSelf: 'center' },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: '#374151',
    // Quitar outline azul en web
    outlineStyle: 'none' as any
  },
  searchClearButton: {
    padding: 6,
    marginRight: 4,
    borderRadius: 12,
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
    justifyContent: 'flex-end',
    // Evitar cursor de "mano" molesto en web
    cursor: 'default' as any
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    cursor: 'default' as any
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
  userBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16 },
  userBadgeText: { color: '#fff', fontWeight: '600' },
  dropdownMenu: { position: 'absolute', top: 36, right: 0, backgroundColor: '#fff', paddingVertical: 6, borderRadius: 10, minWidth: 220, shadowColor: '#000', shadowOffset: { width:0, height:2 }, shadowOpacity: 0.15, shadowRadius: 4, elevation: 6, zIndex: 2000, borderWidth: 1, borderColor: '#eef0f2', maxHeight: 360 },
  dropdownMenuMobile: { right: -8, minWidth: 240, maxWidth: 300 },
  dropdownItem: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 10 },
  dropdownItemText: { color: '#333', fontWeight: '600' },
  menuBackdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'transparent', zIndex: 1100 },
  optionRow: { flexDirection:'row', alignItems:'center', gap:8, paddingVertical:12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  optionRowText: { color:'#333', fontWeight:'600' },
  // NUEVO: estilos para tabla de estados
  smallLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4
  },
  // Picker de fecha personalizado (estilo register, adaptado a admin)
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  step: {
    color: '#333',
    fontWeight: '600',
  },
  stepActive: {
    textDecorationLine: 'underline',
  },
  stepSeparator: {
    color: '#666',
    marginHorizontal: 8,
  },
  gridWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  gridItem: {
    minWidth: 70,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
    margin: 4,
    alignItems: 'center',
  },
  gridItemActive: {
    backgroundColor: '#e8e8ff'
  },
  gridText: {
    color: '#333',
    fontWeight: '600'
  },
  monthsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  monthItem: {
    width: '48%',
    paddingVertical: 12,
    marginVertical: 6,
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
  },
  daysWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dayItem: {
    width: '18%',
    paddingVertical: 10,
    marginVertical: 4,
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
  },
  disabledItem: {
    opacity: 0.45,
  },
  linkCta: {
    color: '#6B5B95',
    textDecorationLine: 'underline',
    fontWeight: '700',
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
    alignItems: 'center',
    cursor: 'default' as any
  },
  modalCard: {
    width: '90%',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
    cursor: 'default' as any
  },
  stepperRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 12 },
  stepDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#ddd' },
  stepDotActive: { backgroundColor: '#6B5B95' },
  stepLine: { width: 40, height: 2, backgroundColor: '#ddd' },
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
  secondaryButton: { backgroundColor: '#f2f2f2', borderRadius: 10, paddingVertical: 10, alignItems: 'center', justifyContent: 'center' },
  secondaryButtonText: { color: '#333', fontWeight: '700' },
  toast: { position: 'absolute', top: 8, left: 12, right: 12, zIndex: 1000, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  toastText: { color: '#fff', fontWeight: '700' },
  toastSuccess: { backgroundColor: '#40C9A2' },
  toastError: { backgroundColor: '#d9534f' },
});

// Utilidad: medidor sencillo de fuerza de contraseña
function passwordStrength(pw: string) {
  if (!pw) return { label: '', color: '#999' };
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[a-z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 2) return { label: 'Débil', color: '#e67e22' };
  if (score === 3) return { label: 'Media', color: '#f1c40f' };
  if (score >= 4) return { label: 'Fuerte', color: '#27ae60' };
  return { label: '', color: '#999' };
}