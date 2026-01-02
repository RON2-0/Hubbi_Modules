/**
 * Custom Fields Editor Component
 *
 * Allows editing the JSONB `attributes` field on inventory items.
 * Dynamic form with add/remove key-value pairs.
 */

import { useState, useEffect } from 'react';
import { Plus, Trash2, Save, X, Tag } from 'lucide-react';
import { hubbi } from '../hubbi-sdk.d';

type FieldType = 'text' | 'number' | 'date' | 'boolean';

interface CustomField {
    key: string;
    value: string | number | boolean;
    type: FieldType;
}

interface CustomFieldsEditorProps {
    itemId: string;
    initialAttributes?: Record<string, unknown>;
    onSave?: (attributes: Record<string, unknown>) => void;
    onClose?: () => void;
}

export const CustomFieldsEditor = ({ itemId, initialAttributes, onSave, onClose }: CustomFieldsEditorProps) => {
    const [fields, setFields] = useState<CustomField[]>([]);
    const [saving, setSaving] = useState(false);

    // Parse initial attributes into fields
    useEffect(() => {
        if (initialAttributes) {
            const parsed: CustomField[] = Object.entries(initialAttributes).map(([key, value]) => ({
                key,
                value: value as string | number | boolean,
                type: typeof value === 'number' ? 'number'
                    : typeof value === 'boolean' ? 'boolean'
                        : (typeof value === 'string' && !isNaN(Date.parse(value)) && value.includes('-')) ? 'date'
                            : 'text'
            }));
            setFields(parsed);
        }
    }, [initialAttributes]);

    const addField = () => {
        setFields([...fields, { key: '', value: '', type: 'text' }]);
    };

    const removeField = (index: number) => {
        setFields(fields.filter((_, i) => i !== index));
    };

    const updateField = (index: number, updates: Partial<CustomField>) => {
        const newFields = [...fields];
        newFields[index] = { ...newFields[index], ...updates };

        // Convert value when type changes
        if (updates.type) {
            const currentVal = newFields[index].value;
            switch (updates.type) {
                case 'number':
                    newFields[index].value = parseFloat(String(currentVal)) || 0;
                    break;
                case 'boolean':
                    newFields[index].value = Boolean(currentVal);
                    break;
                case 'date':
                    newFields[index].value = new Date().toISOString().split('T')[0];
                    break;
                default:
                    newFields[index].value = String(currentVal);
            }
        }

        setFields(newFields);
    };

    const handleSave = async () => {
        // Validate: no empty keys, no duplicate keys
        const keys = fields.map(f => f.key.trim()).filter(Boolean);
        if (keys.length !== new Set(keys).size) {
            hubbi.notify('No puede haber claves duplicadas', 'warning');
            return;
        }

        setSaving(true);

        // Build attributes object
        const attributes: Record<string, unknown> = {};
        fields.forEach(f => {
            if (f.key.trim()) {
                attributes[f.key.trim()] = f.value;
            }
        });

        // Update in database
        await hubbi.db.execute(
            `UPDATE com_hubbi_inventory_items SET attributes = $1, updated_at = NOW() WHERE id = $2`,
            [JSON.stringify(attributes), itemId],
            { moduleId: 'com.hubbi.inventory' }
        );

        setSaving(false);
        hubbi.notify('Campos personalizados guardados', 'success');
        onSave?.(attributes);
        onClose?.();
    };

    const renderValueInput = (field: CustomField, index: number) => {
        switch (field.type) {
            case 'number':
                return (
                    <input
                        type="number"
                        value={field.value as number}
                        onChange={(e) => updateField(index, { value: parseFloat(e.target.value) || 0 })}
                        className="flex-1 px-3 py-2 border border-hubbi-border rounded-lg bg-hubbi-input text-hubbi-text"
                    />
                );
            case 'boolean':
                return (
                    <select
                        value={String(field.value)}
                        onChange={(e) => updateField(index, { value: e.target.value === 'true' })}
                        className="flex-1 px-3 py-2 border border-hubbi-border rounded-lg bg-hubbi-input text-hubbi-text"
                    >
                        <option value="true">Sí</option>
                        <option value="false">No</option>
                    </select>
                );
            case 'date':
                return (
                    <input
                        type="date"
                        value={String(field.value)}
                        onChange={(e) => updateField(index, { value: e.target.value })}
                        className="flex-1 px-3 py-2 border border-hubbi-border rounded-lg bg-hubbi-input text-hubbi-text"
                    />
                );
            default:
                return (
                    <input
                        type="text"
                        value={String(field.value)}
                        onChange={(e) => updateField(index, { value: e.target.value })}
                        placeholder="Valor..."
                        className="flex-1 px-3 py-2 border border-hubbi-border rounded-lg bg-hubbi-input text-hubbi-text"
                    />
                );
        }
    };

    return (
        <div className="bg-hubbi-card rounded-xl border border-hubbi-border shadow-sm">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-hubbi-border">
                <h2 className="text-lg font-semibold text-hubbi-text flex items-center gap-2">
                    <Tag size={20} className="text-hubbi-primary" />
                    Campos Personalizados
                </h2>
                {onClose && (
                    <button onClick={onClose} className="p-1 hover:bg-hubbi-bg rounded">
                        <X size={20} className="text-hubbi-dim" />
                    </button>
                )}
            </div>

            {/* Fields */}
            <div className="p-6 space-y-3 max-h-96 overflow-y-auto">
                {fields.length === 0 ? (
                    <div className="text-center py-8 text-hubbi-dim">
                        <Tag size={32} className="mx-auto mb-2 opacity-50" />
                        <p>No hay campos personalizados</p>
                        <p className="text-sm">Agrega campos para almacenar información adicional</p>
                    </div>
                ) : (
                    fields.map((field, idx) => (
                        <div key={idx} className="flex gap-2 items-center">
                            <input
                                type="text"
                                value={field.key}
                                onChange={(e) => updateField(idx, { key: e.target.value })}
                                placeholder="Nombre del campo..."
                                className="w-40 px-3 py-2 border border-hubbi-border rounded-lg bg-hubbi-input text-hubbi-text font-medium"
                            />
                            <select
                                value={field.type}
                                onChange={(e) => updateField(idx, { type: e.target.value as FieldType })}
                                className="w-28 px-2 py-2 border border-hubbi-border rounded-lg bg-hubbi-input text-hubbi-text text-sm"
                            >
                                <option value="text">Texto</option>
                                <option value="number">Número</option>
                                <option value="boolean">Sí/No</option>
                                <option value="date">Fecha</option>
                            </select>
                            {renderValueInput(field, idx)}
                            <button
                                onClick={() => removeField(idx)}
                                className="p-2 text-hubbi-danger hover:bg-hubbi-danger/10 rounded-lg"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    ))
                )}
            </div>

            {/* Footer */}
            <div className="flex justify-between px-6 py-4 border-t border-hubbi-border bg-hubbi-bg rounded-b-xl">
                <button
                    onClick={addField}
                    className="flex items-center gap-2 px-4 py-2 text-hubbi-text hover:bg-hubbi-border rounded-lg"
                >
                    <Plus size={18} />
                    Agregar Campo
                </button>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-4 py-2 bg-hubbi-primary text-hubbi-primary-fg rounded-lg hover:opacity-90 disabled:opacity-50"
                >
                    <Save size={16} />
                    {saving ? 'Guardando...' : 'Guardar'}
                </button>
            </div>
        </div>
    );
};
