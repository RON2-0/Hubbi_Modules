# Guía de Desarrollo de Módulos para Hubbi

Este documento describe las mejores prácticas y requisitos para desarrollar módulos que se integren con la plataforma Hubbi.

---

## Tipos de Módulos

Hubbi soporta dos tipos de módulos:

| Tipo | Descripción | Archivo de entrada |
|------|-------------|-------------------|
| `app` | Módulo funcional con lógica y UI | `index.umd.cjs` |
| `theme` | Tema visual (solo colores y estilos) | `theme.json` |

---

## Parte 1: Módulos Funcionales (Apps)

### Estructura de Archivos

Un módulo `.hubbi` es un archivo ZIP con esta estructura:

```
com.hubbi.billing/
├── manifest.json       # Identidad del módulo (OBLIGATORIO)
├── index.umd.cjs       # Código React compilado (UMD)
├── style.css           # Estilos (opcional)
└── sql/
    └── install.sql     # Script de instalación de tablas
```

### Manifest.json Completo

```json
{
  "id": "com.hubbi.billing",
  "name": "Facturación",
  "version": "1.0.0",
  "description": "Sistema de facturación electrónica",
  "kind": "app",
  "permissions": [
    "printer:thermal",
    {
      "id": "billing.create_invoice",
      "label": "Crear Facturas",
      "description": "Permite crear nuevas facturas"
    }
  ],
  "database": {
    "namespace": "com_hubbi_billing",
    "init_script": "sql/install.sql"
  },
  "dependencies": [
    "com.hubbi.inventory"
  ]
}
```

> [!IMPORTANT]
> Los campos `id`, `name`, `version` y `description` son **obligatorios**.

---

## Aislamiento de Datos (Tablas Propias)

### Script de Instalación SQL

En `sql/install.sql`, define tus tablas **siempre con el prefijo de tu namespace**:

```sql
-- ✅ CORRECTO: Prefijo del módulo
CREATE TABLE IF NOT EXISTS com_hubbi_billing_invoices (
    id SERIAL PRIMARY KEY,
    customer_name TEXT NOT NULL,
    total DECIMAL(10,2) NOT NULL,
    status TEXT DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS com_hubbi_billing_invoice_items (
    id SERIAL PRIMARY KEY,
    invoice_id INTEGER REFERENCES com_hubbi_billing_invoices(id),
    product_name TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_billing_invoices_status 
    ON com_hubbi_billing_invoices(status);
```

> [!CAUTION]
> **Nunca** intentes modificar tablas del Core (`users`, `roles`, `members`, etc.). 
> Solo puedes crear/modificar tablas con tu prefijo (`com_hubbi_{tumodulo}_*`).

### Sincronización Automática

Las tablas creadas por tu módulo se agregan automáticamente a Supabase Realtime (si usas PostgreSQL), lo que significa que cambios hechos por otros usuarios se sincronizan en tiempo real.

---

## Comunicación con el Core

### Leer Datos del Core (Solo Lectura)

```typescript
// Obtener miembros del Hub
const members = await window.hubbi.members.list();
// → [{ id, user_id, role_id, sub_hub_id, department_id }]

// Obtener roles disponibles
const roles = await window.hubbi.roles.list();
// → [{ id, name, color }]

// Obtener departamentos
const departments = await window.hubbi.departments.list();

// Obtener sub-hubs
const subHubs = await window.hubbi.subHubs.list();

// Obtener contexto actual
const ctx = window.hubbi.getContext();
// → { hubId, hubName, subHubId, subHubName, userId, userName, moduleId }
```

### Escribir en tus Tablas

```typescript
// Insertar datos
await window.hubbi.db.execute(
  'INSERT INTO com_hubbi_billing_invoices (customer_name, total) VALUES ($1, $2)',
  ['Cliente ABC', 150.00],
  { moduleId: 'com.hubbi.billing' }
);

// Actualizar datos
await window.hubbi.db.execute(
  'UPDATE com_hubbi_billing_invoices SET status = $1 WHERE id = $2',
  ['paid', invoiceId],
  { moduleId: 'com.hubbi.billing' }
);
```

### Consultar tus Tablas + Core (JOIN)

Puedes hacer SELECT en cualquier tabla, incluyendo las del Core:

```typescript
// JOIN con usuarios del Core
const invoicesWithCreator = await window.hubbi.db.query(
  `SELECT i.*, u.full_name as creator_name 
   FROM com_hubbi_billing_invoices i
   JOIN users u ON i.created_by = u.id
   WHERE i.status = $1`,
  ['pending'],
  { moduleId: 'com.hubbi.billing' }
);
```

> [!NOTE]
> SELECT está limitado a **1000 filas** y **100 queries/minuto** por seguridad.

---

## Sistema de Permisos

### Permisos Automáticos

Al instalar un módulo, se crean automáticamente:
- `{module.id}.access` → Acceso básico al módulo
- `{module.id}.admin` → Administración completa

### Permisos Personalizados

Define permisos en el manifest para control granular:

```json
{
  "permissions": [
    { "id": "billing.create_invoice", "label": "Crear Facturas", "description": "..." },
    { "id": "billing.void_invoice", "label": "Anular Facturas", "description": "..." },
    { "id": "billing.view_reports", "label": "Ver Reportes", "description": "..." }
  ]
}
```

### Verificar Permisos en Código

```typescript
// Verificar permiso específico
if (!window.hubbi.hasPermission('billing.void_invoice')) {
  window.hubbi.notify('No tienes permiso para anular facturas', 'error');
  return;
}

// Verificar acceso al módulo
if (!window.hubbi.hasPermission('com.hubbi.billing.access')) {
  return <AccessDenied />;
}
```

---

## Settings por Módulo

Almacena configuración persistente para tu módulo:

```typescript
// Guardar configuración
await window.hubbi.settings.set('api_key', 'sk-12345');
await window.hubbi.settings.set('sync_interval', '300');
await window.hubbi.settings.set('theme', JSON.stringify({ darkMode: true }));

// Leer configuración
const apiKey = await window.hubbi.settings.get('api_key');

// Obtener todo
const allSettings = await window.hubbi.settings.getAll();
// → { api_key: 'sk-12345', sync_interval: '300', theme: '{"darkMode":true}' }
```

### Tab de Configuración en Settings

Registra un componente para que aparezca en **Configuración → Módulos**:

```typescript
window.hubbi.widgets.register({
  slotName: 'settings_tab',
  moduleId: 'com.hubbi.billing',
  component: BillingSettingsTab,
  priority: 10
});

function BillingSettingsTab() {
  const [apiKey, setApiKey] = useState('');
  
  useEffect(() => {
    window.hubbi.settings.get('api_key').then(v => setApiKey(v || ''));
  }, []);
  
  const save = async () => {
    await window.hubbi.settings.set('api_key', apiKey);
    window.hubbi.notify('Configuración guardada', 'success');
  };
  
  return (
    <div className="p-6">
      <h2>Configuración de Facturación</h2>
      <input value={apiKey} onChange={e => setApiKey(e.target.value)} />
      <button onClick={save}>Guardar</button>
    </div>
  );
}
```

---

## Notificaciones

### Toast (Efímero)

```typescript
window.hubbi.notify('Factura creada exitosamente', 'success');
window.hubbi.notify('Error al procesar', 'error');
window.hubbi.notify('Procesando...', 'info');
```

### Notificación Persistente (Centro de Notificaciones)

```typescript
await window.hubbi.sendNotification({
  title: 'Nueva Factura',
  message: 'Factura #1234 generada exitosamente',
  category: 'billing',
  severity: 'info',
  actionUrl: '/billing/invoices/1234'
});
```

---

## Sistema de Eventos

### Escuchar Eventos del Core

```typescript
// Cuando se crea un miembro
window.hubbi.events.on('member:created', (event) => {
  console.log('Nuevo miembro:', event.payload);
});

// Cuando cambian roles
window.hubbi.events.on('role:updated', (event) => {
  refreshPermissions();
});
```

### Escuchar Cambios en tus Tablas

```typescript
window.hubbi.events.on('plugin:data_changed', (event) => {
  if (event.table === 'com_hubbi_billing_invoices') {
    // Otro usuario modificó una factura
    refreshInvoices();
  }
});
```

### Eventos Disponibles

| Evento | Descripción |
|--------|-------------|
| `member:created/updated/deleted` | Cambios en miembros |
| `role:created/updated/deleted` | Cambios en roles |
| `department:created/updated/deleted` | Cambios en departamentos |
| `sub_hub:created/updated/deleted` | Cambios en sucursales |
| `module:installed/uninstalled` | Instalación de módulos |
| `notification:created` | Nueva notificación |
| `plugin:data_changed` | Cambios en tablas de plugins |

---

## Comunicación entre Módulos

### Verificar si otro Módulo está Instalado

```typescript
// Verificar dependencia
const modules = await window.hubbi.db.query(
  'SELECT id FROM modules WHERE id = $1 AND is_active = true',
  ['com.hubbi.inventory'],
  { moduleId: 'com.hubbi.billing' }
);

if (modules.length === 0) {
  window.hubbi.notify('Se requiere el módulo de Inventario', 'error');
  return;
}
```

### Leer Datos de otro Módulo

```typescript
// Leer productos del módulo de inventario
const products = await window.hubbi.db.query(
  'SELECT * FROM com_hubbi_inventory_products WHERE stock > 0',
  [],
  { moduleId: 'com.hubbi.billing' }
);
```

### Eventos entre Módulos

```typescript
// Módulo A: Emitir evento personalizado
window.dispatchEvent(new CustomEvent('billing:invoice_paid', {
  detail: { invoiceId: 123, amount: 500 }
}));

// Módulo B: Escuchar evento
window.addEventListener('billing:invoice_paid', (e) => {
  const { invoiceId, amount } = e.detail;
  updateAccountBalance(amount);
});
```

---

## Widgets y Extensiones

### Registrar Widget en Dashboard

```typescript
window.hubbi.widgets.register({
  slotName: 'dashboard_main',
  moduleId: 'com.hubbi.billing',
  component: BillingDashboardWidget,
  priority: 10  // Mayor = aparece primero
});

function BillingDashboardWidget() {
  return (
    <div className="billing-widget">
      <h3>Facturas Pendientes</h3>
      {/* Tu contenido */}
    </div>
  );
}
```

### Slots Disponibles

| Slot | Ubicación |
|------|-----------|
| `dashboard_top` | Encima del contenido principal |
| `dashboard_main` | Área principal de widgets |
| `dashboard_sidebar` | Sidebar lateral |
| `dashboard_bottom` | Debajo del contenido principal |
| `user_profile_tab` | Tab en perfil de usuario |
| `settings_tab` | Tab en configuración |

---

## Auditoría

```typescript
// Registrar acción manual
window.hubbi.audit({
  action: 'VOID',
  entity: 'invoice',
  entityId: '1234',
  description: 'Factura #1234 anulada por solicitud del cliente'
});
```

> [!NOTE]
> Las operaciones SQL (`INSERT/UPDATE/DELETE`) se auditan automáticamente.

---

## Aislamiento de CSS

> [!IMPORTANT]
> **Obligatorio** para evitar conflictos con el Core.

### Opción 1: Prefijos (Recomendado)

```css
.billing-btn { background: #3b82f6; }
.billing-card { border-radius: 12px; }
```

### Opción 2: CSS Modules

```typescript
import styles from './Invoice.module.css';
<div className={styles.card}>...</div>
```

---

## Parte 2: Temas Visuales

### Estructura

```
theme.dracula/
├── manifest.json
├── theme.json
└── preview.png
```

### theme.json

```json
{
  "id": "theme.dracula",
  "type": "dark",
  "colors": {
    "background": "#282a36",
    "foreground": "#f8f8f2",
    "card": "#44475a",
    "primary": "#bd93f9",
    "primaryForeground": "#282a36",
    "secondary": "#6272a4",
    "destructive": "#ff5555",
    "border": "#6272a4",
    "input": "#44475a",
    "ring": "#bd93f9"
  },
  "radius": 0.5
}
```

---

## Publicación

### 1. Compilar

```bash
npm run build
cd dist && zip -r ../mi-modulo.hubbi .
```

### 2. Registrar

```json
{
  "modules": [{
    "id": "com.hubbi.billing",
    "name": "Facturación",
    "version": "1.0.0",
    "kind": "app",
    "url": "https://github.com/.../billing.hubbi",
    "icon": "FileText"
  }]
}
```

---

## Checklist de Validación

- [ ] `manifest.json` tiene `id`, `name`, `version`, `description`
- [ ] Tablas usan prefijo `com_hubbi_{modulo}_`
- [ ] CSS usa prefijos o CSS Modules
- [ ] Permisos verificados antes de acciones sensibles
- [ ] Auditoría registrada para acciones importantes
- [ ] No hay `console.log()` sin `import.meta.env.DEV`
- [ ] Widget registrado si requiere configuración

---

## API Completa del SDK

```typescript
window.hubbi = {
  // Datos del Core (solo lectura)
  members: { list(), get(id), update(id, data) },
  roles: { list(), get(id) },
  departments: { list() },
  subHubs: { list() },
  
  // Sistema
  system: {
    getTimezone(),
    getDateTime(),
    getLocale(),
    getPlatform()
  },

  // Filesystem (Sandboxed)
  fs: {
    read(path),
    write(path, content),
    exists(path),
    list(path),
    delete(path),
    saveDialog({ defaultName, content, filters }),
    openDialog({ filters, multiple })
  },

  // Comunicación entre Módulos
  modules: {
    expose(name, fn),
    call(targetId, method, args),
    isInstalled(id),
    list()
  },

  // Base de datos
  db: {
    query(sql, params, opts),
    execute(sql, params, opts),
    executeOffline(sql, params, opts)
  },
  
  // Configuración
  settings: {
    get(key),
    set(key, value),
    getAll()
  },
  
  // UI
  notify(msg, type),
  sendNotification({ title, message, ... }),
  navigate(path),
  
  // Permisos
  permissions: {
    list(),
    has(permissionId)
  },
  hasPermission(permissionId), // Alias
  
  // Sincronización
  sync: {
    getStatus(),
    flush(),
    onStatusChange(callback)
  },
  
  // Eventos
  events: {
    on(type, callback),
    off(type, callback),
    once(type, callback)
  },
  
  // Widgets
  widgets: {
    register({ slotName, moduleId, component, priority }),
    unregister(widgetId)
  },
  
  // Contexto
  getContext(),
  
  // Auditoría
  audit({ action, entity, entityId, description })
}
```
