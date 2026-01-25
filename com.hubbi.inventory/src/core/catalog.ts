import { MovementTypeConfig } from './types';

/**
 * OFFICIAL INVENTORY MOVEMENT CATALOG
 * These definitions are immutable. Logic must be derived from these configs.
 */

export const MOVEMENT_TYPES: Record<string, MovementTypeConfig> = {
    // ========================================================================
    // INBOUND (Entradas)
    // ========================================================================
    'PURCHASE_RECEIPT': {
        code: 'PURCHASE_RECEIPT',
        label: 'Recepción de Compra',
        direction: 'IN',
        description: 'Entrada de mercancía por compra a proveedor.',
        affects_cost: true, // New cost enters system
        is_system_generated: false,
        rules: [
            'require_target_location',
            'require_document_reference',
            'check_warehouse_active',
            'check_serial_uniqueness'
        ],
        reversible_by: 'PURCHASE_RETURN'
    },
    'RETURN_FROM_CUSTOMER': {
        code: 'RETURN_FROM_CUSTOMER',
        label: 'Devolución de Cliente',
        direction: 'IN',
        description: 'Reingreso de producto devuelto por cliente.',
        affects_cost: false, // Usually re-enters at preserved cost or current avg
        is_system_generated: false,
        rules: [
            'require_target_location',
            'require_reason',
            'check_warehouse_active'
        ]
    },
    'INITIAL_BALANCE': { // Migración / Setup
        code: 'INITIAL_BALANCE',
        label: 'Saldo Inicial',
        direction: 'IN',
        description: 'Carga inicial de inventario.',
        affects_cost: true,
        is_system_generated: false,
        rules: [
            'require_target_location',
            'check_serial_uniqueness'
        ]
    },

    // ========================================================================
    // OUTBOUND (Salidas)
    // ========================================================================
    'SALE_ISSUE': {
        code: 'SALE_ISSUE',
        label: 'Salida por Venta',
        direction: 'OUT',
        description: 'Descargo de inventario por venta facturada.',
        affects_cost: false, // Does not change unit cost
        is_system_generated: true, // Triggered by Invoice Module usually
        rules: [
            'require_source_location',
            'check_stock_availability',
            'check_warehouse_active',
            'check_lot_expiration'
        ],
        reversible_by: 'RETURN_FROM_CUSTOMER'
    },
    'PURCHASE_RETURN': {
        code: 'PURCHASE_RETURN',
        label: 'Devolución a Proveedor',
        direction: 'OUT',
        description: 'Salida de mercancía devuelta a proveedor.',
        affects_cost: false,
        is_system_generated: false,
        rules: [
            'require_source_location',
            'require_document_reference',
            'check_stock_availability'
        ]
    },
    'CONSUMPTION_INTERNAL': {
        code: 'CONSUMPTION_INTERNAL',
        label: 'Consumo Interno',
        direction: 'OUT',
        description: 'Gasto de material para uso propio (no venta).',
        affects_cost: false,
        is_system_generated: false,
        rules: [
            'require_source_location',
            'require_reason',
            'check_stock_availability'
        ]
    },
    'LOSS_AND_DAMAGE': {
        code: 'LOSS_AND_DAMAGE',
        label: 'Pérdida / Daño',
        direction: 'OUT',
        description: 'Descargo por merma, robo o destrucción.',
        affects_cost: false,
        is_system_generated: false,
        rules: [
            'require_source_location',
            'require_reason',
            'check_stock_availability' // Can't lose what you don't have
        ]
    },

    // ========================================================================
    // TRANSFERS (Traslados)
    // ========================================================================
    'TRANSFER_INTERNAL': {
        code: 'TRANSFER_INTERNAL',
        label: 'Traslado Interno',
        direction: 'NEUTRAL', // Requires FROM and TO
        description: 'Movimiento entre bodegas de la misma sucursal.',
        affects_cost: false,
        is_system_generated: false,
        rules: [
            'require_source_location',
            'require_target_location',
            'check_stock_availability',
            'check_warehouse_active'
        ]
    },

    // ========================================================================
    // ADJUSTMENTS (Correcciones)
    // ========================================================================
    'ADJUSTMENT_GAIN': {
        code: 'ADJUSTMENT_GAIN',
        label: 'Ajuste (Sobrante)',
        direction: 'IN',
        description: 'Corrección manual de inventario (ingreso).',
        affects_cost: true, // Needs cost estimation
        is_system_generated: false,
        rules: [
            'require_target_location',
            'require_reason'
        ]
    },
    'ADJUSTMENT_LOSS': {
        code: 'ADJUSTMENT_LOSS',
        label: 'Ajuste (Faltante)',
        direction: 'OUT',
        description: 'Corrección manual de inventario (salida).',
        affects_cost: false,
        is_system_generated: false,
        rules: [
            'require_source_location',
            'require_reason'
        ]
    }
};

export type MovementTypeCode = keyof typeof MOVEMENT_TYPES;
