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

      // Compatibilidad con almacenamiento previo no ofuscado
      if (!url) url = localStorage.getItem('sigo_supabase_url');
      if (!key) key = localStorage.getItem('sigo_supabase_key');
    }

    if (url && key && window.supabase) {
      // Re-verificar seguridad antes de instanciar
      const check = this.validateKeySafety(key);
      if (!check.valid) {
        console.error("SupabaseManager:", check.error);
        this.isConfigured = false;
        return;
      }

      try {
        this.client = window.supabase.createClient(url, key);
        this.isConfigured = true;
        console.log("Supabase inicializado correctamente con clave pública 'anon'.");
      } catch (err) {
        console.error("Error al inicializar cliente Supabase:", err);
        this.isConfigured = false;
      }
    } else {
      this.isConfigured = false;
    }
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

  async upsertObraInCloud(obra) {
    if (!this.isConfigured) return null;
    try {
      const payload = {
        codigo_interno: obra.id,
        tipo: obra.tipo === 'Infraestructura' ? 'infraestructura' : 'obra_civil',
        partida: obra.partida,
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
        proveedor: obra.proveedor,
        responsable: obra.responsable,
        clasificacion: obra.clasificacion,
        categoria: obra.categoria,
        motivo: obra.motivo,
        observaciones: obra.observaciones,
        fecha_inicio_etapa: obra.fecha_inicio_etapa || null,
        fecha_fin_etapa: obra.fecha_fin_etapa || null,
        fecha_fin_obra: obra.fecha_fin_obra || null,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await this.client
        .from('proyectos_obras')
        .upsert(payload, { onConflict: 'codigo_interno' })
        .select();

      if (error) throw error;
      return data;
    } catch (e) {
      console.error("Error upserting in Supabase:", e);
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
