# Módulo de Inventario - Documentación Técnica

## Descripción General
El módulo `com.hubbi.inventory` proporciona gestión completa de inventarios para múltiples tipos de negocios.

---

## Arquitectura

```
com.hubbi.inventory/
├── manifest.json          # Metadatos, permisos, capabilities
├── sql/
│   ├── install.sql        # Schema principal (9 tablas)
│   └── periods.sql        # Períodos fiscales compartidos
├── src/
│   ├── index.tsx          # Entry point, registro de widgets
│   ├── components/        # Componentes React
│   │   ├── InventoryDashboard.tsx
│   │   ├── ProductsTable.tsx
│   │   ├── BarcodeGenerator.tsx
│   │   ├── StickerPrintDialog.tsx
│   │   ├── SuppliersManager.tsx
│   │   └── ...
│   ├── hooks/             # Custom hooks
│   │   ├── useSubHubFilter.ts
│   │   ├── useFiscalPeriods.ts
│   │   └── useInventoryActions.ts
│   └── logic/
│       └── InventoryEvents.ts
└── docs/
    └── README.md          # Esta documentación
```

---

## Tablas de Base de Datos

| Tabla | Descripción |
|-------|-------------|
| `com_hubbi_inventory_items` | Catálogo de productos |
| `com_hubbi_inventory_locations` | Ubicaciones/bodegas |
| `com_hubbi_inventory_stock` | Stock por ubicación |
| `com_hubbi_inventory_movements` | Kardex de movimientos |
| `com_hubbi_inventory_reservations` | Reservas internas |
| `com_hubbi_inventory_kits` | Composición de kits |
| `com_hubbi_inventory_traces` | Trazabilidad (lotes/series) |
| `com_hubbi_inventory_audits` | Auditorías físicas |
| `com_hubbi_inventory_suppliers` | Proveedores |

---

## Comunicación con el Core

### SDK Disponible (`window.hubbi`)

```typescript
// Base de datos
hubbi.db.query(sql, params, options)
hubbi.db.execute(sql, params, options)
hubbi.data.create({ table, data, options })
hubbi.data.update({ table, id, data, options })
hubbi.data.list({ table, options })

// Notificaciones
hubbi.notify(message, type)
hubbi.sendNotification({ userId, title, message, persistent })

// Configuración
hubbi.settings.get(key)
hubbi.settings.set(key, value)

// Permisos
hubbi.permissions.check(permission)
hubbi.permissions.has(permission)

// Contexto
hubbi.getContext() // { userId, hubId, activeSubHubId }

// Eventos
hubbi.events.on(event, handler)
hubbi.events.off(event, handler)
```

---

## Sistema de Eventos

### Eventos Emitidos
- `inventory:item:created`
- `inventory:item:updated`
- `inventory:stock:increased`
- `inventory:stock:decreased`

### Eventos Escuchados
- `billing:invoice_created` → Descuenta stock automáticamente

---

## Permisos Definidos

| Permiso | Descripción |
|---------|-------------|
| `inventory:access` | Acceso básico |
| `inventory:create` | Crear productos |
| `inventory:edit` | Editar productos |
| `inventory:delete` | Eliminar productos |
| `inventory:adjust` | Ajustes de inventario |
| `inventory:transfer` | Transferencias |
| `inventory:physical_audit` | Auditorías físicas |
| `inventory:view_all_subhubs` | Ver todas las sucursales |
| `inventory:close_period` | Cerrar períodos |
| `inventory:import` | Importar Excel |
| `inventory:export` | Exportar Excel |

---

## Multi-Sucursal (Sub-Hubs)

El módulo soporta múltiples sucursales mediante:
- Campo `sub_hub_id` en todas las tablas
- Hook `useSubHubFilter` para filtrado automático
- Permisos granulares por sucursal

---

## Online-First Strategy

Todas las operaciones usan `{ strategy: 'online_first' }`:
1. Intenta escribir en la nube primero
2. Si falla, guarda localmente
3. Sincroniza cuando recupera conexión

---

## Componentes Principales

### BarcodeGenerator
Genera códigos de barra (CODE128, EAN13, UPC, CODE39) usando jsbarcode.

### StickerPrintDialog
Imprime stickers con barcode, nombre y precio. Soporta 3 tamaños.

### DashboardEditor
Dashboard personalizable con widgets arrastrables (react-grid-layout).

### SuppliersManager
CRUD completo para gestión de proveedores.

### CustomFieldsEditor
Editor de campos personalizados (JSONB attributes).

---

## Integración con Otros Módulos

### Facturación (billing)
```javascript
// El módulo de facturación emite:
window.dispatchEvent(new CustomEvent('billing:invoice_created', {
    detail: {
        invoice_id: 'uuid',
        items: [{ item_id: 'uuid', quantity: 5, location_id?: 'uuid' }]
    }
}));

// Inventario escucha y descuenta stock automáticamente
```
