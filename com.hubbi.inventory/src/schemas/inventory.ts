import { z } from 'zod';

// Product schema with proper type inference
export const productSchema = z.object({
    name: z.string().min(3, "El nombre debe tener al menos 3 caracteres").max(100, "Nombre demasiado largo"),
    sku: z.string().max(50, "SKU demasiado largo").optional().nullable(),
    description: z.string().max(500, "Descripción demasiado larga").optional().nullable(),
    type: z.enum(['product', 'service', 'asset', 'kit']),
    base_unit_id: z.string().min(1, "Debes seleccionar una unidad de medida"),
    price_base: z.number().min(0, "El precio no puede ser negativo"),
    cost_avg: z.number().min(0, "El costo no puede ser negativo"),
    photo_url: z.string().url("Ingresa una URL de imagen válida").or(z.literal("")).optional().nullable(),
    is_saleable: z.boolean().default(true),
    is_purchasable: z.boolean().default(true),
    is_tax_exempt: z.boolean().default(false),
    has_expiration: z.boolean().default(false),
    has_warranty: z.boolean().default(false),
    category_id: z.string().optional().nullable(),
});

// Warehouse schema with proper type inference
export const warehouseSchema = z.object({
    name: z.string().min(3, "El nombre de la bodega debe tener al menos 3 caracteres"),
    sub_hub_id: z.string().min(1, "Debes seleccionar una sucursal válida"),
    address: z.string().max(200, "Dirección demasiado larga").optional().nullable(),
    phone: z.string().max(20, "Teléfono demasiado largo").optional().nullable(),
    responsible_user_id: z.string().optional().nullable(),
    is_active: z.boolean().default(true),
});

// Export inferred types
export type ProductFormData = z.infer<typeof productSchema>;
export type WarehouseFormData = z.infer<typeof warehouseSchema>;
