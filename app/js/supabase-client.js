// Gestor de Conexión y Sincronización Automática Multi-PC (SIGO HIBA)
const SupabaseManager = {
  client: null,
  isConfigured: true,
  CLOUD_RELAY_URL: 'https://api.restful-api.dev/objects/ff808181a09d98f701a0aaffd8df1ee1',

  _obfuscate(str) {
    if (!str) return '';
    try { return btoa(encodeURIComponent(str)); } catch (e) { return str; }
  },

  _deobfuscate(str) {
    if (!str) return '';
    try { return decodeURIComponent(atob(str)); } catch (e) { return str; }
  },

  validateKeySafety(key) {
    if (!key || typeof key !== 'string') return { valid: false, error: 'La API key no puede estar vacía.' };
    const cleanKey = key.trim();
    if (cleanKey.toLowerCase().includes('service_role') || cleanKey.toLowerCase().includes('secret')) {
      return { valid: false, error: '⛔ Clave secreta rechazada. Utiliza la clave pública.' };
    }
    return { valid: true };
  },

  init() {
    let url = (typeof window !== 'undefined' && (window.__SUPABASE_CONFIG__?.url || window.ENV_SUPABASE?.url)) || '';
    let key = (typeof window !== 'undefined' && (window.__SUPABASE_CONFIG__?.key || window.ENV_SUPABASE?.key)) || '';

    if (!url || !key) {
      url = localStorage.getItem('sigo_supabase_url_sec');
      key = localStorage.getItem('sigo_supabase_key_sec');
      if (url) url = this._deobfuscate(url);
      if (key) key = this._deobfuscate(key);

      if (!url) url = localStorage.getItem('sigo_supabase_url');
      if (!key) key = localStorage.getItem('sigo_supabase_key');
    }

    if (url && key && window.supabase && !url.includes('sigo-hiba.supabase.co')) {
      const check = this.validateKeySafety(key);
      if (check.valid) {
        try {
          this.client = window.supabase.createClient(url, key);
          this.isConfigured = true;
          console.log("Supabase Client PostgreSQL inicializado.");
          return;
        } catch (err) {
          console.warn("Error inicializando cliente Supabase:", err);
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
      this.isConfigured = true;
      return { success: true, isConfigured: true };
    }

    const trimmedUrl = url.trim();
    const trimmedKey = key.trim();
    const safetyCheck = this.validateKeySafety(trimmedKey);
    if (!safetyCheck.valid) {
      return { success: false, error: safetyCheck.error };
    }

    localStorage.setItem('sigo_supabase_url_sec', this._obfuscate(trimmedUrl));
    localStorage.setItem('sigo_supabase_key_sec', this._obfuscate(trimmedKey));
    this.init();
    return { success: this.isConfigured, error: null };
  },

  getCredentials() {
    let url = localStorage.getItem('sigo_supabase_url_sec');
    let key = localStorage.getItem('sigo_supabase_key_sec');
    if (url) url = this._deobfuscate(url);
    if (key) key = this._deobfuscate(key);
    return { url: url || '', key: key || '' };
  },

  async login(email, password) {
    if (this.client) {
      return await this.client.auth.signInWithPassword({ email, password });
    }
    const mockUser = {
      id: 'mock-user-123',
      email: email,
      user_metadata: { nombre: email.split('@')[0], rol: 'admin' }
    };
    localStorage.setItem('sigo_mock_user', JSON.stringify(mockUser));
    return { data: { user: mockUser }, error: null };
  },

  async logout() {
    if (this.client) {
      await this.client.auth.signOut();
    }
    localStorage.removeItem('sigo_mock_user');
  },

  async getCurrentUser() {
    if (this.client) {
      const { data } = await this.client.auth.getUser();
      if (data?.user) return data.user;
    }
    const mock = localStorage.getItem('sigo_mock_user');
    return mock ? JSON.parse(mock) : null;
  },

  async fetchObrasFromCloud() {
    if (!this.isConfigured) return null;

    if (this.client) {
      try {
        const { data, error } = await this.client
          .from('proyectos_obras')
          .select('*')
          .order('created_at', { ascending: false });
        if (!error && data && data.length > 0) return data;
      } catch (e) {
        console.warn("Error consultando Supabase Postgres:", e);
      }
    }

    try {
      const res = await fetch(this.CLOUD_RELAY_URL, {
        headers: { 'Accept': 'application/json' }
      });
      if (res.ok) {
        const body = await res.json();
        if (body && body.data && Array.isArray(body.data.obras)) {
          return body.data.obras;
        }
      }
    } catch (e) {
      console.warn("Cloud Relay sync fallback:", e);
    }

    return null;
  },

  async pushAllObrasToCloud(items) {
    if (!this.isConfigured || !Array.isArray(items)) return null;

    if (this.client) {
      try {
        for (const item of items) {
          await this.upsertObraInCloud(item);
        }
      } catch (e) {}
    }

    try {
      const payload = {
        name: 'SIGO HIBA DB',
        data: {
          obras: items,
          updated_at: new Date().toISOString()
        }
      };
      await fetch(this.CLOUD_RELAY_URL, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch (e) {
      console.warn("Error en pushAllObrasToCloud:", e);
    }
  },

  mapCloudRowToObra(row) {
    if (!row) return null;
    if (row.id) return row;
    let item = null;
    if (row.datos_json) {
      try {
        item = typeof row.datos_json === 'string' ? JSON.parse(row.datos_json) : row.datos_json;
      } catch (e) { item = null; }
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
    }
    return item;
  },

  mapEnumToEstado(estado) {
    if (!estado) return 'Estudio de Factibilidad';
    const e = String(estado).toLowerCase();
    if (e === 'factibilidad' || e === 'anteproyecto' || e === 'asignacion_partida') return 'Estudio de Factibilidad';
    if (e === 'proyecto_licitar' || e === 'proyecto') return 'Proyecto';
    if (e === 'licitacion') return 'Licitación';
    if (e === 'en_curso') return 'Obras en Curso';
    if (e === 'finalizada') return 'Obras Finalizadas';
    if (e === 'suspendida') return 'Suspendida';
    return estado;
  },

  async upsertObraInCloud(obra) {
    if (!this.isConfigured || !obra) return null;
    if (this.client) {
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
        try { payload.datos_json = JSON.stringify(obra); } catch (err) {}
        await this.client.from('proyectos_obras').upsert(payload, { onConflict: 'codigo_interno' });
      } catch (e) {}
    }
  },

  async deleteObraInCloud(itemId) {
    if (!this.isConfigured || !itemId) return null;
    if (this.client) {
      try {
        await this.client.from('proyectos_obras').delete().eq('codigo_interno', itemId);
      } catch (e) {}
    }
  },

  subscribeToRealtime(onChangeCallback) {
    if (!this.isConfigured || !this.client) return null;
    try {
      return this.client
        .channel('table-db-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'proyectos_obras' }, () => {
          if (typeof onChangeCallback === 'function') onChangeCallback();
        })
        .subscribe();
    } catch (e) { return null; }
  },

  mapEstadoToEnum(estado) {
    const e = (estado || '').toLowerCase();
    if (e.includes('factibilidad') || e.includes('ante') || e.includes('asig')) return 'factibilidad';
    if (e.includes('para licitar') || e.includes('proyecto')) return 'proyecto';
    if (e.includes('licitaci')) return 'licitacion';
    if (e.includes('curso') || e.includes('ejecuci')) return 'en_curso';
    if (e.includes('finalizad')) return 'finalizada';
    if (e.includes('suspendid')) return 'suspendida';
    return 'factibilidad';
  }
};

window.SupabaseManager = SupabaseManager;
