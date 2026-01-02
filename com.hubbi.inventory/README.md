# Hubbi Inventory & WMS Module

**Module ID:** `com.hubbi.inventory`  
**Version:** 1.0.0  
**Bundle Size:** 195.74 kB (gzip: 49.88 kB)

---

## 📋 Descripción

Módulo completo de gestión de inventario y almacén (WMS) para Hubbi. Incluye control de stock multi-ubicación, kardex, reservaciones, traslados, kits/BOM, auditoría física, períodos fiscales y filtrado por sub-hub/sucursal.

---

## 🏗️ Arquitectura

### Comunicación con el Core

```
┌─────────────────────┐     ┌──────────────────────────────┐
│   Hubbi Core        │◄────│   com.hubbi.inventory        │
│                     │     │                              │
│ • hubbi.db          │     │ ┌──────────────────────────┐ │
│ • hubbi.notify      │     │ │ inventory-api.ts         │ │
│ • hubbi.permissions │     │ │ • recordMovement()       │ │
│ • hubbi.events      │     │ │ • createReservation()    │ │
│ • hubbi.audit       │     │ │ • consumeReservation()   │ │
│ • hubbi.widgets     │     │ │ • getStock()             │ │
│ • hubbi.modules     │     │ │ • checkAvailability()    │ │
│ • hubbi.settings    │     │ └──────────────────────────┘ │
│ • hubbi.auth        │     │                              │
└─────────────────────┘     └──────────────────────────────┘
```

### Comunicación Inter-Módulo

| Módulo Consumidor | Método Llamado | Descripción |
|-------------------|----------------|-------------|
| `com.hubbi.billing` | `checkAvailability` | Verificar stock antes de facturar |
| `com.hubbi.billing` | `recordMovement` | Descontar stock al facturar |
| `com.hubbi.workshop` | `createReservation` | Reservar materiales para OT |
| `com.hubbi.workshop` | `consumeReservation` | Consumir materiales usados |
| `com.hubbi.purchases` | `recordMovement` | Ingresar mercadería comprada |

---

## 📦 Componentes

### UI Components

| Componente | Descripción | Props |
|------------|-------------|-------|
| `ProductsTable` | Tabla de productos con filtros y búsqueda | `onEdit`, `onSelect` |
| `ProductForm` | Formulario de creación/edición de productos | `product`, `onSave`, `onCancel` |
| `KitsManager` | Gestión de kits/BOM con explosión | - |
| `MovementsHistory` | Kardex con filtros de fecha/tipo | `itemId?`, `locationId?` |
| `TransferDashboard` | Dashboard de traslados | - |
| `RemissionNote` | Generación de notas de remisión | `data` |
| `VisualWarehouse` | Mapa visual de bodegas | `warehouseId` |
| `MobileScanner` | Captura de códigos de barra | `onScan` |
| `PhysicalAudit` | Toma de inventario físico | - |
| `StockAlertsPanel` | Panel de alertas de stock bajo | `compact?` |
| `PeriodSelector` | Selector de período fiscal | `onChange?` |
| `SubHubSelector` | Selector de sucursal activa | `onChange?` |
| `QuickAdjust` | Ajuste rápido de cantidad | `onClose`, `onSuccess?` |
| `ExcelImport` | Importar desde Excel/CSV | `onClose`, `onSuccess?` |
| `ExcelExport` | Exportar a Excel/CSV | `onClose` |

### Hooks

| Hook | Descripción | Retorno |
|------|-------------|---------|
| `useInventoryActions` | Acciones CRUD y movimientos | `{ createItem, updateItem, recordMovement }` |
| `useInventoryMovements` | Historial de movimientos | `{ movements, loading, refresh }` |
| `useStockAlerts` | Alertas de stock bajo | `{ alerts, criticalCount, refresh }` |
| `useFiscalPeriods` | Gestión de períodos fiscales | `{ periods, currentPeriod, isPeriodEditable }` |
| `useSubHubFilter` | Filtrado por sub-hub | `{ activeSubHubId, canEditSubHub, getSubHubWhereClause }` |

---

## 🔐 Sistema de Permisos

### Permisos Definidos

| Permiso | Descripción |
|---------|-------------|
| `inventory.view` | Ver inventario |
| `inventory.edit` | Editar productos |
| `inventory.delete` | Eliminar productos |
| `inventory.view_costs` | Ver costos y valores |
| `inventory.adjust` | Realizar ajustes de inventario |
| `inventory.transfer` | Crear traslados |
| `inventory.approve_transfer` | Aprobar traslados |
| `inventory.view_all_subhubs` | Ver inventario de todas las sucursales |
| `inventory.edit_own_subhub` | Editar su propia sucursal |
| `inventory.edit_all_subhubs` | Editar cualquier sucursal |
| `inventory.switch_active_subhub` | Cambiar sucursal activa en UI |
| `inventory.close_period` | Cerrar períodos fiscales |

### Matriz de Acceso por Sub-Hub

```
Usuario asignado a SubHub "A":
├── Sin permisos adicionales → Solo ve/edita SubHub "A"
├── + view_all_subhubs → Ve todos, edita solo "A"
├── + edit_all_subhubs → Edita cualquier SubHub  
└── + switch_active_subhub → Puede cambiar en UI
```

### Integración con useSubHubFilter

```typescript
const { 
  canViewAll,      // Puede ver todas las sucursales
  canEditSubHub,   // Función: (subHubId) => boolean
  getSubHubWhereClause // Genera SQL WHERE para filtrado
} = useSubHubFilter();

// Ejemplo de uso en queries
const whereClause = getSubHubWhereClause('location.sub_hub_id');
// Retorna: "AND location.sub_hub_id = 'xxx'" o "" si puede ver todo
```

---

## 📊 Esquema de Base de Datos

### Tablas del Módulo

| Tabla | Descripción |
|-------|-------------|
| `com_hubbi_inventory_items` | Productos/artículos |
| `com_hubbi_inventory_categories` | Categorías |
| `com_hubbi_inventory_groups` | Grupos de productos |
| `com_hubbi_inventory_locations` | Bodegas/ubicaciones |
| `com_hubbi_inventory_stock` | Stock por item+ubicación |
| `com_hubbi_inventory_movements` | Historial de movimientos (Kardex) |
| `com_hubbi_inventory_reservations` | Reservaciones activas |
| `com_hubbi_inventory_lots` | Lotes/vencimientos |
| `com_hubbi_inventory_serials` | Números de serie |
| `com_hubbi_inventory_transfers` | Traslados entre bodegas |
| `com_hubbi_inventory_kits` | Kits/BOM |
| `com_hubbi_inventory_audits` | Auditorías físicas |
| `com_hubbi_inventory_audit_lines` | Líneas de auditoría |

### Tablas Compartidas (Períodos Fiscales)

| Tabla | Descripción |
|-------|-------------|
| `hubbi_fiscal_config` | Configuración de períodos |
| `hubbi_fiscal_periods` | Períodos fiscales |
| `hubbi_period_snapshots` | Snapshots de datos al cierre |

---

## 🔔 Sistema de Notificaciones

### Notificaciones Efímeras (hubbi.notify)

Usadas para feedback inmediato al usuario:

```typescript
hubbi.notify('Stock actualizado', 'success');
hubbi.notify('Error al guardar', 'error');
hubbi.notify('Stock bajo detectado', 'warning');
```

### Notificaciones Persistentes (hubbi.sendNotification)

Usadas para alertas que deben aparecer en el centro de notificaciones:

```typescript
// Se envía automáticamente al activar el módulo
await hubbi.sendNotification({
  title: '⚠️ Stock Crítico',
  message: '5 productos requieren reabastecimiento urgente',
  category: 'inventory',
  severity: 'warning',
  actionUrl: '/inventory/alerts'
});
```

**Nota:** Las notificaciones persistentes pueden expandirse para incluir `targetRoleIds` y `targetSubHubIds` en el Core.

---

## 📝 Sistema de Auditoría

### Eventos Auditados

Todas las operaciones críticas se registran en el audit trail del Core:

```typescript
// Ejemplo automático en inventory-api.ts
hubbi.audit?.({
  action: 'stock_out',
  entity: 'inventory_movement',
  entityId: movementId,
  description: 'Salida de 10 unidades - Venta'
});
```

| Acción | Descripción |
|--------|-------------|
| `reservation_created` | Reservación creada |
| `reservation_consumed` | Reservación consumida |
| `reservation_cancelled` | Reservación cancelada |
| `stock_in` | Entrada de inventario |
| `stock_out` | Salida de inventario |
| `stock_adjust` | Ajuste de inventario |
| `transfer_requested` | Traslado solicitado |
| `transfer_approved` | Traslado aprobado |
| `period_closed` | Período cerrado |

---

## ⚠️ Danger Zones (Revalidación de Identidad)

Operaciones que requieren que el usuario reingrese su contraseña:

| Operación | Condición |
|-----------|-----------|
| Ajuste rápido | Cantidad > 100 unidades |
| Importación Excel | Siempre |
| Cierre de período | Siempre |
| Eliminación de producto | Tiene movimientos históricos |

### Implementación

```typescript
// En QuickAdjust.tsx
if (quantity > 100) {
  const confirmed = await hubbi.auth.requireRevalidation?.(
    'Ajuste de inventario mayor a 100 unidades'
  );
  if (!confirmed) {
    hubbi.notify('Revalidación cancelada', 'warning');
    return;
  }
}
```

---

## 🔌 Widgets Registrados

| Slot | Componente | Prioridad |
|------|------------|-----------|
| `settings_tab` | InventorySettingsTab | 10 |
| `dashboard_widget` | InventoryDashboardWidget | 20 |
| `sidebar_item` | InventorySidebar | 30 |

---

## 📡 Eventos Emitidos

| Evento | Payload | Descripción |
|--------|---------|-------------|
| `inventory:stock:increased` | `{itemId, quantity, newStock}` | Stock aumentó |
| `inventory:stock:decreased` | `{itemId, quantity, newStock}` | Stock disminuyó |
| `inventory:reservation:created` | `{reservationId, itemId}` | Reservación creada |
| `inventory:reservation:consumed` | `{reservationId}` | Reservación consumida |
| `inventory:reservation:cancelled` | `{reservationId}` | Reservación cancelada |
| `inventory:item:created` | `{itemId, sku}` | Producto creado |
| `inventory:item:updated` | `{itemId}` | Producto actualizado |
| `inventory:transfer:requested` | `{transferId}` | Traslado solicitado |
| `inventory:transfer:approved` | `{transferId}` | Traslado aprobado |
| `inventory:transfer:received` | `{transferId}` | Traslado recibido |

### Suscripción a Eventos

```typescript
// En otro módulo
hubbi.events.on('inventory:stock:decreased', (event) => {
  console.log(`Stock de ${event.itemId} bajó a ${event.newStock}`);
});
```

---

## 🔄 Compatibilidad Multi-DB

El módulo es agnóstico de la base de datos. Usa `hubbi.db` que el Core implementa para:

| Backend | Soporte | Notas |
|---------|---------|-------|
| SQLite | ✅ | Modo offline |
| Supabase/PostgreSQL | ✅ | Con Realtime |
| AWS RDS | ✅ | PostgreSQL |
| Self-hosted PostgreSQL | ✅ | Sin Realtime |

### SQL Consideraciones

- Usa `ON CONFLICT` (compatible PostgreSQL/SQLite)
- Evita funciones específicas de motor
- IDs generados con `crypto.randomUUID()` (UUID v4)

---

## 📁 Estructura del Proyecto

```
com.hubbi.inventory/
├── manifest.json         # Permisos, dependencias, config
├── sql/
│   ├── install.sql       # Tablas del módulo
│   └── periods.sql       # Tablas compartidas (períodos)
├── src/
│   ├── api/
│   │   └── inventory-api.ts    # API inter-módulo
│   ├── components/
│   │   ├── ProductsTable.tsx
│   │   ├── ProductForm.tsx
│   │   ├── KitsManager.tsx
│   │   ├── MovementsHistory.tsx
│   │   ├── TransferDashboard.tsx
│   │   ├── RemissionNote.tsx
│   │   ├── VisualWarehouse.tsx
│   │   ├── MobileScanner.tsx
│   │   ├── PhysicalAudit.tsx
│   │   ├── StockAlertsPanel.tsx
│   │   ├── PeriodSelector.tsx
│   │   ├── SubHubSelector.tsx
│   │   ├── QuickAdjust.tsx
│   │   ├── ExcelImport.tsx
│   │   └── ExcelExport.tsx
│   ├── hooks/
│   │   ├── useInventoryActions.ts
│   │   ├── useInventoryMovements.ts
│   │   ├── useStockAlerts.ts
│   │   ├── useFiscalPeriods.ts
│   │   └── useSubHubFilter.ts
│   ├── logic/
│   │   └── inventory-core.ts
│   ├── integrations/
│   │   └── dte-integration.ts
│   ├── types/
│   │   ├── inventory.ts
│   │   └── schemas.ts
│   ├── utils/
│   │   └── export-utils.ts
│   ├── hubbi-sdk.d.ts    # Tipos del SDK
│   └── index.tsx         # Entry point
└── dist/
    └── index.umd.js      # Bundle producción
```

---

## 🚀 Uso

### Instalación

El módulo se instala desde el Hubbi Module Store o manualmente:

1. Subir `com.hubbi.inventory.zip` al Hub
2. El Core ejecuta `sql/install.sql` y `sql/periods.sql`
3. El módulo se activa llamando `onActivate()`

### Consumir desde otro módulo

```typescript
// Verificar disponibilidad
const availability = await hubbi.modules.call(
  'com.hubbi.inventory',
  'checkAvailability',
  { itemId: 'xxx', locationId: 'yyy', quantity: 10 }
);

// Registrar movimiento
const result = await hubbi.modules.call(
  'com.hubbi.inventory',
  'recordMovement',
  { 
    itemId: 'xxx', 
    locationId: 'yyy', 
    type: 'OUT', 
    reason: 'sale',
    quantity: 10,
    createdBy: userId,
    documentType: 'invoice',
    documentNumber: 'F-001'
  }
);
```

---

## 📈 Métricas

| Métrica | Valor |
|---------|-------|
| Componentes | 15 |
| Hooks | 5 |
| API Methods | 14 |
| Permisos | 13 |
| Tablas SQL | 25+ |
| Bundle | 195.74 kB |
| Gzip | 49.88 kB |

---

## 🔧 Desarrollo

```bash
# Instalar dependencias
pnpm install

# Desarrollo
pnpm dev

# Verificar (lint + typecheck + build)
pnpm verify

# Solo build
pnpm build
```

---

**Desarrollado para Hubbi** - Software Modular Multipropósito
