export type ItemKind = 'PRODUCT' | 'SERVICE' | 'ASSET';
export type ItemStatus = 'ACTIVE' | 'INACTIVE' | 'DRAFT' | 'ARCHIVED';
export type CustomFieldType = 'text' | 'number' | 'boolean' | 'select' | 'date';

// 0. Global configs
export interface UnitOfMeasure {
    id: string;
    name: string;
    symbol: string;
    is_active: boolean;
}

export interface CustomFieldDefinition {
    id: string;
    label: string;
    key_name: string;
    type: CustomFieldType;
    options?: string[];
    default_value?: string;
    is_active: boolean;
}

// 1. Items (Generic)
export interface InventoryItem {
    id: string;

    // Identity
    sku: string | null;
    name: string;
    description?: string;
    photo_url?: string;

    // Core Classification
    kind: ItemKind;
    status: ItemStatus;

    // Org
    category_id: string;
    group_id?: string;
    subgroup_id?: string;

    // Core Links
    base_unit_id: string;
    purchase_unit_id?: string;
    responsible_id?: string; // e.g. for Assets
    responsible_department_id?: number; // New: Dept responsibility

    // Financial
    price_base: number;
    cost_avg: number;

    // Flags / Behavioral
    is_saleable: boolean;
    is_purchasable: boolean;
    is_tax_exempt: boolean;
    has_expiration: boolean;
    has_warranty: boolean;
    is_kit: boolean; // New: Identifies if item is a Kit parent

    // Extensibility
    metadata?: Record<string, unknown>;
    attributes: Record<string, unknown>;

    created_at: string;
    updated_at: string;
}

// 1.1 Item UOMs
export interface ItemUOM {
    id: string;
    item_id: string;
    uom_id: string;
    conversion_factor: number;
    sale_price?: number;
    barcode?: string;
    is_default_sale: boolean;
}

// 1.2 Kits (Bill of Materials) - For Retail Bundles or Workshop Assemblies
export interface InventoryKitComponent {
    parent_item_id: string;
    child_item_id: string;
    quantity: number;
    // TBD: Effect on pricing/costing (Dynamic vs Fixed)
}

// 2. Warehouses
export interface InventoryWarehouse {
    id: string;
    name: string;

    // Datos de contacto
    address?: string;
    phone?: string;

    // Contexto Organizacional
    sub_hub_id: string; // Branch association (required)
    department_id?: string; // Dept association (UUID)

    // Responsable
    responsible_user_id?: string;

    // WMS metadata (coordenadas, dimensiones, etc.)
    wms_meta?: {
        x?: number; y?: number; z?: number;
        width?: number; height?: number; depth?: number;
        rotation?: number;
    };

    is_active?: boolean;
    created_at?: string;
}

// 3. Movements (The Truth)
// NOTE: Movements are append-only. No updates allowed.
export type MovementType = 'IN' | 'OUT' | 'TRANSFER' | 'ADJUSTMENT' | 'COUNT' | 'CONSUMPTION' | 'RESERVATION';

export interface InventoryMovement {
    id: string;

    // What
    item_id: string;
    quantity: string; // Decimal string
    type: MovementType;

    // Where
    from_warehouse_id?: string;
    to_warehouse_id?: string;
    department_id?: number; // New: Dept consumption tracking

    // Why
    reason?: string;
    reference_id?: string; // External ref (e.g. Invoice ID, WorkOrder ID)
    reference_type?: string;

    // Who / When
    created_at: string;
    created_by: string; // UserId

    // Audit
    reversed_by_movement_id?: string;
}

// 3.1 Reservations (Committed Stock) - Critical for Workshop/Orders
export interface InventoryReservation {
    id: string;
    item_id: string;
    quantity: string;

    // Who/Why
    reference_id: string; // e.g. WorkOrder ID
    reference_type: 'WORK_ORDER' | 'SALE_ORDER' | 'TRANSFER';
    reserved_by: string;
    created_at: string;

    // State
    status: 'ACTIVE' | 'CONSUMED' | 'CANCELLED';
    warehouse_id: string; // From where it is reserved
}

// 4. Stock State (Derived View)
export interface InventoryStockView {
    item_id: string;
    warehouse_id: string;

    quantity_on_hand: number; // Total physical count
    quantity_reserved: number; // Committed to orders/work
    quantity_available: number; // on_hand - reserved (What can be sold)

    min_stock: number;
    max_stock: number;
    alert_threshold?: number;
    last_count?: string;
}

// 5. Profiles & Settings
export enum InventoryProfile {
    GENERIC = 'GENERIC',
    RETAIL = 'RETAIL',
    WORKSHOP = 'WORKSHOP',
    RESTAURANT = 'RESTAURANT',
    PHARMACY = 'PHARMACY'
}

export type FeatureFlagKey =
    | 'serial_tracking'
    | 'batch_tracking'
    | 'expiration_dates'
    | 'negative_stock_allowed'
    | 'work_order_consumption'
    | 'asset_depreciation'
    | 'kits_enabled'
    | 'reservations_enabled';

export interface InventorySettings {
    profile: InventoryProfile;
    features: Record<FeatureFlagKey, boolean>;
    overridden: boolean;
    allowedDepartments?: number[]; // New: Access control list
}
