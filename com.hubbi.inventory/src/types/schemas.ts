/**
 * Product Form Schemas - Dynamic Field Definitions
 * 
 * This file defines the dynamic fields that appear in the product form
 * based on the selected product type. Allows the same form to work for:
 * - Simple products (retail, bookstores)
 * - Vehicles/Assets (dealerships, workshops)
 * - Medicine/Perishables (hospitals, pharmacies)
 * - Kits/Assemblies (manufacturing, workshops)
 */

export type AttributeType = 'text' | 'number' | 'date' | 'select' | 'boolean' | 'textarea';

export interface AttributeField {
    key: string;
    label: string;
    type: AttributeType;
    options?: string[];
    required?: boolean;
    placeholder?: string;
    helpText?: string;
}

// Product types available in the system
export const PRODUCT_TYPES = [
    { id: 'simple', label: 'Producto Simple', icon: 'Box', description: 'Repuestos, consumibles, productos estándar' },
    { id: 'serialized', label: 'Serializado', icon: 'Barcode', description: 'Equipos con número de serie único' },
    { id: 'kit', label: 'Kit / Combo', icon: 'Package', description: 'Conjunto de productos que se venden juntos' },
    { id: 'asset', label: 'Activo Fijo', icon: 'Truck', description: 'Vehículos, maquinaria, equipos de alto valor' },
    { id: 'service', label: 'Servicio', icon: 'Wrench', description: 'Mano de obra, servicios sin stock físico' },
] as const;

// Status options for products
export const PRODUCT_STATUS = [
    { id: 'available', label: 'Disponible', color: 'green' },
    { id: 'reserved', label: 'Reservado', color: 'yellow' },
    { id: 'damaged', label: 'Dañado', color: 'red' },
    { id: 'expired', label: 'Vencido', color: 'orange' },
    { id: 'discontinued', label: 'Descontinuado', color: 'gray' },
] as const;

// Dynamic field schemas per product type
export const PRODUCT_SCHEMAS: Record<string, AttributeField[]> = {
    simple: [
        { key: 'location_rack', label: 'Ubicación (Estante)', type: 'text', placeholder: 'Ej: Pasillo A-2' },
        { key: 'min_stock_alert', label: 'Alerta Stock Mínimo', type: 'number', placeholder: '0' },
        { key: 'weight', label: 'Peso (kg)', type: 'number', placeholder: '0.00' },
        { key: 'dimensions', label: 'Dimensiones (LxAxH cm)', type: 'text', placeholder: 'Ej: 10x5x3' },
    ],

    serialized: [
        { key: 'serial_number', label: 'Número de Serie', type: 'text', required: true },
        { key: 'warranty_months', label: 'Meses de Garantía', type: 'number', placeholder: '12' },
        { key: 'warranty_expiry', label: 'Vencimiento Garantía', type: 'date' },
        { key: 'manufacturer', label: 'Fabricante', type: 'text' },
        { key: 'model_number', label: 'Número de Modelo', type: 'text' },
    ],

    asset: [
        { key: 'vin', label: 'VIN / Número de Chasis', type: 'text', required: true, placeholder: '17 caracteres' },
        { key: 'engine_number', label: 'Número de Motor', type: 'text', required: true },
        { key: 'license_plate', label: 'Placa', type: 'text' },
        { key: 'year', label: 'Año', type: 'number', placeholder: '2024' },
        { key: 'color', label: 'Color', type: 'text' },
        { key: 'fuel_type', label: 'Combustible', type: 'select', options: ['Diesel', 'Gasolina', 'Eléctrico', 'Híbrido', 'GLP'] },
        { key: 'mileage', label: 'Kilometraje', type: 'number', placeholder: '0' },
        { key: 'import_policy', label: 'Póliza de Importación', type: 'text' },
        { key: 'acquisition_date', label: 'Fecha de Adquisición', type: 'date' },
        { key: 'last_maintenance', label: 'Último Mantenimiento', type: 'date' },
        { key: 'notes', label: 'Notas Adicionales', type: 'textarea' },
    ],

    kit: [
        { key: 'is_preassembled', label: '¿Pre-ensamblado?', type: 'boolean' },
        { key: 'compatibility', label: 'Compatibilidad', type: 'text', placeholder: 'Ej: Motores Cummins ISX' },
        { key: 'assembly_time', label: 'Tiempo de Ensamblaje (min)', type: 'number' },
        { key: 'instructions', label: 'Instrucciones', type: 'textarea' },
    ],

    medicine: [
        { key: 'batch_number', label: 'Número de Lote', type: 'text', required: true },
        { key: 'expiry_date', label: 'Fecha de Vencimiento', type: 'date', required: true },
        { key: 'active_ingredient', label: 'Componente Activo', type: 'text' },
        { key: 'dosage', label: 'Dosis', type: 'text', placeholder: 'Ej: 500mg' },
        { key: 'storage_temp', label: 'Temperatura de Almacenamiento', type: 'select', options: ['Ambiente', 'Refrigerado (2-8°C)', 'Congelado (-20°C)'] },
        { key: 'requires_prescription', label: 'Requiere Receta', type: 'boolean' },
    ],

    service: [
        { key: 'duration_hours', label: 'Duración Estimada (horas)', type: 'number' },
        { key: 'requires_appointment', label: 'Requiere Cita', type: 'boolean' },
        { key: 'technician_level', label: 'Nivel de Técnico', type: 'select', options: ['Básico', 'Intermedio', 'Avanzado', 'Especialista'] },
    ],
};

// Unit of measure options
export const UNITS_OF_MEASURE = [
    { id: 'unit', label: 'Unidad', abbreviation: 'ud' },
    { id: 'box', label: 'Caja', abbreviation: 'caja' },
    { id: 'pack', label: 'Paquete', abbreviation: 'paq' },
    { id: 'kg', label: 'Kilogramo', abbreviation: 'kg' },
    { id: 'g', label: 'Gramo', abbreviation: 'g' },
    { id: 'lb', label: 'Libra', abbreviation: 'lb' },
    { id: 'l', label: 'Litro', abbreviation: 'L' },
    { id: 'ml', label: 'Mililitro', abbreviation: 'mL' },
    { id: 'gal', label: 'Galón', abbreviation: 'gal' },
    { id: 'm', label: 'Metro', abbreviation: 'm' },
    { id: 'cm', label: 'Centímetro', abbreviation: 'cm' },
    { id: 'ft', label: 'Pie', abbreviation: 'ft' },
    { id: 'pair', label: 'Par', abbreviation: 'par' },
    { id: 'dozen', label: 'Docena', abbreviation: 'doc' },
    { id: 'set', label: 'Juego', abbreviation: 'jgo' },
] as const;

// Cyclic counting configuration options
export const CYCLIC_COUNT_FREQUENCIES = [
    { id: 'daily', label: 'Diario', days: 1 },
    { id: 'weekly', label: 'Semanal', days: 7 },
    { id: 'biweekly', label: 'Quincenal', days: 14 },
    { id: 'monthly', label: 'Mensual', days: 30 },
    { id: 'quarterly', label: 'Trimestral', days: 90 },
    { id: 'biannual', label: 'Semestral', days: 180 },
    { id: 'annual', label: 'Anual', days: 365 },
] as const;

// Categories for organizing products (can be extended by user)
export const DEFAULT_CATEGORIES = [
    { id: 'parts', label: 'Repuestos', icon: 'Cog' },
    { id: 'consumables', label: 'Consumibles', icon: 'Droplet' },
    { id: 'tools', label: 'Herramientas', icon: 'Wrench' },
    { id: 'vehicles', label: 'Vehículos', icon: 'Truck' },
    { id: 'electronics', label: 'Electrónicos', icon: 'Cpu' },
    { id: 'office', label: 'Oficina', icon: 'FileText' },
    { id: 'maintenance', label: 'Mantenimiento', icon: 'Tool' },
    { id: 'safety', label: 'Seguridad', icon: 'Shield' },
] as const;

/**
 * Get the schema for a given product type
 */
export function getSchemaForType(type: string): AttributeField[] {
    return PRODUCT_SCHEMAS[type] || PRODUCT_SCHEMAS.simple;
}

/**
 * Validate attributes against schema
 */
export function validateAttributes(type: string, attributes: Record<string, unknown>): { valid: boolean; errors: string[] } {
    const schema = getSchemaForType(type);
    const errors: string[] = [];

    for (const field of schema) {
        if (field.required && !attributes[field.key]) {
            errors.push(`${field.label} es requerido`);
        }
    }

    return { valid: errors.length === 0, errors };
}
