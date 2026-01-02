/**
 * Suppliers Manager Component
 *
 * CRUD interface for managing product suppliers.
 */

import { useState, useEffect, useCallback } from 'react';
import { Users, Plus, Edit, Trash2, Search, Phone, Mail, X, Save } from 'lucide-react';
import { hubbi } from '../hubbi-sdk.d';

interface Supplier {
    id: string;
    hub_id: number;
    name: string;
    contact_name: string | null;
    email: string | null;
    phone: string | null;
    address: string | null;
    notes: string | null;
    is_active: boolean;
    created_at: string;
}

interface SupplierFormData {
    name: string;
    contact_name: string;
    email: string;
    phone: string;
    address: string;
    notes: string;
}

const emptyForm: SupplierFormData = {
    name: '',
    contact_name: '',
    email: '',
    phone: '',
    address: '',
    notes: ''
};

export const SuppliersManager = () => {
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState<SupplierFormData>(emptyForm);
    const [saving, setSaving] = useState(false);

    const fetchSuppliers = useCallback(async () => {
        setLoading(true);
        const data = await hubbi.db.query(
            `SELECT * FROM com_hubbi_inventory_suppliers ORDER BY name ASC`,
            [],
            { moduleId: 'com.hubbi.inventory' }
        );
        setSuppliers(data as Supplier[]);
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchSuppliers();
    }, [fetchSuppliers]);

    const filteredSuppliers = suppliers.filter(s =>
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.contact_name?.toLowerCase().includes(search.toLowerCase()) ||
        s.email?.toLowerCase().includes(search.toLowerCase())
    );

    const openForm = (supplier?: Supplier) => {
        if (supplier) {
            setEditingId(supplier.id);
            setForm({
                name: supplier.name,
                contact_name: supplier.contact_name || '',
                email: supplier.email || '',
                phone: supplier.phone || '',
                address: supplier.address || '',
                notes: supplier.notes || ''
            });
        } else {
            setEditingId(null);
            setForm(emptyForm);
        }
        setShowForm(true);
    };

    const closeForm = () => {
        setShowForm(false);
        setEditingId(null);
        setForm(emptyForm);
    };

    const handleSubmit = async () => {
        if (!form.name.trim()) {
            hubbi.notify('El nombre es requerido', 'warning');
            return;
        }

        setSaving(true);
        const context = hubbi.getContext();

        if (editingId) {
            // Update
            await hubbi.db.execute(
                `UPDATE com_hubbi_inventory_suppliers SET 
                    name = $1, contact_name = $2, email = $3, phone = $4, address = $5, notes = $6
                 WHERE id = $7`,
                [form.name, form.contact_name || null, form.email || null, form.phone || null, form.address || null, form.notes || null, editingId],
                { moduleId: 'com.hubbi.inventory' }
            );
            hubbi.notify('Proveedor actualizado', 'success');
        } else {
            // Create - generate UUID in code for cross-DB compatibility
            const id = crypto.randomUUID();
            await hubbi.db.execute(
                `INSERT INTO com_hubbi_inventory_suppliers (id, hub_id, name, contact_name, email, phone, address, notes)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
                [id, context?.hubId || 1, form.name, form.contact_name || null, form.email || null, form.phone || null, form.address || null, form.notes || null],
                { moduleId: 'com.hubbi.inventory' }
            );
            hubbi.notify('Proveedor creado', 'success');
        }

        setSaving(false);
        closeForm();
        fetchSuppliers();
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Eliminar este proveedor?')) return;
        await hubbi.db.execute(
            `DELETE FROM com_hubbi_inventory_suppliers WHERE id = $1`,
            [id],
            { moduleId: 'com.hubbi.inventory' }
        );
        hubbi.notify('Proveedor eliminado', 'success');
        fetchSuppliers();
    };

    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-hubbi-text flex items-center gap-2">
                    <Users size={20} className="text-hubbi-primary" />
                    Proveedores
                </h2>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-hubbi-dim" size={18} />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Buscar..."
                            className="pl-10 pr-4 py-2 border border-hubbi-border rounded-lg bg-hubbi-input text-hubbi-text w-64"
                        />
                    </div>
                    <button
                        onClick={() => openForm()}
                        className="flex items-center gap-2 px-4 py-2 bg-hubbi-primary text-hubbi-primary-fg rounded-lg hover:opacity-90"
                    >
                        <Plus size={18} />
                        Nuevo Proveedor
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="flex-1 bg-hubbi-card rounded-xl border border-hubbi-border overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-hubbi-bg text-hubbi-dim text-sm">
                        <tr>
                            <th className="px-4 py-3 font-medium">Nombre</th>
                            <th className="px-4 py-3 font-medium">Contacto</th>
                            <th className="px-4 py-3 font-medium">Email</th>
                            <th className="px-4 py-3 font-medium">Teléfono</th>
                            <th className="px-4 py-3 font-medium text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-hubbi-border">
                        {loading ? (
                            <tr><td colSpan={5} className="text-center py-8 text-hubbi-dim">Cargando...</td></tr>
                        ) : filteredSuppliers.length === 0 ? (
                            <tr><td colSpan={5} className="text-center py-8 text-hubbi-dim">No hay proveedores</td></tr>
                        ) : (
                            filteredSuppliers.map(supplier => (
                                <tr key={supplier.id} className="hover:bg-hubbi-bg/50">
                                    <td className="px-4 py-3">
                                        <div className="font-medium text-hubbi-text">{supplier.name}</div>
                                    </td>
                                    <td className="px-4 py-3 text-hubbi-dim">{supplier.contact_name || '-'}</td>
                                    <td className="px-4 py-3">
                                        {supplier.email ? (
                                            <a href={`mailto:${supplier.email}`} className="text-hubbi-primary hover:underline flex items-center gap-1">
                                                <Mail size={14} /> {supplier.email}
                                            </a>
                                        ) : '-'}
                                    </td>
                                    <td className="px-4 py-3">
                                        {supplier.phone ? (
                                            <span className="flex items-center gap-1 text-hubbi-dim">
                                                <Phone size={14} /> {supplier.phone}
                                            </span>
                                        ) : '-'}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <button
                                            onClick={() => openForm(supplier)}
                                            className="p-1.5 hover:bg-hubbi-bg rounded text-hubbi-dim hover:text-hubbi-primary"
                                        >
                                            <Edit size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(supplier.id)}
                                            className="p-1.5 hover:bg-hubbi-bg rounded text-hubbi-dim hover:text-hubbi-danger ml-1"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Form Modal */}
            {showForm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-hubbi-card rounded-xl shadow-2xl w-full max-w-lg mx-4 border border-hubbi-border">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-hubbi-border">
                            <h3 className="text-lg font-semibold text-hubbi-text">
                                {editingId ? 'Editar Proveedor' : 'Nuevo Proveedor'}
                            </h3>
                            <button onClick={closeForm} className="p-1 hover:bg-hubbi-bg rounded">
                                <X size={20} className="text-hubbi-dim" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-hubbi-dim mb-1">Nombre *</label>
                                <input
                                    type="text"
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    className="w-full px-3 py-2 border border-hubbi-border rounded-lg bg-hubbi-input text-hubbi-text"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-hubbi-dim mb-1">Nombre de Contacto</label>
                                <input
                                    type="text"
                                    value={form.contact_name}
                                    onChange={(e) => setForm({ ...form, contact_name: e.target.value })}
                                    className="w-full px-3 py-2 border border-hubbi-border rounded-lg bg-hubbi-input text-hubbi-text"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-hubbi-dim mb-1">Email</label>
                                    <input
                                        type="email"
                                        value={form.email}
                                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                                        className="w-full px-3 py-2 border border-hubbi-border rounded-lg bg-hubbi-input text-hubbi-text"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-hubbi-dim mb-1">Teléfono</label>
                                    <input
                                        type="tel"
                                        value={form.phone}
                                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                                        className="w-full px-3 py-2 border border-hubbi-border rounded-lg bg-hubbi-input text-hubbi-text"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-hubbi-dim mb-1">Dirección</label>
                                <input
                                    type="text"
                                    value={form.address}
                                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                                    className="w-full px-3 py-2 border border-hubbi-border rounded-lg bg-hubbi-input text-hubbi-text"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-hubbi-dim mb-1">Notas</label>
                                <textarea
                                    value={form.notes}
                                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                                    rows={2}
                                    className="w-full px-3 py-2 border border-hubbi-border rounded-lg bg-hubbi-input text-hubbi-text resize-none"
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 px-6 py-4 border-t border-hubbi-border bg-hubbi-bg rounded-b-xl">
                            <button onClick={closeForm} className="px-4 py-2 text-hubbi-text hover:bg-hubbi-border rounded-lg">
                                Cancelar
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={saving}
                                className="flex items-center gap-2 px-4 py-2 bg-hubbi-primary text-hubbi-primary-fg rounded-lg hover:opacity-90 disabled:opacity-50"
                            >
                                <Save size={16} />
                                {saving ? 'Guardando...' : 'Guardar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
