# Guía de Desarrollo de Módulos para Hubbi (v3.0)

Esta es la guía definitiva y completa para desarrollar módulos para Hubbi. Contiene todo lo necesario para crear un módulo desde cero sin conocimiento previo del código fuente.

> [!WARNING]
> La violación de estos principios resultará en el rechazo del módulo durante la revisión.

---

## Tabla de Contenidos

1. [Filosofía & Estándares](#1-filosofía--estándares)
2. [Estructura del Módulo](#2-estructura-del-módulo)
3. [Configuración del Proyecto](#3-configuración-del-proyecto)
4. [Manifest.json](#4-manifestjson)
5. [Base de Datos (PostgreSQL)](#5-base-de-datos-postgresql)
6. [UI Development (React + Tailwind v4)](#6-ui-development-react--tailwind-v4)
7. [Hubbi SDK - API Completa](#7-hubbi-sdk---api-completa)
8. [Sistema de Eventos](#8-sistema-de-eventos)
9. [Sistema de Permisos](#9-sistema-de-permisos)
10. [Widgets y Slots](#10-widgets-y-slots)
11. [Comunicación entre Módulos](#11-comunicación-entre-módulos)
12. [Build & Publicación](#12-build--publicación)
13. [Seguridad](#13-seguridad)
14. [Testing y Verificación de Calidad](#14-testing-y-verificación-de-calidad) ⭐ **NUEVO**
15. [Checklist de Validación](#15-checklist-de-validación)
16. [Licenciamiento y Monetización](#16-licenciamiento-y-monetización) ⭐ **NUEVO**

---

## 1. Filosofía & Estándares

### 1.1 "Online-First" & Real-Time Performance
Hubbi asume conectividad constante como estado normal y prioriza la experiencia multi-usuario en tiempo real.

- **La nube es la verdad absoluta:** No implementes cachés locales complejos.
- **Optimización Extrema:** Tu módulo debe ser capaz de gestionar miles de registros sin latencia perceptible. Usa virtualización en tablas y paginación eficiente.
- **Sincronización en Tiempo Real:** La UI debe actualizarse automáticamente cuando **otros usuarios** modifican datos. (Multi-player experience).
- **Offline para Emergencias:** El soporte offline es SOLO para contingencias (apagones), no el modo principal de operación.

### 1.2 Cero Deuda Técnica
- **No legacy:** No soportes versiones antiguas ni deprecadas. Usa siempre la última API disponible.
- **Un solo estándar:** No mezcles estilos de código. Si algo cambia, se refactoriza todo.
- **Tipado estricto:** Prohibido usar `any`. Define interfaces claras.

### 1.3 UI/UX Premium
- **Diseño Moderno:** Usa Tailwind CSS v4 con variables CSS nativas.
- **Micro-interacciones:** Agrega feedback visual (hovers, transiciones) en elementos interactivos.
- **Iconografía:** Usa `lucide-react`. **PROHIBIDO** usar emojis en la UI.
- **Soporte Multiventana:** Diseña tu módulo para que funcione tanto en tabs como en ventanas independientes (popouts). `window.hubbi` está garantizado en ambos contextos.

### 1.4 Native Feel (Sensación Nativa)
Hubbi no es una "página web", es una aplicación de escritorio/móvil.
- **Sin Recargas:** Jamás uses `window.location.reload()` o navegación completa que cause un parpadeo blanco.
- **Navegación Fluida:** Usa siempre `window.hubbi.navigate()` o el hook de router interno.
- **Persistencia de Estado:** Al cambiar de pestaña y volver, el usuario espera encontrar el formulario tal como lo dejó (scrolling, inputs, modal abierto).
- **Shortcuts:** Implementa atajos de teclado (Ctrl+S, Ctrl+P) para acciones comunes.


---

## 2. Estructura del Módulo

El entregable es un archivo `.hubbi` (ZIP sin compresión) que contiene:

```
com.example.invoice/
├── manifest.json           # Identidad, permisos y metadatos (OBLIGATORIO)
├── dist/
│   └── index.umd.js        # Bundle compilado UMD (React)
├── sql/
│   └── 001_initial.sql     # Scripts de migración
├── assets/                 # Recursos estáticos (opcional)
│   └── icon.svg
└── README.md               # Documentación (se mostrará en la tienda)
```

### Estructura de Desarrollo (Código Fuente)

```
com.example.invoice/
├── src/
│   ├── index.tsx           # Punto de entrada principal
│   ├── components/         # Componentes React
│   ├── hooks/              # Custom hooks
│   ├── types/              # Definiciones TypeScript
│   └── styles/             # CSS (opcional)
├── sql/
│   ├── 001_initial.sql     # Inicio
│   └── 002_update.sql      # Evolución
├── manifest.json           # Manifest del módulo
├── package.json            # Dependencias
├── vite.config.ts          # Configuración de build
├── tsconfig.json           # Configuración TypeScript
└── README.md               # Documentación del módulo
```

---

## 3. Configuración del Proyecto

### 3.1 package.json

```json
{
  "name": "com.example.invoice",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite build --watch",
    "build": "vite build",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "lucide-react": "^0.460.0"
  },
  "devDependencies": {
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.0",
    "typescript": "^5.6.0",
    "vite": "^6.0.0"
  },
  "peerDependencies": {
    "react": "^18.0.0",
    "react-dom": "^18.0.0"
  }
}
```

> [!IMPORTANT]
> **React como peerDependency:** React NO debe incluirse en tu bundle. Hubbi Core lo expone globalmente.

### 3.2 vite.config.ts (CRÍTICO)

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [
    react({
      // Usar el transform moderno de JSX
      jsxRuntime: 'automatic',
    }),
  ],
  
  build: {
    // Generar formato UMD para compatibilidad con Hubbi
    lib: {
      entry: resolve(__dirname, 'src/index.tsx'),
      name: 'ComExampleInvoice',  // PascalCase del ID
      fileName: () => 'index.umd.js',
      formats: ['umd'],
    },
    outDir: 'dist',
    
    rollupOptions: {
      // CRÍTICO: Externalizar React (Hubbi Core lo provee)
      external: ['react', 'react-dom', 'react/jsx-runtime'],
      
      output: {
        // Mapear a los globales expuestos por Hubbi Core
        globals: {
          'react': 'React',
          'react-dom': 'ReactDOM',
          'react/jsx-runtime': 'HubbiJSX',
        },
        
        // Generar un solo archivo
        inlineDynamicImports: true,
      },
    },
    
    // Deshabilitar minificación para debugging (opcional)
    // minify: false,
  },
});
```

> [!CAUTION]
> **Externals obligatorios:** Si incluyes React en tu bundle, habrá conflictos de "duplicate React" que romperán tu módulo.

### 3.3 tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"]
}
```

> [!NOTE]
> Usa `"jsx": "react-jsx"` (transform moderno), NO `"jsx": "react"`.

### 3.4 Tipado del SDK (types/hubbi.d.ts)

Crea este archivo para tener autocompletado del SDK:

```typescript
/// <reference types="react" />

interface HubbiContext {
  hubId: number;
  hubName: string;
  subHubId: number;
  subHubName: string;
  userId: number;
  userName: string;
  moduleId: string;
  hubLogo: string | null;
}

interface CoreEvent<T = unknown> {
  type: string;
  table: string;
  operation: 'INSERT' | 'UPDATE' | 'DELETE';
  payload: T;
  timestamp: number;
}

interface HubbiSDK {
  // Registro
  register: (id: string, component: React.ComponentType) => void;
  
  // Base de datos
  db: {
    query: <T = unknown>(sql: string, params?: unknown[], options?: { moduleId?: string }) => Promise<T[]>;
    execute: (sql: string, params?: unknown[], options?: { moduleId?: string }) => Promise<{ rowsAffected: number }>;
    executeOffline: (sql: string, params: unknown[], options: {
      moduleId: string;
      actionType: 'INSERT' | 'UPDATE' | 'DELETE';
      friendlyTitle: string;
      table?: string;
      recordId?: number;
    }) => Promise<{ rowsAffected: number }>;
  };
  
  // Navegación
  navigate: (path: string) => void;
  // Breadcrumbs: Inyecta historial para soportar el flujo lógico Dashboard -> Módulo -> Volver
  injectHistory: (path: string) => void;

  
  // Notificaciones
  notify: (msg: string, type?: 'info' | 'success' | 'error', link?: string) => void;
  sendNotification: (params: {
    title: string;
    message: string;
    category: string;
    severity?: 'info' | 'warning' | 'error' | 'success';
    actionUrl?: string;
  }) => Promise<void>;
  
  // Configuración por módulo
  settings: {
    get: (key: string, moduleId?: string) => Promise<string | null>;
    set: (key: string, value: string, moduleId?: string) => Promise<void>;
    getAll: (moduleId?: string) => Promise<Record<string, string>>;
  };
  
  // Búsqueda
  onSearch: (callback: (query: string) => void) => () => void;
  
  // Contexto
  getContext: () => HubbiContext;
  
  // Auditoría
  audit: (params: { action: string; entity?: string; entityId?: string; description: string }) => void;
  
  // Permisos
  hasPermission: (permissionId: string) => boolean;
  permissions: {
    list: () => Promise<Array<{ id: string; label: string; description: string; category: string }>>;
    has: (permissionId: string) => boolean;
  };
  
  // Eventos
  events: {
    on: <T = unknown>(eventType: string, callback: (event: CoreEvent<T> | { type: string; payload: T }) => void) => () => void;
    off: <T = unknown>(eventType: string, callback: (event: CoreEvent<T> | { type: string; payload: T }) => void) => void;
    once: <T = unknown>(eventType: string, callback: (event: CoreEvent<T> | { type: string; payload: T }) => void) => void;
    dispatch: <T = unknown>(eventType: string, payload: T) => void;
  };
  
  // Datos del Core (solo lectura)
  members: {
    list: () => Promise<Array<{ id: number; user_id: number; role_id: number; sub_hub_id: number | null; department_id: number | null }>>;
    get: (id: number) => Promise<{ id: number; user_id: number; role_id: number; sub_hub_id: number | null; department_id: number | null } | null>;
    update: (id: number, data: { role_id?: number; department_id?: number }) => Promise<void>;
  };
  roles: {
    list: () => Promise<Array<{ id: number; name: string; color: string }>>;
    get: (id: number) => Promise<{ id: number; name: string; color: string } | null>;
  };
  departments: {
    list: () => Promise<Array<{ id: number; name: string }>>;
  };
  subHubs: {
    list: () => Promise<Array<{ id: number; name: string; is_main: boolean }>>;
  };
  
  // Sistema
  system: {
    getTimezone: () => string;
    getDateTime: () => string;
    getLocale: () => string;
    getPlatform: () => string;
    formatDate: (date: string | Date, options?: Intl.DateTimeFormatOptions) => string;
    formatTime: (date: string | Date, options?: Intl.DateTimeFormatOptions) => string;
    getLicenseStatus: () => Promise<{ valid: boolean; tier: string; max_hubs?: number }>;
  };
  
  // Periodos Operativos
  periods: {
    getCurrentPeriod: () => unknown;
    getId: () => string | null;
    isPeriodReadOnly: () => boolean;
    isTimeTraveling: () => boolean;
    getActivePeriod: () => unknown;
    validateWriteAllowed: () => void;
    injectPeriodId: <T extends object>(data: T) => T & { period_id: string };
  };
  
  // HTTP (whitelist controlado)
  http: {
    fetch: (url: string, options?: RequestInit) => Promise<{
      status: number;
      headers: Record<string, string>;
      body: string;
      json: () => Promise<unknown>;
      text: () => Promise<string>;
    }>;
  };
  
  // Filesystem (sandboxed al directorio del módulo)
  fs: {
    read: (relativePath: string, moduleId?: string) => Promise<string | null>;
    write: (relativePath: string, content: string, moduleId?: string) => Promise<boolean>;
    exists: (relativePath: string, moduleId?: string) => Promise<boolean>;
    list: (relativePath?: string, moduleId?: string) => Promise<string[]>;
    delete: (relativePath: string, moduleId?: string) => Promise<boolean>;
    saveDialog: (options: { defaultName?: string; content: string; filters?: Array<{ name: string; extensions: string[] }> }) => Promise<boolean>;
    openDialog: (options?: { filters?: Array<{ name: string; extensions: string[] }>; multiple?: boolean }) => Promise<string | string[] | null>;
  };
  
  // Comunicación entre módulos
  modules: {
    expose: (name: string, fn: (...args: unknown[]) => unknown, moduleId?: string) => void;
    call: <T = unknown>(targetModuleId: string, methodName: string, ...args: unknown[]) => Promise<T>;
    isInstalled: (moduleId: string) => Promise<boolean>;
    list: () => Promise<Array<{ id: string; name: string; version: string }>>;
  };
  
  // Sincronización
  sync: {
    getStatus: () => { pendingCount: number; isOnline: boolean; lastSync: Date | null };
    flush: () => Promise<void>;
    onStatusChange: (callback: (status: { isOnline: boolean; pendingCount: number }) => void) => () => void;
    pull: (tables: string[], since?: string | null) => Promise<{ recordsPulled: number; lastSync: string }>;
    push: () => void;
  };
  
  // Widgets
  widgets: {
    register: (widget: { slotName: string; moduleId: string; component: React.ComponentType<{ context?: unknown }>; priority?: number }) => void;
    unregister: (widgetId: string) => void;
  };
}

declare global {
  interface Window {
    hubbi: HubbiSDK;
    React: typeof import('react');
    ReactDOM: typeof import('react-dom');
    ReactDOMClient: typeof import('react-dom/client');
    HubbiJSX: typeof import('react/jsx-runtime');
  }
}

export {};
```

---

## 4. Manifest.json

### Estructura Completa

```json
{
  "id": "com.example.invoice",
  "name": "Facturación Pro",
  "version": "1.0.0",
  "description": "Módulo avanzado de facturación electrónica.",
  "kind": "app",
  "icon": "assets/icon.svg",
  "readme": "README.md",
  
  "meta": {
    "entry_point": "dist/index.umd.js",
    "integrity": "a1b2c3d4e5f6..."
  },
  
  "permissions": [
    "printer:thermal",
    {
      "id": "invoice.approve",
      "label": "Aprobar Facturas",
      "description": "Permite marcar facturas como aprobadas."
    },
    {
      "id": "invoice.void",
      "label": "Anular Facturas",
      "description": "Permite anular facturas emitidas."
    }
  ],
  
  "dependencies": ["com.hubbi.inventory"],
  "optionalDependencies": ["com.hubbi.reports"],
  
  "database": {
    "namespace": "com_example_invoice",
    "migrations": [
      { "version": 1, "script": "sql/001_initial.sql", "description": "Initial schema" },
      { "version": 2, "script": "sql/002_add_indexes.sql", "description": "Performance tuning" }
    ]
  }
}
```

### Campos Obligatorios

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | string | Identificador único en formato reverse-domain (ej: `com.example.nombre`) |
| `name` | string | Nombre visible del módulo |
| `version` | string | Versión semántica (ej: `1.0.0`) |
| `description` | string | Descripción breve del módulo |

### Campos Opcionales

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `kind` | `"app"` \| `"theme"` | Tipo de módulo (default: `app`) |
| `icon` | string | Nombre del icono Lucide con fondo opcional (ej: `lucide:Rose?bg=#ff0000`) o ruta a archivo (ej: `assets/icon.svg`) |
| `readme` | string | Ruta al archivo README (ej: `README.md`) o contenido Markdown en texto |
| `meta.entry_point` | string | Ruta al script principal (default: `index.umd.js`) |
| `meta.integrity` | string | Hash SHA256 del script para verificación |
| `permissions` | array | Permisos requeridos/definidos |
| `dependencies` | array | IDs de módulos requeridos (Instalación fallará si faltan) |
| `optionalDependencies` | array | IDs de módulos opcionales (Sugeridos en la UI) |
| `database.namespace` | string | Prefijo para tablas DB |
| `database.migrations` | array | **(Recomendado)** Array de objetos `{ version, script, description }`. Se ejecutan secuencialmente y solo una vez por versión. |
| `database.init_script` | string | **(Deprecado)** Ruta al script SQL de instalación única. Se ejecuta en cada actualización. |
| `required_license` | string | Nivel de licencia mínimo requerido (`free`, `premium`, `enterprise`). Si no se cumple, el módulo no se instalará. |

### 4.1 Requisitos por Tipo de Módulo

Hubbi distingue entre dos tipos principales de módulos mediante el campo `kind`. Cada uno tiene reglas de validación estrictas:

#### A. Aplicaciones (`kind: "app"`)
Son módulos funcionales completos.
- **Permite:** `permissions`, `dependencies`, `database`, scripts backend.
- **Uso:** Funcionalidades de negocio (Facturación, Inventario, CRM).

#### B. Temas Visuales (`kind: "theme"`)
Son módulos puramente estéticos que modifican la apariencia de Hubbi.
- **Requiere:** `kind: "theme"`.
- **PROHIBIDO:** No pueden declarar `permissions` ni `dependencies`.
- **PROHIBIDO:** No pueden ejecutar scripts de base de datos (`database` section).
- **Validación:** El sistema rechazará la instalación si un tema intenta solicitar permisos o dependencias por seguridad.
- **Archivo `theme.json`:** Deben incluir este archivo en la raíz para definir la paleta de colores.

### 4.2 Limitaciones en Móviles (Native Permissions)

> [!IMPORTANT]
> **Las capacidades de hardware (Cámara, GPS, Bluetooth) NO son dinámicas.**

Si tu módulo requiere acceso a hardware nativo que no está incluido en la app principal de Hubbi por defecto (cámara, ubicación, etc.), **tu módulo no funcionará inmediatamente** en móviles.

1.  **Permisos Lógicos vs. Nativos:**  
    En `manifest.json` defines permisos lógicos del sistema Hubbi (ej. `can_approve_invoice`). Estos funcionan siempre.
    
2.  **Permisos de Hardware:**  
    Para acceder al hardware en Android/iOS, la **Aplicación Principal (Binary)** debe haber sido compilada con esos permisos en su `AndroidManifest.xml` y `Info.plist`.

**Solución para Desarrolladores:**
- Si requieres una capacidad estándar (Cámara, Escáner QR), verifica si Hubbi Core ya la incluye.
- Si es una capacidad nueva o exótica (ej. NFC, Bluetooth Low Energy), tu módulo requerirá una **actualización de la app principal** en la Google Play Store / Apple App Store para funcionar. **Documenta esto claramente en tu README.**

---

## 5. Base de Datos (PostgreSQL & SQLite)

Tu módulo debe funcionar **Tanto en Online (PostgreSQL)** como en **Offline/Local (SQLite)**. 

> [!IMPORTANT]
> Hubbi utiliza un motor de sincronización que replica la estructura. Debes usar **SQL Estándar (ANSI SQL)** siempre que sea posible.
> - **Evita** funciones exclusivas de Postgres si no tienen equivalente en SQLite.
> - El SDK de Hubbi abstrae algunas diferencias, pero tu `install.sql` debe ser compatible.

### 5.1 Esquemas por Módulo (Aislamiento Automático)

Hubbi implementa **aislamiento automático por esquema** para garantizar seguridad y orden. Cada módulo recibe su propio esquema PostgreSQL basado en su ID.

**PostgreSQL (Nube):**
- Hubbi crea un **esquema dedicado** para cada módulo al instalarlo.
- Tu módulo `com.example.invoice` obtiene el esquema `com_example_invoice`.
- En tus migraciones SQL, **usa nombres de tabla limpios** (sin prefijos):

```sql
-- ✅ CORRECTO: Nombres limpios (el esquema se maneja automáticamente)
CREATE TABLE IF NOT EXISTS headers (...);
CREATE TABLE IF NOT EXISTS lines (...);
CREATE INDEX IF NOT EXISTS idx_headers_status ON headers(status);

-- ❌ INCORRECTO: No uses prefijos (ya no es necesario)
CREATE TABLE IF NOT EXISTS com_example_invoice_headers (...);
```

**En tus queries TypeScript:**

```typescript
// ✅ CORRECTO: Nombres limpios
const result = await window.hubbi.db.query(
  'SELECT * FROM headers WHERE status = $1',
  ['active'],
  { moduleId: 'com.example.invoice' }
);

// El SDK automáticamente reescribe a: com_example_invoice.headers
```

**SQLite (Local/Offline):**
- SQLite no soporta esquemas. El sistema usa el prefijo `mod_` automáticamente.
- Tu tabla `headers` se convierte en `mod_com_example_invoice_headers`.
- Este manejo es **transparente** - escribe SQL limpio y el backend maneja la traducción.

> [!CAUTION]
> **Aislamiento Estricto:** El sistema bloqueará cualquier consulta que intente acceder a tablas fuera de TU esquema.
> - Intentar leer `otromodulo.tabla` resultará en un error **"Access Denied"**.
> - Solo tienes lectura/escritura sobre tus propias tablas.
> - Para leer datos de otros módulos, usa la API inter-módulos (`window.hubbi.modules.call()`).

> [!TIP]
> **Al desinstalar un módulo,** su esquema completo se elimina con `DROP SCHEMA CASCADE`, limpiando automáticamente todas las tablas, índices y triggers.

### 5.2 Migraciones Versionadas (Nuevo Estándar)

Hubbi utiliza un sistema de **Migraciones Versionadas** para gestionar cambios en la base de datos de manera segura y predecible.

1.  **Definición en Manifest:**
    En lugar de un único `install.sql`, defines una lista ordenada de cambios en tu `manifest.json`:
    
    ```json
    "database": {
      "namespace": "com_example_invoice",
      "migrations": [
        { "version": 1, "script": "sql/001_initial.sql", "description": "Estructura base" },
        { "version": 2, "script": "sql/002_add_vat_column.sql", "description": "Agrega columna VAT" }
      ]
    }
    ```

2.  **Seguimiento de Estado:**
    Hubbi mantiene una tabla interna (`module_migrations`) rastreando qué versiones ya se han aplicado a este entorno.
    - Al instalar/actualizar, el sistema consulta: *"¿Qué versiones faltan?"*.
    - Solo se ejecutan los scripts de las versiones **pendientes**.
    - Se ejecutan en orden estricto de versión (1 -> 2 -> 3).

3.  **Inmutabilidad:**
    - **NUNCA** modifiques un script de migración que ya ha sido publicado (ej. `001_initial.sql`).
    - Si necesitas cambiar algo, crea una **nueva migración** (ej. `003_fix_typo.sql`) con el cambio.
    - Esto garantiza que todos los usuarios, sin importar cuándo instalaron el módulo, terminen con la misma estructura final.

4.  **Legacy (Deprecado):**
    El uso de `init_script` (un solo archivo re-ejecutable) está soportado por compatibilidad pero marcado como **deprecado**. Se recomienda migrar a `database.migrations` para evitar problemas de re-ejecución accidental.

### 5.3 Sincronización Realtime (Supabase)

Para soportar la experiencia "Multi-player":

1.  **Publicación:** Tus tablas en Postgres (dentro de tu esquema de módulo, ej: `com_hubbi_inventory.*`) deben ser visibles para la replicación. Hubbi Core intenta configurarlo, pero diseña tus tablas pensando en que `UPDATES` y `INSERTS` se propagarán.
3.  **Eventos Remotos:** El cliente de Hubbi escucha cambios de Supabase Realtime y dispara el mismo evento `plugin:data_changed`. Tu UI solo debe escuchar este evento unificado para actualizarse, sin importar si el cambio vino de tu propia sesión o de un usuario remoto.

#### Suscripción a Eventos de Tiempo Real

Hubbi Core proporciona un sistema de eventos unificado para que los módulos reciban actualizaciones en tiempo real. **Siempre** suscríbete en el `useEffect` de tu componente principal:

```typescript
useEffect(() => {
  // Suscribirse a cambios de TU tabla
  const unsubscribe = window.hubbi.events.on('plugin:data_changed', (event) => {
    // Filtra solo eventos de TU módulo/tabla
    if (event.table.startsWith('com_example_invoice_')) {
      console.log('Cambio detectado:', event.operation, event.table);
      loadData(); // Recargar datos
    }
  });
  
  return unsubscribe; // Limpiar al desmontar
}, []);
```

#### Tipos de Eventos Disponibles

| Evento | Cuándo se dispara | Payload |
|--------|-------------------|---------|
| `plugin:data_changed` | INSERT/UPDATE/DELETE en tablas de módulos | `{ table, operation, payload, timestamp }` |
| `db:table_changed` | Cambios en tablas genéricas del Core | `{ table, operation, payload, timestamp }` |
| `member:created` | Nuevo miembro creado | Datos del miembro |
| `member:updated` | Miembro actualizado | Datos actualizados |
| `member:deleted` | Miembro eliminado | ID del miembro |
| `role:created` / `role:updated` / `role:deleted` | Cambios en roles | Datos del rol |
| `department:created` / `department:updated` / `department:deleted` | Cambios en departamentos | Datos del departamento |
| `sub_hub:created` / `sub_hub:updated` / `sub_hub:deleted` | Cambios en sucursales | Datos de la sucursal |
| `module:installed` / `module:uninstalled` | Módulos instalados/desinstalados | ID del módulo |
| `notification:created` | Nueva notificación | Datos de la notificación |

#### Ejemplo: Actualización Optimista + Confirmación

Para la mejor experiencia de usuario, combina actualizaciones optimistas con confirmación por eventos:

```typescript
const createInvoice = async () => {
  // 1. Actualización optimista (UI responde inmediatamente)
  setInvoices(prev => [...prev, tempInvoice]);
  
  try {
    // 2. Ejecutar en la base de datos
    await window.hubbi.db.execute(
      `INSERT INTO com_example_invoice_headers ...`,
      [/* params */],
      { moduleId }
    );
    // 3. El evento plugin:data_changed llegará automáticamente
    //    desde otros dispositivos y confirmará el cambio
  } catch (error) {
    // 4. Revertir si falla
    setInvoices(prev => prev.filter(i => i.id !== tempInvoice.id));
    window.hubbi.notify('Error al crear', 'error');
  }
};
```

> [!TIP]
> **No recargar datos en INSERT propio:** Si TÚ ejecutaste el INSERT, ya tienes los datos. Solo recarga cuando el evento venga de **otro usuario** (puedes identificarlo comparando el `userId` del contexto con el del evento).

### 5.6 Realtime Nativo (Zero Latency - OBLIGATORIO)

Para garantizar la experiencia de sincronización instantánea ("Online-First") y cumplir con los estándares del Core, tu módulo debe implementar **Triggers Nativos de Postgres** (`NOTIFY`). Esto permite que la app reciba cambios incluso si la capa de Supabase tiene latencia o problemas de conexión.

Agrega este bloque al final de tu `sql/install.sql`:

```sql
-- =============================================
-- REALTIME NATIVO (Zero Latency)
-- =============================================
-- 1. Definir Función de Notificación (si no existe)
-- Nota: Usamos un nombre único para evitar conflictos
CREATE OR REPLACE FUNCTION mod_com_example_invoice_notify_changes()
RETURNS TRIGGER AS $$
DECLARE
    payload json;
    rec json;
BEGIN
    IF (TG_OP = 'DELETE') THEN rec := row_to_json(OLD); ELSE rec := row_to_json(NEW); END IF;
    
    payload := json_build_object(
        'table', TG_TABLE_NAME,
        'operation', TG_OP,
        'timestamp', extract(epoch from now()),
        'record_id', (rec->>'id')::text,
        'payload', rec
    );

    -- Canal Global 'hubbi_changes'
    PERFORM pg_notify('hubbi_changes', payload::text);
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 2. Conectar Triggers a tus Tablas
DROP TRIGGER IF EXISTS trg_notify_invoice_headers ON com_example_invoice_headers;
CREATE TRIGGER trg_notify_invoice_headers 
AFTER INSERT OR UPDATE OR DELETE ON com_example_invoice_headers
FOR EACH ROW EXECUTE FUNCTION mod_com_example_invoice_notify_changes();

-- Repetir para otras tablas importantes...
```

> [!IMPORTANT]
> El canal `hubbi_changes` es global. El cliente Hubbi filtra automáticamente los eventos que pertenecen a tu módulo basándose en el nombre de la tabla. Al implementar esto, tu módulo tendrá la misma velocidad de reacción que el Core.

### 5.4 Contenido de Scripts SQL (Ejemplo)

Aunque las migraciones versionadas garantizan que un script corra una sola vez, se recomienda mantener **idempotencia** interna donde sea posible para facilitar testing manual.

```sql
-- sql/001_initial.sql
-- Módulo: com.example.invoice
-- Versión: 1

-- =============================================
-- TABLA PRINCIPAL: Cabeceras de Factura
-- =============================================
-- Nota de Compatibilidad:
-- Usamos el prefijo `mod_` (e.j: `mod_com_example_...`) para compatibilidad universal.

CREATE TABLE IF NOT EXISTS mod_com_example_invoice_headers (
    id TEXT PRIMARY KEY,
    hub_id INTEGER NOT NULL,
    invoice_number TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    customer_tax_id TEXT,
    subtotal NUMERIC(15, 2) NOT NULL DEFAULT 0,
    tax NUMERIC(15, 2) NOT NULL DEFAULT 0,
    total NUMERIC(15, 2) NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'issued', 'paid', 'void')),
    issued_at TIMESTAMP, -- En SQLite será TEXT/REAL
    created_by INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- NOW() es PG, CURRENT_TIMESTAMP es ANSI
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_invoice_headers_hub 
    ON com_example_invoice_headers(hub_id);
CREATE INDEX IF NOT EXISTS idx_invoice_headers_status 
    ON com_example_invoice_headers(hub_id, status);
CREATE INDEX IF NOT EXISTS idx_invoice_headers_number 
    ON com_example_invoice_headers(hub_id, invoice_number);

-- =============================================
-- TABLA SECUNDARIA: Líneas de Factura
-- =============================================
CREATE TABLE IF NOT EXISTS com_example_invoice_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    header_id UUID NOT NULL REFERENCES com_example_invoice_headers(id) ON DELETE CASCADE,
    product_name TEXT NOT NULL,
    quantity NUMERIC(10, 3) NOT NULL,
    unit_price NUMERIC(15, 4) NOT NULL,
    tax_rate NUMERIC(5, 2) DEFAULT 0,
    total NUMERIC(15, 2) NOT NULL,
    sort_order INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_invoice_lines_header 
    ON com_example_invoice_lines(header_id);

-- =============================================
-- NOTAS DE COMPATIBILIDAD
-- =============================================
-- SQLite no soporta RLS (Row Level Security) ni bloques DO $$.
-- Si necesitas lógica específica para Postgres (como triggers complejos o RLS granular),
-- contacta al equipo de Core para implementar scripts diferenciados.
--
-- Por defecto, Hubbi maneja el aislamiento básico (hub_id) en el backend.
-- Asegúrate de incluir la columna `hub_id` en tus tablas.

-- =============================================
-- TRIGGER: updated_at automático
-- =============================================
CREATE OR REPLACE FUNCTION com_example_invoice_update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_invoice_headers_updated ON com_example_invoice_headers;
CREATE TRIGGER trg_invoice_headers_updated
    BEFORE UPDATE ON com_example_invoice_headers
    FOR EACH ROW
    EXECUTE FUNCTION com_example_invoice_update_timestamp();
```

> [!IMPORTANT]
> **RLS es obligatorio.** Sin RLS, los datos de un Hub serían visibles por otros Hubs.

> [!CAUTION]
> **NUNCA** modifiques tablas del Core (`users`, `roles`, `members`, `hubs`, etc.). Solo puedes crear/modificar tablas con tu prefijo.

### 5.5 File System y Compatibilidad Android

Para garantizar que tu módulo funcione en Windows, Android e iOS sin cambios, debes seguir estrictamente estas reglas de manejo de archivos:

1.  **NUNCA uses rutas absolutas:**  
    Incorrecto ❌: `C:/Users/Admin/data.json` o `/data/user/0/com.hubbi/files/data.json`  
    Correcto ✅: `data.json` o `reportes/2026.csv`

2.  **Usa SIEMPRE el SDK `hubbi.fs`:**  

---

## 6. Lógica de Navegación y UI (Nuevo en v3.0)

### 6.1 Lógica de Breadcrumbs (History Injection)
Para garantizar una navegación lógica, Hubbi implementa automáticamente una "inyección de historial" al abrir módulos en nuevas pestañas.

**El Problema:**
En una web tradicional, si abres un link en nueva pestaña, el historial está vacío. Si el usuario presiona "Atrás", la pestaña se cierra o no hace nada.

**La Solución Hubbi:**
Cuando un usuario abre tu módulo desde el Inicio, Hubbi inyecta artificialmente el estado "Dashboard" (`/`) antes de tu ruta (`/app/com.mi.modulo`).
 Esto significa:
1. Usuario abre tu módulo.
2. Usuario presiona botón "Atrás" (físico o mouse).
3. **Resultado:** El usuario vuelve al "Dashboard" de esa pestaña (Nueva Pestaña), en lugar de salir de la app o cerrar la pestaña abruptamente.

**Tu Responsabilidad:**
- Diseña tu UI asumiendo que el usuario puede llegar "desde atrás" y "volver hacia atrás".
- No rompas el historial del navegador con `replaceState` agresivos a menos que sea estrictamente necesario.

### 6.2 Preservación de Estado (Tab Persistence)
Los usuarios de Hubbi trabajan con múltiples pestañas abiertas simultáneamente (Ventas, Inventario, Ajustes).

**Regla de Oro:** **Jamás pierdas el estado del usuario.**

1. **Persistencia en Memoria:** 
   Mientras la pestaña siga abierta, tu módulo **no se desmonta** del DOM (solo se oculta con `display: none` optimizado).
   - **No uses** `useEffect` de montaje/desmontaje para lógica crítica que deba correr cada vez que la pestaña se "ve".
   - Usa el evento de visibilidad si necesitas saber cuándo el usuario te está mirando:
     ```typescript
     document.addEventListener('visibilitychange', () => {
         if (!document.hidden) {
             console.log('Usuario volvió a mi pestaña');
         }
     });
     ```

2. **Evitar Re-renders Innecesarios:**
   Dado que tu módulo sigue vivo en segundo plano, cualquier suscripción activa (timers, sockets) seguirá consumiendo recursos.
   - **Pausa** animaciones pesadas o pollings frecuentes cuando `document.hidden` sea true.
   - Usa `memo` en tus componentes raíz para evitar renders cuando otras pestañas cambian el estado global.

3. **Restauración de Sesión:**
   Si el usuario recarga la app completa (F5/Ctrl+R), Hubbi intentará restaurar las pestañas abiertas.
   - Guarda el estado crítico de formularios (borradores) en `localStorage` o `window.hubbi.settings` para recuperarlos si ocurre un reinicio inesperado.

    El SDK maneja automáticamente el "Sandboxing". Cuando escribes `hubbi.fs.write('config.json', ...)`:
    - En **Windows**, se guarda en `%APPDATA%/Hubbi/plugins/com.example.id/data/config.json`
    - En **Android**, se guarda en el almacenamiento interno privado de la app.

3.  **No asumas estructuras de carpetas del OS:**  
    Android tiene permisos muy estrictos (Scoped Storage). Tu módulo solo tiene permiso garantizado para escribir dentro de su propia jaula virtual proporcionada por el SDK.

### 5.6 Optimistic Locking (Control de Versiones)

Para prevenir pérdida de datos cuando múltiples usuarios editan el mismo registro simultáneamente, Hubbi implementa **Optimistic Locking** basado en versiones.

#### ¿Qué es Optimistic Locking?

Es un mecanismo que detecta conflictos al guardar. Funciona así:
1. Usuario A carga un registro (versión 5)
2. Usuario B carga el mismo registro (versión 5)
3. Usuario A guarda primero → versión se incrementa a 6
4. Usuario B intenta guardar con versión 5 → **CONFLICTO DETECTADO** ❌
5. Sistema rechaza el guardado y alerta al Usuario B

#### Implementación en tu Esquema

**Agrega una columna `version` a las tablas críticas:**

```sql
CREATE TABLE IF NOT EXISTS mod_com_example_invoice_headers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hub_id INTEGER NOT NULL,
    invoice_number TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    total NUMERIC(15, 2) NOT NULL DEFAULT 0,
    version BIGINT NOT NULL DEFAULT 1,  -- ⭐ Columna de versión
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

> [!IMPORTANT]
> - Tipo: `BIGINT` (no `INTEGER`, para soportar muchas actualizaciones)
> - Default: `1`
> - NOT NULL

#### Uso en el SDK

**Método Manual** (más control):

```typescript
// 1. Cargar datos incluyendo versión
const invoices = await window.hubbi.db.query<{
  id: string;
  customer_name: string;
  version: number;
}>('SELECT id, customer_name, version FROM invoices WHERE id = ?', [invoiceId]);

const invoice = invoices[0];

// 2. Guardar con protección de versión
try {
  await window.hubbi.db.update('invoices', invoice.id, { 
    customer_name: 'Nuevo Nombre' 
  }, {
    moduleId: 'com.example.invoice',
    snapshotVersion: invoice.version  // ⭐ Pasar versión actual
  });
  
  console.log('✅ Guardado exitoso');
} catch (error) {
  if (error.includes('Optimistic lock failed')) {
    // Otro usuario modificó el registro
    window.hubbi.notify('Este registro fue modificado por otro usuario. Recarga la página.', 'error');
  } else if (error.includes('Record not found')) {
    window.hubbi.notify('El registro fue eliminado.', 'error');
  }
}
```

**Método Automático** (helper method):

```typescript
// Helper que automatiza fetch → update con versión
await window.hubbi.db.updateVersioned('invoices', invoiceId, (current) => ({
  customer_name: 'Nuevo Nombre',
  total: current.total + 100  // Puedes usar valores actuales de forma segura
}));
```

> [!TIP]
> **Usa `updateVersioned` cuando:**
> - Necesitas modificar un registro basándote en sus valores actuales
> - Quieres protección automática sin boilerplate
> 
> **Usa el método manual cuando:**
> - Ya tienes los datos cargados en el estado de React
> - Necesitas más control sobre el manejo de errores

#### Mensajes de Error Descriptivos

El sistema retorna errores específicos para ayudar en debugging:

- **`Optimistic lock failed: Expected version 5, but record has version 7. Record was modified by another user.`**  
  → Conflicto de versión. Recargar datos y pedir al usuario que revise cambios.

- **`Record not found in table 'invoices'`**  
  → El registro fue eliminado por otro usuario.

- **`Optimistic locking error: Table 'invoices' does not have a 'version' column. Add 'version BIGINT NOT NULL DEFAULT 1' to use snapshot versioning.`**  
  → Tu tabla no tiene la columna `version`. Actualiza tu `install.sql`.

#### Modo Offline

El Optimistic Locking también funciona en modo offline:

```typescript
await window.hubbi.db.update('invoices', invoiceId, { 
  status: 'paid' 
}, {
  moduleId: 'com.example.invoice',
  offlineSupport: true,
  snapshotVersion: invoice.version,  // Se verificará al sincronizar
  friendlyTitle: 'Marcar factura como pagada'
});
```

Cuando el dispositivo vuelva online, el sistema de sync verificará la versión antes de aplicar el cambio.

#### Best Practices

1. **Siempre incluye `version` en tu SELECT cuando vayas a UPDATE**:
   ```sql
   SELECT id, name, version FROM items WHERE id = ?
   ```

2. **Muestra un mensaje claro al usuario cuando hay conflicto**:
   ```typescript
   if (error.includes('Optimistic lock failed')) {
     // Bueno: "Este registro fue modificado. Recarga para ver cambios actuales."
     // Malo: "Error al guardar."
   }
   ```

3. **Opcional: Muestra un diff visual**  
   Si detectas conflicto, puedes cargar la versión actual y mostrar qué cambió:
   ```typescript
   const currentData = await fetchLatestVersion();
   showConflictDialog({
     yours: pendingChanges,
     theirs: currentData
   });
   ```

4. **No uses optimistic locking para tablas de solo-lectura o logs**  
   Solo para tablas donde haya riesgo de edición simultánea.

### 5.7 Auditoría, Soft Deletes y Periodos Operativos (NUEVO)

Esta sección cubre tres pilares fundamentales para la integridad y operación correcta de módulos empresariales en Hubbi.

#### A. Logs de Auditoría (Audit Logs)

Hubbi genera logs de auditoría automáticamente para todas las operaciones de modificación de datos (`INSERT`, `UPDATE`, `DELETE`) realizadas a través del SDK.

- **Automático:** Cuando usas `hubbi.db.insert`, `update` o `delete`, el sistema registra automáticamente quién modificó qué tabla, cuándo y en qué periodo operativo.
- **Manual:** Para acciones de negocio específicas (ej. "Aprobar Factura", "Imprimir Reporte"), usa explícitamente `hubbi.audit()`:

```typescript
hubbi.audit({
    action: "APPROVE",
    entity: "invoice",
    entityId: invoice.id,
    description: `Factura ${invoice.number} aprobada por ${user.name}`
});
```

> [!NOTE]
> Los logs automáticos incluyen el `period_id` activo del usuario, garantizando trazabilidad por periodo contable.

#### B. Soft Deletes (Papelera)

Hubbi soporta "Soft Deletes" (marcar como eliminado sin borrar físicamente) bajo control del módulo. Recomendamos encarecidamente este enfoque para evitar pérdida accidental de datos.

1. **Esquema:** Agrega columnas de soporte en tu `install.sql`:
   ```sql
   ALTER TABLE IF EXISTS mod_mis_items ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
   ALTER TABLE IF EXISTS mod_mis_items ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
   ```

2. **Borrado:** En lugar de llamar a `db.delete`, usa `db.update` para cambiar el estado:
   ```typescript
   await hubbi.db.update('mis_items', item.id, {
       status: 'deleted',
       deleted_at: new Date().toISOString()
   }, { offlineSupport: true });
   ```

3. **Consultas:** Asegúrate de filtra los eliminados en tus `SELECT`:
   ```sql
   SELECT * FROM mod_mis_items WHERE status != 'deleted'
   ```

#### C. Periodos Operativos (Period ID)

El Core maneja periodos operativos (ej. "Enero 2024", "Turno Mañana"). Los módulos funcionan contextualizados en un periodo y deben respetar el periodo activo del usuario.

1. **Esquema:** Agrega `period_id` a tus tablas transaccionales en `install.sql`:
   ```sql
   CREATE TABLE IF NOT EXISTS mod_mis_items (
       ...
       period_id TEXT
   );
   ```

2. **Escritura:** Al crear registros, inyecta el `periodId` actual del contexto:
   ```typescript
   const { periodId } = hubbi.getContext();
   
   await hubbi.db.insert('mis_items', {
       ...data,
       period_id: periodId
   });
   ```

3. **Lectura:** Filtra siempre por el `periodId` activo para respetar la navegación por periodos del dashboard:
   ```typescript
   const { periodId } = hubbi.getContext();
   
   // Si periodId existe, filtramos. Si no (vista global), mostramos todo o filtramos por fecha.
   const items = await hubbi.db.query(
       `SELECT * FROM mod_mis_items WHERE period_id = $1`, 
       [periodId],
       { moduleId }
   );
   ```

---

## 6. UI Development (React + Tailwind v4)

### 6.1 Componente Principal (src/index.tsx)

```tsx
import React, { useState, useEffect } from 'react';
import { FileText, Plus, Search } from 'lucide-react';

// Tipos locales
interface Invoice {
  id: string;
  invoice_number: string;
  customer_name: string;
  total: number;
  status: 'draft' | 'issued' | 'paid' | 'void';
  created_at: string;
}

// Componente principal del módulo
function InvoiceModule() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  const ctx = window.hubbi.getContext();
  const moduleId = 'com.example.invoice';

  // Cargar datos al montar
  useEffect(() => {
    loadInvoices();
    
    // Suscribirse a cambios en tiempo real
    const unsubscribe = window.hubbi.events.on('plugin:data_changed', (event) => {
      if (event.table === 'com_example_invoice_headers') {
        loadInvoices();
      }
    });
    
    return unsubscribe;
  }, []);

  // Integración con búsqueda global
  useEffect(() => {
    return window.hubbi.onSearch((query) => setSearch(query));
  }, []);

  const loadInvoices = async () => {
    setLoading(true);
    try {
      const data = await window.hubbi.db.query<Invoice>(
        `SELECT * FROM com_example_invoice_headers 
         ORDER BY created_at DESC 
         LIMIT 100`,
        [],
        { moduleId }
      );
      setInvoices(data);
    } catch (error) {
      console.error('Error loading invoices:', error);
      window.hubbi.notify('Error al cargar facturas', 'error');
    } finally {
      setLoading(false);
    }
  };

  const createInvoice = async () => {
    if (!window.hubbi.hasPermission('invoice.create')) {
      window.hubbi.notify('No tienes permiso para crear facturas', 'error');
      return;
    }

    try {
      await window.hubbi.db.execute(
        `INSERT INTO com_example_invoice_headers 
         (hub_id, invoice_number, customer_name, created_by) 
         VALUES ($1, $2, $3, $4)`,
        [ctx.hubId, `INV-${Date.now()}`, 'Nuevo Cliente', ctx.userId],
        { moduleId }
      );
      
      window.hubbi.notify('Factura creada', 'success');
      
      // Auditar la acción
      window.hubbi.audit({
        action: 'CREATE',
        entity: 'invoice',
        description: 'Nueva factura creada'
      });
      
      loadInvoices();
    } catch (error) {
      console.error('Error creating invoice:', error);
      window.hubbi.notify('Error al crear factura', 'error');
    }
  };

  // Filtrar por búsqueda
  const filtered = invoices.filter(inv => 
    inv.customer_name.toLowerCase().includes(search.toLowerCase()) ||
    inv.invoice_number.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-hubbi-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText className="w-8 h-8 text-hubbi-primary" />
          <div>
            <h1 className="text-2xl font-bold text-hubbi-text">Facturación</h1>
            <p className="text-sm text-hubbi-dim">{filtered.length} facturas</p>
          </div>
        </div>
        
        <button
          onClick={createInvoice}
          className="flex items-center gap-2 px-4 py-2 bg-hubbi-primary text-hubbi-primary-fg 
                     rounded-lg hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" />
          Nueva Factura
        </button>
      </div>

      {/* Lista de Facturas */}
      <div className="bg-hubbi-card rounded-xl border border-hubbi-border overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-hubbi-dim">
            <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No hay facturas</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-hubbi-muted/50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-hubbi-dim">Número</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-hubbi-dim">Cliente</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-hubbi-dim">Total</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-hubbi-dim">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hubbi-border">
              {filtered.map(invoice => (
                <tr 
                  key={invoice.id}
                  className="hover:bg-hubbi-muted/30 transition-colors cursor-pointer"
                >
                  <td className="px-4 py-3 font-mono text-sm">{invoice.invoice_number}</td>
                  <td className="px-4 py-3">{invoice.customer_name}</td>
                  <td className="px-4 py-3 text-right font-medium">
                    ${invoice.total.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <StatusBadge status={invoice.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// Componente auxiliar para badges de estado
function StatusBadge({ status }: { status: Invoice['status'] }) {
  const styles = {
    draft: 'bg-zinc-500/20 text-zinc-400',
    issued: 'bg-blue-500/20 text-blue-400',
    paid: 'bg-green-500/20 text-green-400',
    void: 'bg-red-500/20 text-red-400',
  };
  
  const labels = {
    draft: 'Borrador',
    issued: 'Emitida',
    paid: 'Pagada',
    void: 'Anulada',
  };

  return (
    <span className={`px-2 py-1 text-xs rounded-full ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}

// ============================================
// REGISTRO DEL MÓDULO (OBLIGATORIO)
// ============================================
if (typeof window !== 'undefined' && window.hubbi) {
  window.hubbi.register('com.example.invoice', InvoiceModule);
}

export default InvoiceModule;
```

### 6.2 Clases CSS de Hubbi

Tu módulo hereda automáticamente las variables CSS del Core. Usa estas clases:

| Clase | Descripción |
|-------|-------------|
| `text-hubbi-text` | Color de texto principal |
| `text-hubbi-dim` | Color de texto secundario |
| `bg-hubbi-bg` | Fondo principal |
| `bg-hubbi-card` | Fondo de tarjetas |
| `bg-hubbi-muted` | Fondo atenuado |
| `bg-hubbi-primary` | Color primario (acento) |
| `text-hubbi-primary-fg` | Texto sobre fondo primario |
| `border-hubbi-border` | Color de bordes |
| `rounded-xl` | Bordes redondeados estándar |

### 6.3 Variables CSS Disponibles

```css
/* Colores base */
var(--color-hubbi-bg)
var(--color-hubbi-card)
var(--color-hubbi-muted)
var(--color-hubbi-text)
var(--color-hubbi-dim)
var(--color-hubbi-border)

/* Colores de acción */
var(--color-hubbi-primary)
var(--color-hubbi-primary-fg)
var(--color-hubbi-destructive)

/* Espaciado */
var(--radius-sm)   /* 4px */
var(--radius-md)   /* 8px */
var(--radius-lg)   /* 12px */
var(--radius-xl)   /* 16px */
```


---

### 6.4 Paginación del Servidor (Server-Side Pagination)

Para garantizar un rendimiento óptimo ("Online-First") con grandes volúmenes de datos, **EVITA** cargar todos los registros con un simple `SELECT *`. Implementa paginación en el servidor.

#### 1. Patrón de SQL

Usa `LIMIT` y `OFFSET` para traer solo los datos necesarios, junto con una consulta de conteo (`COUNT`) para la navegación.

```typescript
const loadData = async (page: number, pageSize: number) => {
  const offset = (page - 1) * pageSize;

  try {
    // 1. Obtener datos paginados
    const data = await window.hubbi.db.query<Invoice>(
      `SELECT * FROM com_example_invoice_headers 
       ORDER BY created_at DESC 
       LIMIT $1 OFFSET $2`,
      [pageSize, offset],
      { moduleId }
    );

    // 2. Obtener total (para calcular páginas)
    // Nota: Es mejor hacer esto en una transacción o consulta paralela si fuera posible, 
    // pero dos queries secuenciales son aceptables aquí.
    const countRes = await window.hubbi.db.query<{ total: number }>(
      `SELECT COUNT(*) as total FROM com_example_invoice_headers`,
      [],
      { moduleId }
    );
    
    return {
      data,
      total: Number(countRes[0].total)
    };
  } catch (error) {
    console.error("Error cargando datos paginados:", error);
    throw error;
  }
};
```

#### 2. Interfaz de Usuario (Ejemplo)

Debes implementar controles de paginación que mantengan el estilo visual de Hubbi.

```tsx
function PaginationControls({ page, total, pageSize, onPageChange }: any) {
  const totalPages = Math.ceil(total / pageSize);
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  if (total === 0) return null;

  return (
    <div className="flex items-center justify-between py-4 border-t border-hubbi-border">
      <span className="text-sm text-hubbi-dim">
        Mostrando <span className="font-medium text-hubbi-text">{start}</span> a <span className="font-medium text-hubbi-text">{end}</span> de <span className="font-medium text-hubbi-text">{total}</span> resultados
      </span>
      <div className="flex gap-2">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className="px-3 py-1 text-sm bg-hubbi-card hover:bg-hubbi-muted border border-hubbi-border rounded-md disabled:opacity-50 transition-colors"
        >
          Anterior
        </button>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="px-3 py-1 text-sm bg-hubbi-card hover:bg-hubbi-muted border border-hubbi-border rounded-md disabled:opacity-50 transition-colors"
        >
          Siguiente
        </button>
      </div>
    </div>
  );
}
```

---


### 6.2 Iconografía Dinámica (Lucide + Colores)

Hubbi permite personalizar los iconos de tus módulos con colores de fondo.

Hubbi tiene un fuerte enfoque en la experiencia móvil. Para garantizar que tu módulo se sienta nativo en Android/iOS, debes seguir estas reglas estrictas:

#### A. Manejo del Botón Atrás (Android Integration)

En Android, el botón físico "Atrás" debe cerrar tus ventanas modales o "overlays" (menús full-screen) antes de intentar navegar atrás o salir de la app.

Si tu módulo implementa una vista a pantalla completa que se superpone a la UI (como un modal, un panel lateral o una vista detallada), **DEBES** integrarte con el `UI Store` de Hubbi.

**Ejemplo de Integración:**

```typescript
import { useEffect } from 'react';
// Asumiendo que Hubbi expone el hook o store, o usas un mecanismo de eventos global si es externo
// Nota: Si estás dentro del monorepo, usa useUIStore. Si es módulo externo, usa la API de eventos del SDK.

// API SDK (Futura implementación recomendada para módulos externos)
const MyCustomOverlay = ({ isOpen, onClose }) => {
  
  useEffect(() => {
    if (isOpen) {
      // Registrar este overlay como activo para atrapar el botón atrás
      window.hubbi.ui.registerOverlay('my-module-overlay-id', () => {
        // Esta función se llamará cuando el usuario presione atrás
        onClose();
      });
    } else {
      // Liberar el registro
      window.hubbi.ui.unregisterOverlay('my-module-overlay-id');
    }

    // Cleanup al desmontar
    return () => window.hubbi.ui.unregisterOverlay('my-module-overlay-id');
  }, [isOpen, onClose]);

  if (!isOpen) return null;
  // ... render ...
};
```

> [!NOTE]
> Actualmente, para módulos internos del Core, se debe usar `useUIStore` directamente. Para módulos externos, se habilitará `hubbi.ui.registerOverlay` en la próxima versión del SDK. **Por ahora, asegúrate de que tus modales tengan un botón "Cerrar" visible y accesible en la UI.**

#### B. Safe Area & Status Bar (El "Notch")

En dispositivos móviles modernos, la pantalla se extiende detrás de la barra de estado (donde está la hora, batería, cámara frontal). Hubbi provee una variable CSS global para manejar esto automáticamente: `--safe-top`.

1.  **Padding Superior Obligatorio:** Si tu componente es un overlay a pantalla completa (`fixed inset-0`), debes agregar padding superior usando esta variable.
2.  **Uso Recomendado:**
    *   Usa `padding-top: var(--safe-top)` en tu contenedor principal.
    *   Evita usar `pt-12` o valores fijos (`48px`) manualmente, ya que esto podría cambiar en el futuro o por dispositivo.

**Ejemplo Incorrecto ❌:**
```tsx
<div className="fixed inset-0 bg-white pt-12"> {/* Hardcoded! */}
  <h1>Mi Título</h1>
</div>
```

**Ejemplo Correcto ✅:**
```tsx
<div 
  className="fixed inset-0 bg-white"
  style={{ paddingTop: 'var(--safe-top)' }}
>
  <div className="flex justify-between items-center px-4">
    <h1>Mi Título</h1>
    <button>Cerrar</button>
  </div>
</div>
```

> [!TIP]
> `var(--safe-top)` se ajusta automáticamente: usa la API nativa del sistema (`env(safe-area-inset-top)`) o un fallback calculado por Hubbi en Android.


### 6.6 Patrones de Navegación Estándar (Reference UI)

Para mantener la consistencia visual ("Un solo estándar") y la experiencia Premium, los módulos deben seguir estrictamente los siguientes patrones para su estructura interna.

**Importante:** Hubbi no expone una librería de componentes de UI (`@hubbi/ui`). Como desarrollador, debes implementar estos layouts en tu módulo usando las clases de Tailwind y variables CSS oficiales. No inventes navegaciones nuevas; copia y adapta estos patrones.

#### A. MainLayout (Master-Detail)

El layout estándar divide la pantalla en Contenido Principal (Tabla/Grid) y Panel de Detalles (Sidebar Derecho con animación).

```tsx
// src/components/Layout/MainLayout.tsx
import { clsx } from 'clsx';
import { X } from 'lucide-react';

export default function MainLayout({ children, sidebarOpen, setSidebarOpen, sidebarContent }: any) {
  return (
    <div className="h-full w-full flex flex-col bg-hubbi-bg text-hubbi-text overflow-hidden relative">
      {/* Header del Módulo (con Breadcrumbs/Título) */}
      <Header />

      <div className="flex-1 flex min-h-0 relative">
        {/* Área Principal: Se contrae cuando el sidebar abre */}
        <div className={clsx(
            "flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out",
            sidebarOpen ? "mr-[400px]" : "" // Reservar espacio visual
        )}>
            {children}
        </div>

        {/* Sidebar de Detalles: Posición absoluta a la derecha */}
        <div className={clsx(
            "absolute top-0 right-0 h-full w-[400px] border-l border-hubbi-border bg-hubbi-card shadow-2xl transform transition-transform duration-300 z-50",
            sidebarOpen ? "translate-x-0" : "translate-x-full"
        )}>
            {sidebarOpen && (
                <div className="h-full flex flex-col">
                    {/* Header del Sidebar */}
                    <div className="p-4 border-b border-hubbi-border flex justify-between items-center bg-hubbi-muted/50 backdrop-blur-sm">
                        <h3 className="font-semibold text-lg">Detalles</h3>
                        <button onClick={() => setSidebarOpen(false)} className="p-1 hover:bg-hubbi-muted rounded-md transition-colors">
                            <X className="w-5 h-5 text-hubbi-dim" />
                        </button>
                    </div>
                    {/* Contenido Scrollable */}
                    <div className="flex-1 overflow-y-auto">
                        {sidebarContent}
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
}
```

#### B. Tabs y Subtabs

Para organizar información dentro del Sidebar de Detalles o en vistas secundarias, usa la siguiente estructura de pestañas:

```tsx
// Patrón de Tabs (Línea Inferior)
<div className="flex border-b border-hubbi-border px-4 mb-4">
  {tabs.map((tab) => (
    <button
      key={tab.id}
      onClick={() => setActiveTab(tab.id)}
      className={`
        flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors
        ${activeTab === tab.id
           ? 'border-hubbi-primary text-hubbi-primary'
           : 'border-transparent text-hubbi-dim hover:text-hubbi-text'
        }
      `}
    >
      {tab.icon}
      {tab.label}
    </button>
  ))}
</div>

// Patrón de Subtabs (Pills)
<div className="flex gap-2 mb-4 px-4">
  {subTabs.map(sub => (
    <button
      onClick={() => setSubTab(sub.id)}
      className={`px-3 py-1 text-xs rounded-full border transition-colors ${
        activeSub === sub.id 
        ? 'bg-hubbi-primary/10 text-hubbi-primary border-hubbi-primary/20' 
        : 'bg-hubbi-muted text-hubbi-dim border-transparent hover:bg-hubbi-muted/80'
      }`}
    >
      {sub.label}
    </button>
  ))}
</div>
```

---


### 6.7 Adaptación al Tema y Línea de Diseño (Theming)

Hubbi es una aplicación "Theme-Aware" que soporta modo claro, oscuro y temas personalizados por organización. Tu módulo debe adaptarse automáticamente al entorno sin requerir configuración extra.

#### A. Regla de Oro: Semantic Colors

**NUNCA hardcodees colores hexadecimales (`#ffffff`, `#000000`, `#f3f4f6`)**.
Usa siempre las variables semánticas de Hubbi o las clases de utilidad mapeadas. Estos valores cambian dinámicamente cuando el usuario cambia de tema.

| Concepto | Incorrecto ❌ | Correcto ✅ | Resultado |
|----------|---------------|-------------|-----------|
| Fondo | `bg-white` o `bg-[#1a1b1e]` | `bg-hubbi-card` | Blanco en Light, Gris Oscuro en Dark |
| Bordes | `border-gray-200` | `border-hubbi-border` | Gris suave dinámico |
| Texto Principal | `text-black` | `text-hubbi-text` | Negro/Blanco según fondo |
| Texto Secundario | `text-gray-500` | `text-hubbi-dim` | Legible en ambos modos |
| Fondo Hover | `hover:bg-gray-100` | `hover:bg-hubbi-muted` | Feedback visual consistente |

#### B. Tipografía y Estilo "Premium"

El diseño de Hubbi busca evocar profesionalismo y modernidad (estilo "SaaS Premium" o "Apple-like").

1.  **Fuentes:** No importes fuentes externas. Hubbi inyecta `Inter` (o la fuente del sistema configurada) en el `body`. Usa `font-sans`.
2.  **Espaciado:** Sé generoso con el whitespace. Usa `p-6` o `gap-6` en lugar de amontonar contenido.
3.  **Bordes:** Usa `rounded-xl` para contenedores principales y `rounded-lg` para elementos internos. Evita esquinas rectas (`rounded-none`).
4.  **Sombras:** Usa sombras suaves (`shadow-sm`, `shadow-md`) solo en elementos flotantes o tarjetas principales para dar profundidad. Evita sombras duras.

#### C. Ejemplo de Adaptación (Dark Mode Ready)

```tsx
// Componente que se ve perfecto en Light y Dark mode sin media queries
<div className="bg-hubbi-card border border-hubbi-border rounded-xl p-6 shadow-sm">
  <h2 className="text-xl font-bold text-hubbi-text mb-2">
    Resumen Financiero
  </h2>
  <p className="text-hubbi-dim mb-6">
    Ventas acumuladas del periodo activo.
  </p>
  
  <div className="flex gap-4">
    <div className="flex-1 bg-hubbi-muted/50 rounded-lg p-4">
      <span className="text-xs font-semibold text-hubbi-dim uppercase tracking-wider">
        Ingresos
      </span>
      <div className="text-2xl font-mono text-hubbi-text mt-1">
        $12,450.00
      </div>
    </div>
  </div>
  
  <button className="mt-6 w-full py-2 bg-hubbi-primary text-hubbi-primary-fg rounded-lg hover:opacity-90 transition-opacity font-medium">
    Ver Reporte Completo
  </button>
</div>
```

---

## 7. Hubbi SDK - API Completa

El objeto global `window.hubbi` es tu puente con el sistema.

### 7.1 Base de Datos

```typescript
// SELECT (Lectura)
const invoices = await window.hubbi.db.query<Invoice>(
  `SELECT * FROM com_example_invoice_headers WHERE status = $1`, 
  ['pending'],
  { moduleId: 'com.example.invoice' }
);

// INSERT/UPDATE/DELETE (Escritura)
await window.hubbi.db.execute(
  `INSERT INTO com_example_invoice_headers (hub_id, customer_name) VALUES ($1, $2)`,
  [ctx.hubId, 'Cliente Final'],
  { moduleId: 'com.example.invoice' }
);

// Con soporte offline (para operaciones críticas)
await window.hubbi.db.executeOffline(
  `INSERT INTO com_example_invoice_headers (hub_id, customer_name) VALUES ($1, $2)`,
  [ctx.hubId, 'Cliente Final'],
  {
    moduleId: 'com.example.invoice',
    actionType: 'INSERT',
    friendlyTitle: 'Crear factura',
    table: 'com_example_invoice_headers'
  }
);
```

> [!NOTE]
> SELECT está limitado a **1000 filas** y los queries tienen rate limiting por seguridad.

### 7.2 Navegación & Notificaciones

```typescript
// Navegar entre módulos
window.hubbi.navigate('/inventory/products');

// Toast (efímero)
window.hubbi.notify('Factura creada correctamente', 'success');
window.hubbi.notify('Error al procesar', 'error');
window.hubbi.notify('Procesando...', 'info');

// Notificación persistente (Centro de Notificaciones)
await window.hubbi.sendNotification({
  title: 'Nueva Factura',
  message: 'Factura #1234 lista para revisión',
  category: 'billing',
  severity: 'info',
  actionUrl: '/billing/invoices/1234'
});
```

### 7.3 Contexto y Permisos

```typescript
// Obtener contexto actual
const ctx = window.hubbi.getContext();
// → { hubId, hubName, subHubId, subHubName, userId, userName, moduleId, hubLogo }

// Verificar permisos
if (!window.hubbi.hasPermission('invoice.void')) {
   window.hubbi.notify('No tienes permiso para anular', 'error');
   return;
}

// Acceso al módulo
if (!window.hubbi.hasPermission('com.example.invoice.access')) {
  return <AccessDenied />;
}
```

### 7.4 Configuración por Módulo

```typescript
// Guardar configuración
await window.hubbi.settings.set('api_key', 'sk-12345');
await window.hubbi.settings.set('theme', JSON.stringify({ darkMode: true }));

// Leer configuración
const apiKey = await window.hubbi.settings.get('api_key');

// Obtener todas las configuraciones
const allSettings = await window.hubbi.settings.getAll();
// → { api_key: 'sk-12345', theme: '{"darkMode":true}' }
```

### 7.5 Filesystem (Sandboxed)

Los archivos se almacenan en: `%APPDATA%/hubbi/plugins/{moduleId}/data/`

```typescript
// Escribir archivo
await window.hubbi.fs.write('config.json', JSON.stringify(data));

// Leer archivo
const content = await window.hubbi.fs.read('config.json');

// Verificar existencia
const exists = await window.hubbi.fs.exists('config.json');

// Listar archivos
const files = await window.hubbi.fs.list('reports/');

// Eliminar archivo
await window.hubbi.fs.delete('temp.txt');

// Diálogo Guardar
const saved = await window.hubbi.fs.saveDialog({
  defaultName: 'factura.pdf',
  content: pdfContent,
  filters: [{ name: 'PDF', extensions: ['pdf'] }]
});

// Diálogo Abrir
const content = await window.hubbi.fs.openDialog({
  filters: [{ name: 'CSV', extensions: ['csv'] }]
});
```

### 7.6 HTTP Proxy

Para hacer peticiones HTTP a servicios externos (debe estar en whitelist):

```typescript
const response = await window.hubbi.http.fetch('https://api.example.com/data', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ key: 'value' })
});

const data = await response.json();
console.log('Status:', response.status);
```

### 7.7 Sistema

```typescript
const tz = window.hubbi.system.getTimezone();     // 'America/El_Salvador'
const dt = window.hubbi.system.getDateTime();     // '2024-12-29T22:00:00.000Z'
const locale = window.hubbi.system.getLocale();   // 'es-SV'
const platform = window.hubbi.system.getPlatform(); // 'Win32'

// Formateo de Fechas (usa local del sistema)
window.hubbi.system.formatDate(new Date()); // '10/1/2026'
window.hubbi.system.formatTime(new Date()); // '10:30 PM'
```

### 7.8 Auditoría

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

### 7.9 Sincronización

```typescript
// PULL: Traer datos de la nube (Hydration)
// Útil al iniciar el módulo para asegurar datos frescos
await window.hubbi.sync.pull(['products', 'categories']);

// PUSH: Forzar envío de cambios pendientes
window.hubbi.sync.push();

// Estado de sincronización
const status = window.hubbi.sync.getStatus();
// → { pendingCount: 5, isOnline: true, lastSync: Date }

// Suscribirse a cambios de estado
const unsubscribe = window.hubbi.sync.onStatusChange((status) => {
  console.log('Online:', status.isOnline, 'Pending:', status.pendingCount);
});
```

### 7.10 Datos del Core (Solo Lectura)

```typescript
// Miembros
const members = await window.hubbi.members.list();
const member = await window.hubbi.members.get(1);

// Roles
const roles = await window.hubbi.roles.list();

// Departamentos
const departments = await window.hubbi.departments.list();

// Sucursales
const subHubs = await window.hubbi.subHubs.list();
```

### 7.11 Periodos Operativos

El sistema maneja periodos contables/operativos que pueden estar Abiertos, Cerrados o Bloqueados. Tu módulo debe respetar el estado del periodo.

```typescript
// Obtener periodo actual (el que el usuario está viendo)
const currentPeriod = window.hubbi.periods.getCurrentPeriod();
// -> { id: uuid, status: 'open' | 'closed' | 'locked', start_date: '...', end_date: '...' }

// Verificar si es de solo lectura (cerrado o bloqueado)
if (window.hubbi.periods.isPeriodReadOnly()) {
  // Deshabilitar botones de edición/creación
  return <ReadOnlyBanner />;
}

// Validar antes de escribir (lanza error si es read-only)
try {
  window.hubbi.periods.validateWriteAllowed();
  // ... proceder con la escritura
} catch (e) {
  window.hubbi.notify('El periodo actual es de solo lectura', 'error');
}

// Inyectar ID del periodo automáticamente
const dataToSave = window.hubbi.periods.injectPeriodId({
  amount: 100,
  concept: 'Venta'
});
// -> { amount: 100, concept: 'Venta', period_id: 'current-period-uuid' }
```

> [!IMPORTANT]
> **Integridad de Periodos:** Todos los registros transaccionales (facturas, movimientos, etc.) DEBEN incluir `period_id`. Usa `injectPeriodId` para asegurarte de usar el correcto.

---

## 8. Sistema de Eventos

### 8.1 Suscribirse a Eventos

```typescript
// Cuando se crea un miembro
const unsubscribe = window.hubbi.events.on('member:created', (event) => {
  console.log('Nuevo miembro:', event.payload);
});

// Limpiar al desmontar
useEffect(() => {
  return () => unsubscribe();
}, []);

// Escuchar una sola vez
window.hubbi.events.once('role:updated', (event) => {
  refreshPermissions();
});
```

### 8.2 Eventos Disponibles

| Evento | Descripción |
|--------|-------------|
| `member:created/updated/deleted` | Cambios en miembros |
| `role:created/updated/deleted` | Cambios en roles |
| `department:created/updated/deleted` | Cambios en departamentos |
| `sub_hub:created/updated/deleted` | Cambios en sucursales |
| `module:installed/uninstalled` | Instalación de módulos |
| `notification:created` | Nueva notificación |
| `plugin:data_changed` | Cambios en tablas de plugins |

### 8.3 Escuchar Cambios en tus Tablas

```typescript
window.hubbi.events.on('plugin:data_changed', (event) => {
  if (event.table === 'com_example_invoice_headers') {
    // Otro usuario modificó una factura
    refreshInvoices();
  }
});
```

---

## 9. Sistema de Permisos

### 9.1 Permisos Automáticos

Al instalar un módulo, se crean automáticamente:
- `{module.id}.access` → Acceso básico al módulo
- `{module.id}.admin` → Administración completa

### 9.2 Permisos Personalizados (manifest.json)

```json
{
  "permissions": [
    "printer:thermal",
    { "id": "invoice.create", "label": "Crear Facturas", "description": "..." },
    { "id": "invoice.void", "label": "Anular Facturas", "description": "..." },
    { "id": "invoice.reports", "label": "Ver Reportes", "description": "..." }
  ]
}
```

### 9.3 Verificar Permisos en Código

```typescript
// Verificar permiso específico
if (!window.hubbi.hasPermission('invoice.void')) {
  window.hubbi.notify('No tienes permiso para anular facturas', 'error');
  return;
}

// Verificar acceso al módulo
if (!window.hubbi.hasPermission('com.example.invoice.access')) {
  return <AccessDenied />;
}

// Listar todos los permisos disponibles
const allPermissions = await window.hubbi.permissions.list();
```

### 9.4 Permisos del Core

| Permiso | Descripción |
|---------|-------------|
| `*` | Superadmin (todos los permisos) |
| `members.view` | Ver miembros |
| `members.edit` | Editar miembros |
| `members.delete` | Eliminar miembros |
| `roles.manage` | Gestionar roles |
| `modules.manage` | Instalar/desinstalar módulos |
| `settings.manage` | Modificar configuración del Hub |

---

## 10. Widgets y Slots

### 10.1 Registrar Widget

```typescript
// Registrar un widget en el Dashboard
window.hubbi.widgets.register({
  slotName: 'dashboard_main',
  moduleId: 'com.example.invoice',
  component: BillingDashboardWidget,
  priority: 10  // Mayor = aparece primero
});

function BillingDashboardWidget() {
  return (
    // IMPORTANTE: No agregues onClick={navigate} al contenedor raíz.
    // El Dashboard ya maneja el clic para abrir el módulo.
    <div className="bg-hubbi-card rounded-xl p-6 border border-hubbi-border h-full flex flex-col">
      <h3 className="text-lg font-semibold mb-4">Facturas Pendientes</h3>
      {/* Tu contenido responsive */}
    </div>
  );
}
```

> [!CAUTION]
> **Navegación Duplicada:** Hubbi envuelve tu widget automáticamente en un contenedor interactivo que maneja la navegación. **NO agregues** `onClick={() => hubbi.navigate(...)}` al `div` raíz de tu widget, o causarás una doble entrada en el historial (el usuario tendrá que presionar "Atrás" dos veces).

### 10.4 Responsividad y Tamaño

Los widgets en el Dashboard pueden cambiar de tamaño dinámicamente. 
- **Usa medidas relativas:** `w-full`, `h-full`.
- **Adapta el contenido:** Usa `ResizeObserver` o Container Queries para mostrar más/menos información según el tamaño disponible.
- **Evita scroll interno:** El widget debe mostrar información resumen. Si hay mucho contenido, el usuario debería abrir el módulo completo.

### 10.2 Slots Disponibles

| Slot | Ubicación |
|------|-----------|
| `dashboard_top` | Encima del contenido principal del Dashboard |
| `dashboard_main` | Área principal de widgets |
| `dashboard_sidebar` | Sidebar lateral del Dashboard |
| `dashboard_bottom` | Debajo del contenido principal |
| `user_profile_tab` | Tab en perfil de usuario |
| `settings_tab` | Tab en configuración (para ajustes del módulo) |

### 10.3 Widget de Configuración

```typescript
window.hubbi.widgets.register({
  slotName: 'settings_tab',
  moduleId: 'com.example.invoice',
  component: InvoiceSettingsTab,
  priority: 10
});

function InvoiceSettingsTab() {
  const [apiKey, setApiKey] = useState('');
  
  useEffect(() => {
    window.hubbi.settings.get('api_key').then(v => setApiKey(v || ''));
  }, []);
  
  const save = async () => {
    await window.hubbi.settings.set('api_key', apiKey);
    window.hubbi.notify('Configuración guardada', 'success');
  };
  
  return (
    <div className="p-6 space-y-4">
      <h2 className="text-xl font-semibold">Configuración de Facturación</h2>
      <div>
        <label className="block text-sm font-medium mb-1">API Key</label>
        <input 
          type="password"
          value={apiKey} 
          onChange={e => setApiKey(e.target.value)}
          className="w-full px-3 py-2 bg-hubbi-muted border border-hubbi-border rounded-lg"
        />
      </div>
      <button 
        onClick={save}
        className="px-4 py-2 bg-hubbi-primary text-hubbi-primary-fg rounded-lg"
      >
        Guardar
      </button>
    </div>
  );
}
```

---

## 11. Comunicación entre Módulos

### 11.1 Verificar si otro Módulo está Instalado

```typescript
const isInventoryInstalled = await window.hubbi.modules.isInstalled('com.hubbi.inventory');

if (!isInventoryInstalled) {
  window.hubbi.notify('Se requiere el módulo de Inventario', 'error');
  return;
}
```

### 11.2 Leer Datos de otro Módulo

```typescript
// Leer productos del módulo de inventario
const products = await window.hubbi.db.query(
  'SELECT * FROM com_hubbi_inventory_items WHERE stock > 0',
  [],
  { moduleId: 'com.example.invoice' }
);
```

### 11.3 Exponer Funciones (API Pública)

```typescript
// Tu módulo expone una función
window.hubbi.modules.expose('getTotalSales', async (dateRange: { from: string; to: string }) => {
  const result = await window.hubbi.db.query(
    `SELECT SUM(total) as total FROM com_example_invoice_headers 
     WHERE status = 'paid' AND issued_at BETWEEN $1 AND $2`,
    [dateRange.from, dateRange.to],
    { moduleId: 'com.example.invoice' }
  );
  return result[0]?.total || 0;
});
```

### 11.4 Llamar Funciones de otro Módulo

```typescript
// Otro módulo llama tu función
const total = await window.hubbi.modules.call<number>(
  'com.example.invoice',
  'getTotalSales',
  { from: '2024-01-01', to: '2024-12-31' }
);
```

### 11.5 Eventos Personalizados entre Módulos

```typescript
// Módulo A: Emitir evento personalizado (Signal Bus)
window.hubbi.events.dispatch('com.example.invoice:paid', {
  invoiceId: 123, 
  amount: 500 
});

// Módulo B: Escuchar evento (Signal Bus)
const unsubscribe = window.hubbi.events.on('com.example.invoice:paid', (event) => {
  const { invoiceId, amount } = event.payload;
  updateAccountBalance(amount);
});
```

> [!TIP]
> Usa `dispatch` para eventos efímeros que no necesitan persistencia en Base de Datos (ej: actualizaciones de UI, señales de coordinación). Para datos críticos, usa tablas DB.
```

---

## 12. Build & Publicación

### 12.1 Compilar el Módulo

```bash
# Instalar dependencias
pnpm install

# Compilar (genera dist/index.umd.js)
pnpm run build

# Type-check (sin emitir)
pnpm run typecheck
```

### 12.2 Calcular Hash de Integridad

El hash SHA256 es necesario para verificación de seguridad.

**PowerShell (Windows):**
```powershell
(Get-FileHash -Algorithm SHA256 .\dist\index.umd.js).Hash.ToLower()
```

**Bash (Linux/Mac):**
```bash
sha256sum dist/index.umd.js | cut -d' ' -f1
```

### 12.3 Actualizar manifest.json

```json
{
  "meta": {
    "entry_point": "dist/index.umd.js",
    "integrity": "a1b2c3d4e5f6g7h8i9j0..."
  }
}
```

### 12.4 Crear Paquete .hubbi

```bash
# Desde la raíz del proyecto del módulo
# Crear ZIP sin compresión con extensión .hubbi

# PowerShell
Compress-Archive -Path manifest.json, dist, sql -DestinationPath com.example.invoice.hubbi

# O manualmente: Seleccionar archivos → "Enviar a" → "Carpeta comprimida"
# Renombrar .zip a .hubbi
```

### 12.5 Estructura Final del Paquete

```
com.example.invoice.hubbi (ZIP)
├── manifest.json
├── dist/
│   └── index.umd.js
└── sql/
    └── install.sql
```

### 12.6 Instalación Local (Desarrollo)

1. Abre Hubbi
2. Ve a **Módulos → Tienda**
3. Click en **"Importar desde archivo"**
4. Selecciona tu archivo `.hubbi`


### 12.7 Publicación en el Registro (Core)

Para que tu módulo aparezca en la Tienda Oficial, debes clonar el repositorio `Hubbi_Modules` y agregar tu entrada en `modules.json`:

```json
{
  "id": "com.example.invoice",
  "name": "Facturación Pro",
  "version": "1.0.0",
  "url": "https://.../download/com.example.invoice.hubbi",
  "icon": "FileText",
  "description": "Breve descripción...",
  "size": 2560000,
  "readme": "# Título\n\nContenido del README en formato Markdown..."
}
```

> [!IMPORTANT]
> - **size:** Tamaño del archivo `.hubbi` en bytes (obligatorio para mostrar peso).
> - **readme:** Contenido Markdown completo o resumido (obligatorio para la vista "Ver más detalles" en la tienda).
>
> ### 12.8 Gestión de Dependencias (Online)
>
> Para que la Tienda detecte y valide dependencias antes de la instalación, debes declararlas en el **cuerpo del Release de GitHub** (o en tu README si este se usa como cuerpo).
>
> Usa el siguiente formato estándar (case-insensitive):
>
> ```text
> Dependencies: com.hubbi.inventory, com.hubbi.auth
> Optional Dependencies: com.hubbi.reports, com.hubbi.analytics
> ```
>
> - **Dependencies:** El usuario recibirá una advertencia amarilla si intenta instalar tu módulo sin tener estos módulos previos.
> - **Optional Dependencies:** Se mostrarán en una caja azul de información en los detalles del módulo, pero no bloquearán ni advertirán durante la instalación.

---

## 13. Seguridad

### 13.1 Verificación de Integridad

El hash SHA256 en `manifest.meta.integrity` se verifica al cargar el módulo. Si el hash no coincide, el módulo NO se carga.

```json
{
  "meta": {
    "integrity": "sha256hashdelarchivo..."
  }
}
```

### 13.2 SQL Parametrizado (OBLIGATORIO)

**NUNCA** concatenes valores directamente en SQL:

```typescript
// ❌ PELIGROSO - SQL Injection
const sql = `SELECT * FROM invoices WHERE id = '${userId}'`;

// ✅ CORRECTO - Parametrizado
const result = await window.hubbi.db.query(
  'SELECT * FROM invoices WHERE id = $1',
  [userId],
  { moduleId }
);
```

### 13.3 Sandbox de Filesystem

Los módulos SOLO pueden leer/escribir en su directorio asignado:
- Ruta: `%APPDATA%/hubbi/plugins/{moduleId}/data/`
- No hay acceso al sistema de archivos general

### 13.4 HTTP Whitelist

Las peticiones HTTP solo funcionan si el dominio está en la whitelist del manifiesto (configuración futura).

### 13.5 Limitaciones: Event Spoofing

> [!WARNING]
> Actualmente, el SDK permite a cualquier módulo emitir cualquier evento.
> **No confíes ciegamente en el origen de los eventos.**

- Si tu módulo escucha eventos críticos (ej. `payment:processed`), verifica el estado en la base de datos antes de actuar.
- No uses eventos de frontend como única fuente de verdad para lógica de negocio sensible.

## 14. Testing y Verificación de Calidad

Para que un módulo sea aceptado en el ecosistema de Hubbi, **debe pasar todas las verificaciones de calidad**. Esta sección describe los requisitos obligatorios y cómo implementarlos.

### 14.1 Comandos de Verificación

Tu módulo debe incluir y pasar estos scripts en `package.json`:

```json
{
  "scripts": {
    "dev": "vite build --watch",
    "build": "vite build",
    "typecheck": "tsc --noEmit",
    "lint": "eslint src --ext .ts,.tsx",
    "test": "vitest",
    "test:run": "vitest run",
    "verify": "pnpm typecheck && pnpm lint && pnpm test:run && pnpm build"
  }
}
```

> [!IMPORTANT]
> **El comando `pnpm verify` es obligatorio** y debe pasar sin errores antes de publicar.

### 14.2 Configuración de ESLint

Crea `eslint.config.js` en la raíz del módulo:

```javascript
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    plugins: {
      'react-hooks': reactHooks,
    },
    rules: {
      // OBLIGATORIO: No usar 'any'
      '@typescript-eslint/no-explicit-any': 'error',
      
      // OBLIGATORIO: Optimizar renders
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      
      // Calidad de código
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },
  {
    ignores: ['dist/**', 'node_modules/**'],
  }
);
```

### 14.3 Configuración de Vitest

Crea `vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules', 'dist', '**/*.d.ts'],
    },
  },
});
```

Crea `src/test/setup.ts`:

```typescript
import { vi } from 'vitest';

// Mock del SDK de Hubbi
Object.defineProperty(window, 'hubbi', {
  value: {
    register: vi.fn(),
    db: {
      query: vi.fn().mockResolvedValue([]),
      execute: vi.fn().mockResolvedValue({ rowsAffected: 0 }),
      insert: vi.fn().mockResolvedValue('new-id'),
      update: vi.fn().mockResolvedValue(1),
      delete: vi.fn().mockResolvedValue(1),
    },
    getContext: vi.fn().mockReturnValue({
      hubId: 1,
      hubName: 'Test Hub',
      userId: 'user-1',
      userName: 'Test User',
      moduleId: 'com.example.test',
      subHubId: 'sub-1',
      subHubName: 'Main',
      hubLogo: null,
    }),
    hasPermission: vi.fn().mockReturnValue(true),
    notify: vi.fn(),
    audit: vi.fn(),
    events: {
      on: vi.fn().mockReturnValue(() => {}),
      off: vi.fn(),
      once: vi.fn(),
      dispatch: vi.fn(),
    },
    settings: {
      get: vi.fn().mockResolvedValue(null),
      set: vi.fn().mockResolvedValue(undefined),
      getAll: vi.fn().mockResolvedValue({}),
    },
    system: {
      getTimezone: vi.fn().mockReturnValue('America/El_Salvador'),
      getDateTime: vi.fn().mockReturnValue(new Date().toISOString()),
      formatDate: vi.fn().mockImplementation((d) => new Date(d).toLocaleDateString()),
      formatTime: vi.fn().mockImplementation((d) => new Date(d).toLocaleTimeString()),
    },
  },
  writable: true,
});
```

### 14.4 Escribir Tests (Ejemplo)

Cada componente crítico debe tener tests. Crea `src/components/__tests__/InvoiceList.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import InvoiceList from '../InvoiceList';

describe('InvoiceList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render loading state initially', () => {
    render(<InvoiceList />);
    expect(screen.getByText(/cargando/i)).toBeInTheDocument();
  });

  it('should render invoices after loading', async () => {
    vi.mocked(window.hubbi.db.query).mockResolvedValueOnce([
      { id: '1', invoice_number: 'INV-001', customer_name: 'Cliente A', total: 100, status: 'issued' },
    ]);

    render(<InvoiceList />);

    await waitFor(() => {
      expect(screen.getByText('INV-001')).toBeInTheDocument();
      expect(screen.getByText('Cliente A')).toBeInTheDocument();
    });
  });

  it('should show empty state when no invoices', async () => {
    vi.mocked(window.hubbi.db.query).mockResolvedValueOnce([]);

    render(<InvoiceList />);

    await waitFor(() => {
      expect(screen.getByText(/no hay facturas/i)).toBeInTheDocument();
    });
  });

  it('should check permissions before showing create button', () => {
    vi.mocked(window.hubbi.hasPermission).mockReturnValue(false);

    render(<InvoiceList />);

    expect(screen.queryByText(/nueva factura/i)).not.toBeInTheDocument();
  });
});
```

### 14.5 Requisitos Mínimos de Cobertura

| Tipo | Mínimo Requerido |
|------|------------------|
| Componentes principales | 1 test por componente |
| Hooks personalizados | Tests para casos de éxito y error |
| Funciones de utilidad | Tests para edge cases |
| Operaciones de DB | Mock de respuestas exitosas y fallidas |

> [!CAUTION]
> Módulos sin tests serán rechazados en la revisión.

### 14.6 Dependencias de Testing

Añade estas dependencias de desarrollo:

```json
{
  "devDependencies": {
    "vitest": "^4.0.0",
    "@testing-library/react": "^16.0.0",
    "@testing-library/jest-dom": "^6.6.0",
    "jsdom": "^26.0.0",
    "eslint": "^9.0.0",
    "typescript-eslint": "^8.0.0",
    "eslint-plugin-react-hooks": "^5.0.0"
  }
}
```

### 14.7 Flujo de Verificación Completo

Antes de publicar, ejecuta:

```bash
# 1. Verificar tipos de TypeScript (0 errores)
pnpm typecheck

# 2. Verificar código con ESLint (0 errores, 0 warnings)
pnpm lint

# 3. Ejecutar tests (100% passing)
pnpm test
pnpm test run

# 4. Verificaciones de Rust (Si aplica)
cargo check
cargo clippy

# 5. Build final
pnpm build

# O todo junto:
pnpm verify
```

> [!WARNING]
> Si alguno de estos comandos falla, el módulo **no será aceptado** para publicación.

---

## 15. Checklist de Validación

Antes de publicar tu módulo, verifica:

### Código
- [ ] **Linting:** 0 warnings, 0 errors
- [ ] **Type Check:** No hay `any` en el código
- [ ] **Sin console.log:** Usa `if (import.meta.env.DEV) console.log(...)`

### Manifest
- [ ] `id`, `name`, `version`, `description` están presentes
- [ ] `meta.entry_point` apunta al archivo correcto
- [ ] `meta.integrity` contiene el hash SHA256 válido
- [ ] `icon` es un nombre válido de Lucide

### Base de Datos
- [ ] Tablas usan prefijo `{namespace}_`
- [ ] RLS habilitado en todas las tablas
- [ ] Script es idempotente (`IF NOT EXISTS`)
- [ ] Columna `hub_id` para multi-tenancy

### UI/UX
- [ ] Usa variables `var(--color-hubbi-*)` o clases Tailwind
- [ ] No usa emojis, solo iconos de Lucide
- [ ] Responsive y funciona en dark/light mode
- [ ] Micro-interacciones en elementos interactivos

### Seguridad
- [ ] SQL siempre parametrizado ($1, $2...)
- [ ] Permisos verificados antes de acciones sensibles
- [ ] Auditoría registrada para acciones importantes

### Build
- [ ] React externalizado (no incluido en bundle)
- [ ] Bundle genera archivo UMD único
- [ ] `.hubbi` contiene solo archivos necesarios

---

## 16. Licenciamiento y Monetización

Hubbi soporta un sistema de licenciamiento nativo que permite monetizar tus módulos o restringir funcionalidades avanzadas a ciertos niveles de suscripción.

### 16.1 Niveles de Licencia (Tiers)

El sistema maneja actualmente los siguientes niveles (ordenados de menor a mayor):

1. **`free`**: Licencia gratuita básica.
2. **`premium`**: Licencia de pago para profesionales/pymes.
3. **`enterprise`**: Licencia corporativa con funcionalidades completas.

### 16.2 Restricción de Instalación (Hard Limit)

Puedes definir en tu `manifest.json` el nivel mínimo requerido para **instalar** tu módulo. Si el usuario no tiene ese nivel, la tienda bloqueará la instalación.

```json
{
  "id": "com.example.advanced_analytics",
  "required_license": "premium"
}
```

> [!NOTE]
> Si especificas `premium`, usuarios con licencias `premium` o `enterprise` podrán instalarlo. Usuarios `free` no.

### 16.3 Verificación en Runtime (Soft Limit)

Si quieres permitir la instalación gratuita pero restringir ciertas características dentro del módulo (modelo Freemium), puedes verificar la licencia en tiempo de ejecución.

```typescript
const checkLicense = async () => {
  const status = await window.hubbi.system.getLicenseStatus();
  // status -> { valid: boolean, tier: 'free' | 'premium' | 'enterprise', max_hubs: number }

  if (status.tier === 'free') {
    // Mostrar banner de upgrade
    setShowUpgradeBanner(true);
    // Deshabilitar botón de exportación avanzada
    setCanExport(false);
  } else {
    // Habilitar características premium
    setCanExport(true);
  }
};
```

> [!TIP]
> **Mejor Práctica:** Diseña tu UI para degradarse elegantemente. En lugar de ocultar opciones, muéstralas deshabilitadas con un tooltip que explique que requieren una licencia superior.

---

## Apéndice A: Iconos Disponibles (Lucide)

Los más comunes para módulos:

| Icono | Nombre | Uso Sugerido |
|-------|--------|--------------|
| 📦 | `Package` | Inventario |
| 📄 | `FileText` | Facturación, Documentos |
| 💰 | `DollarSign` | Finanzas |
| 👥 | `Users` | Recursos Humanos |
| 📊 | `BarChart3` | Reportes |
| 🛒 | `ShoppingCart` | Ventas |
| 🔧 | `Settings` | Configuración |
| 📅 | `Calendar` | Agenda |
| 🏷️ | `Tag` | Etiquetas |
| 🔔 | `Bell` | Notificaciones |

Ver lista completa: [lucide.dev/icons](https://lucide.dev/icons)

---

## Apéndice B: Ejemplo de Módulo Mínimo

### manifest.json
```json
{
  "id": "com.example.hello",
  "name": "Hello World",
  "version": "1.0.0",
  "description": "Módulo de ejemplo",
  "kind": "app",
  "icon": "Smile",
  "meta": {
    "entry_point": "dist/index.umd.js"
  }
}
```

### src/index.tsx
```tsx
import React from 'react';
import { Smile } from 'lucide-react';

function HelloModule() {
  const ctx = window.hubbi.getContext();
  
  return (
    <div className="p-6 text-center">
      <Smile className="w-16 h-16 mx-auto text-hubbi-primary mb-4" />
      <h1 className="text-2xl font-bold">¡Hola, {ctx.userName}!</h1>
      <p className="text-hubbi-dim mt-2">Bienvenido al módulo de ejemplo</p>
    </div>
  );
}

if (window.hubbi) {
  window.hubbi.register('com.example.hello', HelloModule);
}

export default HelloModule;
```

---

> _"Construimos herramientas profesionales, no juguetes. La calidad es innegociable."_

---

## 17. Arquitectura ERP (Core vs. Module)

Para garantizar la escalabilidad y consistencia de Hubbi como un ERP serio, seguimos un patrón arquitectónico estricto de separación entre el **Core** y los **Módulos**.

### 17.1 Filosofía: Contract-First Design

El **Módulo** define los contratos (interfaces TypeScript) que necesita para operar, y el **Core** (Rust/Backend) se encarga de cumplirlos de manera inmutable y transaccional.

### 17.2 Separación de Responsabilidades

| Responsabilidad | Core (Motor) | Módulo (Negocio) |
| :--- | :--- | :--- |
| **Matemática Decimal** | ✅ Garante de precisión | ❌ Solicita cálculos |
| **Inmutabilidad** | ✅ Append-only logs | ❌ Define eventos |
| **Control de Stock** | ✅ Valida invariantes | ❌ Visualiza estados derivados |
| **Reglas de Negocio** | ❌ Ciego al negocio | ✅ Dueño del dominio |
| **Perfiles / Config** | ❌ Agstico | ✅ Define comportamientos |
| **UI / UX** | ❌ Provee primitivas | ✅ Implementa flujos |

### 17.3 Patrón de Diseño Obligatorio

1.  **Nunca calcules stock en el frontend:** El stock es una vista derivada de la suma de movimientos inmutables. Tu módulo debe solicitar el stock al Core, no calcularlo.
2.  **Movimientos Inmutables:** En lugar de "actualizar cantidad", tu módulo debe "emitir una intención de movimiento" (Movement Intent).
    *   *Incorrecto:* `UPDATE products SET stock = stock - 5 WHERE id = 1`
    *   *Correcto:* `INSERT INTO movements (type: 'OUT', qty: 5, reason: 'VENTA')`
3.  **Core-Agnostic Modules:** Tu módulo no debe asumir detalles de implementación del Core, solo confiar en que el Core hará cumplir las invariantes (ej. no permitir stock negativo si así se configuró).

### 17.4 Ejemplo de Flujo Correcto

1.  **UI (Módulo):** El usuario hace click en "Confirmar Venta".
2.  **Lógica (Módulo):** Valida reglas de negocio (¿Tiene permisos? ¿Está el periodo abierto?).
3.  **Evento (Módulo):** Construye un payload `InventoryMovement`.
4.  **Ejecución (Core):** El Core recibe el evento, valida invariantes numéricas (Decimal Math), persiste el movimiento y notifica el cambio.
5.  **Actualización (UI):** La UI reacciona al evento `plugin:data_changed` y muestra el nuevo stock derivado.

