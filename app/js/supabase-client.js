// Gestor de Conexión con Supabase
const SupabaseManager = {
  client: null,
  isConfigured: false,

  init() {
    const url = localStorage.getItem('sigo_supabase_url');
    const key = localStorage.getItem('sigo_supabase_key');

    if (url && key && window.supabase) {
      try {
        this.client = window.supabase.createClient(url, key);
        this.isConfigured = true;
        console.log("Supabase inicializado correctamente.");
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
      localStorage.removeItem('sigo_supabase_url');
      localStorage.removeItem('sigo_supabase_key');
      this.client = null;
      this.isConfigured = false;
      return false;
    }
    localStorage.setItem('sigo_supabase_url', url.trim());
    localStorage.setItem('sigo_supabase_key', key.trim());
    this.init();
    return this.isConfigured;
  },

  getCredentials() {
    return {
      url: localStorage.getItem('sigo_supabase_url') || '',
      key: localStorage.getItem('sigo_supabase_key') || ''
    };
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
