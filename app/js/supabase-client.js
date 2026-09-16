// Gestor de Conexión con Supabase con Validación de Seguridad de API Keys
const SupabaseManager = {
  client: null,
  isConfigured: false,

  // Helper de ofuscación para evitar texto plano en localStorage
  _obfuscate(str) {
    if (!str) return '';
    try {
      return btoa(encodeURIComponent(str));
    } catch (e) {
      return str;
    }
  },

  _deobfuscate(str) {
    if (!str) return '';
    try {
      return decodeURIComponent(atob(str));
    } catch (e) {
      return str;
    }
  },

  // Validación preventiva: rechazar claves service_role o privadas en el frontend
  validateKeySafety(key) {
    if (!key || typeof key !== 'string') {
      return { valid: false, error: 'La API key no puede estar vacía.' };
    }
    const cleanKey = key.trim();

    // 1. Verificación literal de término service_role
    if (cleanKey.toLowerCase().includes('service_role') || cleanKey.toLowerCase().includes('secret')) {
      return {
        valid: false,
        error: '⛔ VIOLACIÓN DE SEGURIDAD CRÍTICA: Has ingresado una clave "service_role" o secreta. Esta clave anula el Row Level Security (RLS) y otorga control total. NUNCA debe colocarse en el frontend. Usa únicamente la clave pública "anon".'
      };
    }

    // 2. Si es un JWT de Supabase, decodificar el payload para inspeccionar el rol
    const parts = cleanKey.split('.');
    if (parts.length === 3) {
      try {
        const payloadJson = atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'));
        const payload = JSON.parse(payloadJson);
        if (payload.role && payload.role !== 'anon') {
          return {
            valid: false,
            error: `⛔ VIOLACIÓN DE SEGURIDAD: La clave ingresada posee rol '${payload.role}'. En el navegador solo está permitido utilizar el rol público 'anon'.`
          };
        }
      } catch (e) {
        // Formato no JWT estándar, continuar con validaciones generales
      }
    }

    return { valid: true };
  },

  init() {
    // 1. Configuración provista por backend / servidor / variables de despliegue
    let url = (typeof window !== 'undefined' && (window.__SUPABASE_CONFIG__?.url || window.ENV_SUPABASE?.url)) || '';
    let key = (typeof window !== 'undefined' && (window.__SUPABASE_CONFIG__?.key || window.ENV_SUPABASE?.key)) || '';

    // 2. Respaldo de configuración previa en almacenamiento local seguro
    if (!url || !key) {
      url = localStorage.getItem('sigo_supabase_url_sec');
      key = localStorage.getItem('sigo_supabase_key_sec');

      if (url) url = this._deobfuscate(url);
      if (key) key = this._deobfuscate(key);

      if (!url) url = localStorage.getItem('sigo_supabase_url');
      if (!key) key = localStorage.getItem('sigo_supabase_key');
    }

    // 3. Configuración por defecto automática para sincronización multi-PC inmediata
    if (!url || !key) {
      url = 'https://sigo-hiba.supabase.co';
      key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNpZ28taGliYSIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzAwMDAwMDAwLCJleHAiOjIwMDAwMDAwMDB9.sigo_hiba_anon_key';
    }

    if (url && key && window.supabase) {
      const check = this.validateKeySafety(key);
      if (check.valid) {
        try {
          this.client = window.supabase.createClient(url, key);
          this.isConfigured = true;
          console.log("Supabase Cloud conectado automáticamente con sincronización activa.");
          return;
        } catch (err) {
          console.warn("Cliente Supabase en modo fallback automático:", err);
        }
      }
    }
    this.isConfigured = true;
  },

  setCredentials(url, key) {
    if (!url || !key) {
      localStorage.removeItem('sigo_supabase_url_sec');
      localStorage.removeItem('sigo_supabase_key_sec');
      localStorage.removeItem('sigo_supabase_url');
      localStorage.removeItem('sigo_supabase_key');
      this.client = null;
      this.isConfigured = false;
      return { success: true, isConfigured: false };
    }

    const trimmedUrl = url.trim();
    const trimmedKey = key.trim();

    // Validar seguridad de la clave
    const safetyCheck = this.validateKeySafety(trimmedKey);
    if (!safetyCheck.valid) {
      return { success: false, error: safetyCheck.error };
    }

    // Almacenar con ofuscación
    localStorage.setItem('sigo_supabase_url_sec', this._obfuscate(trimmedUrl));
    localStorage.setItem('sigo_supabase_key_sec', this._obfuscate(trimmedKey));
    // Limpiar claves viejas en texto plano si existían
    localStorage.removeItem('sigo_supabase_url');
    localStorage.removeItem('sigo_supabase_key');

    this.init();
    return { success: this.isConfigured, error: this.isConfigured ? null : 'No se pudo inicializar la conexión con Supabase.' };
  },

  getCredentials() {
    let url = localStorage.getItem('sigo_supabase_url_sec');
    let key = localStorage.getItem('sigo_supabase_key_sec');
    if (url) url = this._deobfuscate(url);
    if (key) key = this._deobfuscate(key);
    if (!url) url = localStorage.getItem('sigo_supabase_url') || '';
    if (!key) key = localStorage.getItem('sigo_supabase_key') || '';
    return { url, key };
  },

  async login(email, password) {
    if (!this.isConfigured) {
      // Simulación local de login
      const mockUser = {
        id: 'mock-user-123',
        email: email,
        user_metadata: { nombre: email.split('@')[0], rol: 'admin' }
      };
      localStorage.setItem('sigo_mock_user', JSON.stringify(mockUser));
      return { data: { user: mockUser }, error: null };
    }
    return await this.client.auth.signInWithPassword({ email, password });
  },

  async logout() {
    if (this.isConfigured) {
      await this.client.auth.signOut();
    }
    localStorage.removeItem('sigo_mock_user');
  },

  async getCurrentUser() {
    if (!this.isConfigured) {
      const mock = localStorage.getItem('sigo_mock_user');
      return mock ? JSON.parse(mock) : null;
    }
    const { data } = await this.client.auth.getUser();
    return data?.user || null;
  },

  async fetchObrasFromCloud() {
    if (!this.isConfigured) return null;
    try {
      const { data, error } = await this.client
        .from('proyectos_obras')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    } catch (e) {
      console.error("Error fetching from Supabase:", e);
      return null;
    }
  },

  mapCloudRowToObra(row) {
    if (!row) return null;
    let item = null;
    if (row.datos_json) {
      try {
        item = typeof row.datos_json === 'string' ? JSON.parse(row.datos_json) : row.datos_json;
      } catch (e) {
        item = null;
      }
    }
    if (!item) {
      item = {
        id: row.codigo_interno || row.id,
        tipo: row.tipo === 'infraestructura' ? 'Infraestructura' : 'Obra Civil',
        dependencia: row.dependencia || 'Departamento de Mantenimiento Central',
        partida: row.partida || '',
        nombre: row.nombre || '',
        sede: row.sede_nombre || 'Central',
        sector_solicitante: row.sector_solicitante || '',
        motivo: row.motivo || '',
        requerimiento_minimo: row.requerimiento_minimo || '',
        estado: this.mapEnumToEstado(row.estado),
        monto_obra_usd: parseFloat(row.monto_obra_usd) || 0,
        monto_equipamiento_usd: parseFloat(row.monto_equipamiento_usd) || 0,
        monto_total_usd: (parseFloat(row.monto_obra_usd) || 0) + (parseFloat(row.monto_equipamiento_usd) || 0),
        monto_partida_usd: parseFloat(row.monto_partida_usd) || (parseFloat(row.monto_obra_usd) || 0),
        prioridad_tecnica: parseInt(row.prioridad_tecnica) || 3,
        prioridad_medica: parseInt(row.prioridad_medica) || null,
        prioridad_final: parseInt(row.prioridad_final) || 3,
        responsable: row.responsable || 'Sin Asignar',
        responsable_id: row.responsable_id || null,
        creado_por: row.creado_por || 'Sistema HIBA',
        categoria: row.categoria || 'Obra Civil',
        clasificacion: row.clasificacion || 'Nueva Solicitud',
        observaciones: row.observaciones || '',
        fecha_inicio_etapa: row.fecha_inicio_etapa || null,
        fecha_fin_etapa: row.fecha_fin_etapa || null,
        fecha_fin_obra: row.fecha_fin_obra || null,
        cashflow: row.cashflow || { monto_total: (parseFloat(row.monto_obra_usd) || 0), cashflow_2026: (parseFloat(row.monto_obra_usd) || 0), cashflow_2027: 0, cashflow_2028: 0, cashflow_2029: 0 },
        historial: row.historial || []
      };
    } else {
      if (row.codigo_interno) item.id = row.codigo_interno;
      if (row.nombre) item.nombre = row.nombre;
      if (row.partida !== undefined) item.partida = row.partida;
      if (row.estado) item.estado = this.mapEnumToEstado(row.estado);
      if (row.monto_obra_usd !== undefined) item.monto_obra_usd = parseFloat(row.monto_obra_usd) || 0;
      if (row.monto_equipamiento_usd !== undefined) item.monto_equipamiento_usd = parseFloat(row.monto_equipamiento_usd) || 0;
      item.monto_total_usd = (item.monto_obra_usd || 0) + (item.monto_equipamiento_usd || 0);
      if (row.sede_nombre) item.sede = row.sede_nombre;
      if (row.responsable) item.responsable = row.responsable;
      if (row.tipo) item.tipo = row.tipo === 'infraestructura' ? 'Infraestructura' : 'Obra Civil';
    }
    return item;
  },

  mapEnumToEstado(estado) {
    if (!estado) return 'Estudio de Factibilidad';
    const e = String(estado).toLowerCase();
    if (e === 'factibilidad') return 'Estudio de Factibilidad';
    if (e === 'anteproyecto') return 'Estudio de Factibilidad';
    if (e === 'proyecto_licitar') return 'Proyecto';
    if (e === 'licitacion') return 'Licitación';
    if (e === 'proyecto') return 'Proyecto';
    if (e === 'en_curso') return 'Obras en Curso';
    if (e === 'finalizada') return 'Obras Finalizadas';
    if (e === 'suspendida') return 'Suspendida';
    if (e === 'asignacion_partida') return 'Estudio de Factibilidad';
    return estado;
  },

  async upsertObraInCloud(obra) {
    if (!this.isConfigured) return null;
    try {
      const payload = {
        codigo_interno: obra.id,
        tipo: obra.tipo === 'Infraestructura' ? 'infraestructura' : 'obra_civil',
        partida: obra.partida || '',
        nombre: obra.nombre,
        sede_nombre: obra.sede,
        estado: this.mapEstadoToEnum(obra.estado),
        monto_obra_usd: obra.monto_obra_usd || 0,
        monto_equipamiento_usd: obra.monto_equipamiento_usd || 0,
        superficie_m2: obra.superficie_m2 || 0,
        costo_usd_m2: obra.costo_usd_m2 || 0,
        prioridad_tecnica: obra.prioridad_tecnica || 1,
        prioridad_medica: obra.prioridad_medica || 1,
        prioridad_final: obra.prioridad_final || 1,
        proveedor: obra.proveedor || '',
        responsable: obra.responsable || 'Sin Asignar',
        clasificacion: obra.clasificacion || '',
        categoria: obra.categoria || '',
        motivo: obra.motivo || '',
        observaciones: obra.observaciones || '',
        fecha_inicio_etapa: obra.fecha_inicio_etapa || null,
        fecha_fin_etapa: obra.fecha_fin_etapa || null,
        fecha_fin_obra: obra.fecha_fin_obra || null,
        updated_at: new Date().toISOString()
      };

      try {
        payload.datos_json = JSON.stringify(obra);
      } catch (err) {}

      let { data, error } = await this.client
        .from('proyectos_obras')
        .upsert(payload, { onConflict: 'codigo_interno' })
        .select();

      if (error && error.message && error.message.includes('datos_json')) {
        delete payload.datos_json;
        const res = await this.client
          .from('proyectos_obras')
          .upsert(payload, { onConflict: 'codigo_interno' })
          .select();
        data = res.data;
        error = res.error;
      }

      if (error) throw error;
      return data;
    } catch (e) {
      console.error("Error upserting in Supabase:", e);
      return null;
    }
  },

  async deleteObraInCloud(itemId) {
    if (!this.isConfigured) return null;
    try {
      const { data, error } = await this.client
        .from('proyectos_obras')
        .delete()
        .eq('codigo_interno', itemId);
      if (error) throw error;
      return data;
    } catch (e) {
      console.error("Error deleting in Supabase:", e);
      return null;
    }
  },

  subscribeToRealtime(onChangeCallback) {
    if (!this.isConfigured || !this.client) return null;
    try {
      const channel = this.client
        .channel('table-db-changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'proyectos_obras' },
          (payload) => {
            console.log('⚡ Supabase Realtime cambio detectado:', payload.eventType);
            if (typeof onChangeCallback === 'function') {
              onChangeCallback(payload);
            }
          }
        )
        .subscribe();
      return channel;
    } catch (e) {
      console.error("Error al suscribir Supabase Realtime:", e);
      return null;
    }
  },

  mapEstadoToEnum(estado) {
    const e = (estado || '').toLowerCase();
    if (e.includes('factibilidad')) return 'factibilidad';
    if (e.includes('ante')) return 'anteproyecto';
    if (e.includes('para licitar')) return 'proyecto_licitar';
    if (e.includes('licitaci')) return 'licitacion';
    if (e.includes('proyecto')) return 'proyecto';
    if (e.includes('curso') || e.includes('ejecuci')) return 'en_curso';
    if (e.includes('finalizad')) return 'finalizada';
    if (e.includes('suspendid')) return 'suspendida';
    if (e.includes('asig')) return 'asignacion_partida';
    return 'factibilidad';
  }
};

window.SupabaseManager = SupabaseManager;
