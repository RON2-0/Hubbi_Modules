export type InventoryItemType = 'simple' | 'kit' | 'serialized' | 'service' | 'asset';
export type InventoryItemStatus = 'available' | 'reserved' | 'damaged' | 'expired' | 'discontinued';
export type ABCClass = 'A' | 'B' | 'C';

export interface PriceEntry {
  name: string;
  price: number;
}

export interface InventoryItem {
  id: string;
  sku: string;
  barcode?: string;
  name: string;
  description?: string;

  // Media
  image_url?: string;

  // Classification
  category_id?: string;
  group_id?: string;
  brand?: string;
  model?: string;

  type: InventoryItemType;
  status: InventoryItemStatus;

  // Unit of measure
  primary_unit: string;
  allow_decimals: boolean;

  // Pricing
  price_base: number;
  price_list: PriceEntry[];
  tax_rate: number;
  is_tax_exempt: boolean;

  // Costing
  weighted_average_cost: number;
  last_cost: number;

  // Attributes (JSON)
  attributes: Record<string, string | number | boolean | undefined>;

  // Control
  is_active: boolean;
  is_internal_use_only: boolean;
  allow_negative_stock: boolean;

  // Cyclic counting
  abc_class: ABCClass;
  cyclic_count_frequency?: string;

  created_at: string;
  updated_at: string;
}

export interface InventoryStock {
  item_id: string;
  location_id: string;
  quantity: number;
  min_stock: number;
  max_stock: number;
  reorder_point: number;
  last_count_at?: string;
}

export interface InventoryLocation {
  id: string;
  name: string;
  parent_id?: string;
  kind: 'warehouse' | 'shelf' | 'bin' | 'truck' | 'virtual';

  // Contact info (for warehouses)
  address?: string;
  city?: string;
  phone?: string;
  email?: string;
  manager_id?: string;
  manager_name?: string;

  // Metadata
  sub_hub_id?: string;

  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface InventoryMovement {
  id: string;
  item_id: string;
  location_id: string;
  type: 'IN' | 'OUT' | 'ADJUST' | 'TRANSFER_IN' | 'TRANSFER_OUT';
  reason?: string;
  quantity: number;
  cost_at_moment: number;
  total_value: number;
  document_type?: string;
  document_number?: string;
  document_uuid?: string;
  created_by: string;
  created_at: string;
  sub_hub_id?: string;
}

export interface ProductGroup {
  id: string;
  name: string;
  description?: string;
  parent_id?: string;
  color?: string;
  icon?: string;
  is_active: boolean;
  sort_order: number;
}

export interface ProductCategory {
  id: string;
  name: string;
  description?: string;
  parent_id?: string;
  color?: string;
  icon?: string;
  default_tax_rate: number;
  is_exempt: boolean;
  is_active: boolean;
  sort_order: number;
}

export interface Currency {
  id: string;
  name: string;
  symbol: string;
  decimal_places: number;
  is_default: boolean;
  exchange_rate: number;
  is_active: boolean;
}

export interface UnitOfMeasure {
  id: string;
  name: string;
  abbreviation: string;
  allow_decimals: boolean;
  decimal_places: number;
  category: 'quantity' | 'weight' | 'volume' | 'length';
  is_active: boolean;
  sort_order: number;
}

export interface PriceList {
  id: string;
  name: string;
  description?: string;
  currency_id: string;
  markup_percentage: number;
  discount_percentage: number;
  valid_from?: string;
  valid_until?: string;
  is_default: boolean;
  is_active: boolean;
}
