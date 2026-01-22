export type ItemType = 'product' | 'service' | 'asset' | 'kit';
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
    options?: string[]; // stored as JSON array string in DB, parsed here
    default_value?: string;
    is_active: boolean;
}

// 1. Items
export interface InventoryItem {
    id: string;
    sku: string | null;
    name: string;
    description?: string;
    photo_url?: string;

    // Org
    category_id: string;
    group_id?: string;
    subgroup_id?: string;

    // Core
    type: ItemType;
    base_unit_id: string;
    purchase_unit_id?: string;

    // Flags
    is_active: boolean;
    is_saleable: boolean;
    is_purchasable: boolean;
    is_tax_exempt: boolean;
    has_expiration: boolean;
    has_warranty: boolean;

    // Financial
    cost_avg: number;
    price_base: number;

    // Dynamic Attributes
    attributes: Record<string, unknown>; // Keyed by CustomFieldDefinition.key_name

    // Asset Specific
    asset_meta?: {
        depreciation_method?: string;
        useful_life_years?: number;
    };

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

// 2. Locations
export interface InventoryLocation {
    id: string;
    name: string;
    type: 'warehouse' | 'zone' | 'rack' | 'shelf' | 'bin';
    parent_id?: string | null;
    wms_meta?: {
        x?: number; y?: number; z?: number;
        width?: number; height?: number; depth?: number;
        rotation?: number;
    };
}

// 3. Stock
export interface InventoryStock {
    item_id: string;
    location_id: string;
    quantity: number;
    min_stock: number;
    max_stock: number;
    alert_threshold?: number;
    last_count?: string;
}
