import React, { useState, useEffect, useMemo } from 'react';
import { Save, Briefcase, ShoppingBag, Stethoscope, Wrench, Check, AlertTriangle, RotateCcw, Loader2 } from 'lucide-react';

import { clsx } from 'clsx';
import { useInventorySettings } from '../../context/InventoryContext';
import { InventoryProfile, FeatureFlagKey } from '../../types/inventory';
import { Toggle } from '../../components/ui/Toggle';

const PROFILE_META: Record<InventoryProfile, { label: string; icon: React.ComponentType<{ className?: string; size?: number }>; description: string }> = {
    [InventoryProfile.GENERIC]: {
        label: 'Genérico',
        icon: Briefcase,
        description: 'Configuración estándar sin especialización.'
    },
    [InventoryProfile.RETAIL]: {
        label: 'Retail / Tienda',
        icon: ShoppingBag,
        description: 'Optimizado para ventas rápidas y rotación.'
    },
    [InventoryProfile.WORKSHOP]: {
        label: 'Taller',
        icon: Wrench,
        description: 'Gestión de servicios, repuestos y órdenes.'
    },
    [InventoryProfile.PHARMACY]: {
        label: 'Farmacia',
        icon: Stethoscope,
        description: 'Control estricto de lotes y vencimientos.'
    }
};

interface FeatureRowProps {
    feature?: FeatureFlagKey;
    label: string;
    description: string;
    checked: boolean;
    onChange: (val: boolean) => void;
}

const FeatureRow = React.memo(({ label, description, checked, onChange }: FeatureRowProps) => (
    <div className="flex items-center justify-between py-4 border-b border-hubbi-border last:border-0 group">
        <div>
            <div className="font-medium text-hubbi-text group-hover:text-hubbi-primary transition-colors">{label}</div>
            <div className="text-sm text-hubbi-dim">{description}</div>
        </div>
        <Toggle
            checked={checked}
            onChange={onChange}
        />
    </div>
));

export default function GeneralSettings() {
    // Store Hooks
    const profile = useInventorySettings(s => s.profile);
    const features = useInventorySettings(s => s.features);
    const overridden = useInventorySettings(s => s.overridden);
    const allowedDepartments = useInventorySettings(s => s.allowedDepartments || []);

    const setProfile = useInventorySettings(s => s.setProfile);
    const toggleFeature = useInventorySettings(s => s.toggleFeature);
    const resetToDefaults = useInventorySettings(s => s.resetToProfileDefaults);
    const setAllowedDepartments = useInventorySettings(s => s.setAllowedDepartments);

    // Ui State
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);
    const [allDepartments, setAllDepartments] = useState<{ id: string | number; name: string; sub_hub_id?: string | number }[]>([]);
    const [originalState, setOriginalState] = useState<SettingsSnapshot | null>(null);

    // Initial Load
    useEffect(() => {
        const load = async () => {
            try {
                // Fetch settings from Cloud
                const stored = await window.hubbi.settings.getAll('com.hubbi.inventory');

                // Build Features Object from cloud keys
                const loadedFeatures: Record<FeatureFlagKey, boolean> = { ...features };
                const settingsKeys = Object.keys(stored);

                // Try to find feature flags in cloud settings
                (Object.keys(loadedFeatures) as FeatureFlagKey[]).forEach(key => {
                    const settingKey = `feature_${key}`;
                    if (settingsKeys.includes(settingKey)) {
                        loadedFeatures[key] = stored[settingKey] === 'true';
                    }
                });

                const loadedProfile = (stored['profile'] as InventoryProfile) || InventoryProfile.GENERIC;
                const loadedDepts = stored['allowedDepartments'] ? JSON.parse(stored['allowedDepartments']) : [];

                // Sync Store with Cloud initially to avoid false dirty state on first load
                // (Optional: if we trust the persistent store, we might skip this, but safer to sync)
                // For now, we assume the store might be ahead or behind, but "Original" is what is in cloud.
                // NOTE: If we want "Draft" behavior, we only set Original here, we don't force update store yet.
                // But typically, on page load, we want to align with truth.

                // Let's set the snapshot
                setOriginalState({
                    profile: loadedProfile,
                    features: loadedFeatures,
                    allowedDepartments: loadedDepts
                });

                // Fetch Departments from Core
                const depts = await window.hubbi.departments.list() as { id: string | number; name: string; sub_hub_id?: string | number }[];
                const context = window.hubbi.getContext();

                // Filter departments by current subhub (include entries with no sub_hub_id as they are likely global)
                const filteredDepts = context?.subHubId
                    ? depts.filter((d) => !d.sub_hub_id || String(d.sub_hub_id) === String(context.subHubId))
                    : depts;

                setAllDepartments(filteredDepts);

            } catch (err) {
                console.error("Failed to load settings", err);
            } finally {
                setLoading(false);
            }
        };
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Dirty Checking
    const hasChanges = useMemo(() => {
        if (!originalState) return false;

        const profileChanged = profile !== originalState.profile;
        const deptsChanged = JSON.stringify(allowedDepartments.sort()) !== JSON.stringify(originalState.allowedDepartments.sort());

        // Deep compare features
        const featuresChanged = (Object.keys(features) as FeatureFlagKey[]).some(
            key => features[key] !== originalState.features[key]
        );

        return profileChanged || deptsChanged || featuresChanged;
    }, [profile, allowedDepartments, features, originalState]);

    const handleReset = () => {
        if (!originalState) return;
        setProfile(originalState.profile);
        setAllowedDepartments(originalState.allowedDepartments);

        // We have to iterate to reset features one by one or expose a 'setAllFeatures' in store
        // For now using toggleFeature loop is inefficient but works, OR better: update store directly if action exists.
        // The store logic for `setProfile` resets features to Defaults. we need to set them to CUSTOM state.
        // Let's assume hitting "Restablecer" just refreshes page or we add a bulk setter.
        // For Simplicity: We reload the page to discard local changes effectively.
        // OR better: Manually revert.

        (Object.keys(originalState.features) as FeatureFlagKey[]).forEach(key => {
            if (features[key] !== originalState.features[key]) {
                toggleFeature(key, originalState.features[key]);
            }
        });
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            // Save Profile
            await window.hubbi.settings.set('profile', profile, 'com.hubbi.inventory');

            // Save Allowed Departments
            await window.hubbi.settings.set('allowedDepartments', JSON.stringify(allowedDepartments), 'com.hubbi.inventory');

            // Save Features
            for (const [key, enabled] of Object.entries(features)) {
                await window.hubbi.settings.set(`feature_${key}`, String(enabled), 'com.hubbi.inventory');
            }

            // Update Snapshot
            setOriginalState({
                profile,
                features: { ...features },
                allowedDepartments: [...allowedDepartments]
            });

            window.hubbi.notify('Configuración guardada correctamente', 'success');
        } catch (err) {
            console.error(err);
            window.hubbi.notify('Error al guardar configuración', 'error');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-hubbi-dim animate-pulse">Cargando perfil...</div>;

    interface SettingsSnapshot {
        profile: InventoryProfile;
        features: Record<FeatureFlagKey, boolean>;
        allowedDepartments: (string | number)[];
    }

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-8 pb-32">

            {/* Header / Intro */}
            <div>
                <h2 className="text-2xl font-bold text-hubbi-text">Configuración de Inventario</h2>
                <p className="text-hubbi-dim mt-1">Define el comportamiento del módulo mediante Perfiles de Negocio.</p>
            </div>

            {/* Profile Selector */}
            <div className="space-y-3">
                {/* Reusing existing logic but keeping it cleaner */}
                <div className="flex justify-between items-center">
                    <h3 className="text-sm font-semibold text-hubbi-dim uppercase tracking-wider">Perfil de Negocio</h3>
                    {overridden && (
                        <div className="flex items-center gap-2 text-xs text-amber-500 bg-amber-500/10 px-2 py-1 rounded-md">
                            <AlertTriangle size={12} />
                            <span>Personalizado</span>
                            <button onClick={resetToDefaults} className="underline hover:text-amber-600 ml-1 flex items-center gap-1">
                                <RotateCcw size={10} /> Restaurar Defaults
                            </button>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {(Object.keys(PROFILE_META) as InventoryProfile[]).map(key => {
                        const meta = PROFILE_META[key];
                        const isSelected = profile === key;
                        const Icon = meta.icon;

                        return (
                            <button
                                key={key}
                                onClick={() => setProfile(key)}
                                className={clsx(
                                    "p-3 rounded-xl border text-left transition-all relative flex flex-col gap-2",
                                    isSelected
                                        ? "border-hubbi-primary bg-hubbi-primary/5 text-hubbi-primary ring-1 ring-hubbi-primary shadow-sm"
                                        : "border-hubbi-border bg-hubbi-card hover:border-hubbi-dim/50 text-hubbi-text hover:bg-hubbi-background"
                                )}
                            >
                                <div className="flex justify-between items-start">
                                    <Icon className={clsx("w-6 h-6", isSelected ? "text-hubbi-primary" : "text-hubbi-dim")} />
                                    {isSelected && <div className="bg-hubbi-primary text-white p-0.5 rounded-full"><Check size={10} /></div>}
                                </div>
                                <div>
                                    <span className="font-medium text-sm block">{meta.label}</span>
                                    <span className="text-xs text-hubbi-dim line-clamp-2 mt-0.5">{meta.description}</span>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Feature Flags */}
            <div className="space-y-3">
                <h3 className="text-sm font-semibold text-hubbi-dim uppercase tracking-wider">Capacidades Habilitadas</h3>
                <div className="bg-hubbi-card border border-hubbi-border rounded-xl px-6 divide-y divide-hubbi-border shadow-sm">

                    <FeatureRow
                        feature="expiration_dates"
                        label="Control de Vencimientos"
                        description="Requiere fecha de caducidad en entradas y salidas (FIFO/FEFO)."
                        checked={!!features.expiration_dates}
                        onChange={(val) => toggleFeature('expiration_dates', val)}
                    />

                    <FeatureRow
                        feature="serial_tracking"
                        label="Números de Serie (S/N)"
                        description="Rastreo individual de ítems únicos."
                        checked={!!features.serial_tracking}
                        onChange={(val) => toggleFeature('serial_tracking', val)}
                    />

                    <FeatureRow
                        feature="batch_tracking"
                        label="Lotes / Batches"
                        description="Agrupación de trazabilidad por lotes de fabricación."
                        checked={!!features.batch_tracking}
                        onChange={(val) => toggleFeature('batch_tracking', val)}
                    />

                    <FeatureRow
                        feature="work_order_consumption"
                        label="Consumo por Órdenes"
                        description="Permite descontar inventario mediante órdenes de trabajo o recetas."
                        checked={!!features.work_order_consumption}
                        onChange={(val) => toggleFeature('work_order_consumption', val)}
                    />

                    <FeatureRow
                        feature="asset_depreciation"
                        label="Gestión de Activos Fijos"
                        description="Habilita campos de depreciación y vida útil para bienes internos."
                        checked={!!features.asset_depreciation}
                        onChange={(val) => toggleFeature('asset_depreciation', val)}
                    />

                    <FeatureRow
                        feature="kits_enabled"
                        label="Kits & Compuestos"
                        description="Permite crear productos hijos (BOM) dentro de un padre (ej. Canastas, Paquetes)."
                        checked={!!features.kits_enabled}
                        onChange={(val) => toggleFeature('kits_enabled', val)}
                    />

                    <FeatureRow
                        feature="reservations_enabled"
                        label="Reservas de Stock"
                        description="Habilita el bloqueo de stock para Órdenes de Trabajo o Pedidos (Comprometido)."
                        checked={!!features.reservations_enabled}
                        onChange={(val) => toggleFeature('reservations_enabled', val)}
                    />

                    <FeatureRow
                        feature="negative_stock_allowed"
                        label="Permitir Stock Negativo"
                        description="AUTORIZAR movimientos de salida sin stock suficiente (No recomendado)."
                        checked={!!features.negative_stock_allowed}
                        onChange={(val) => toggleFeature('negative_stock_allowed', val)}
                    />

                </div>
            </div>

            {/* Department Access Control */}
            <div className="space-y-4">
                <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-hubbi-dim uppercase tracking-wider">Restricción de Acceso por Área</h3>
                    <div className="h-px flex-1 bg-hubbi-border"></div>
                </div>

                <div className="bg-hubbi-card border border-hubbi-border rounded-xl p-6 shadow-sm space-y-4">
                    <p className="text-sm text-hubbi-dim">
                        Selecciona los departamentos que tienen permiso para acceder a este módulo. Si no seleccionas ninguno, el acceso será **Universal** para todos los usuarios con el permiso `inventory.access`.
                    </p>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {allDepartments.length === 0 && (
                            <div className="col-span-full p-4 border border-dashed border-hubbi-border rounded-lg text-center text-hubbi-dim text-sm italic">
                                No se encontraron departamentos disponibles para configurar.
                                <br />Asegúrate de que Hubbi Core esté conectado.
                            </div>
                        )}
                        {allDepartments.map((dept) => {
                            const isAllowed = allowedDepartments.includes(dept.id);
                            return (
                                <button
                                    key={dept.id}
                                    onClick={() => {
                                        const newDepts = isAllowed
                                            ? allowedDepartments.filter((id: string | number) => id !== dept.id)
                                            : [...allowedDepartments, dept.id];
                                        setAllowedDepartments(newDepts);
                                    }}
                                    className={clsx(
                                        "px-4 py-2 rounded-lg text-xs font-medium border transition-all text-left flex items-center justify-between gap-2",
                                        isAllowed
                                            ? "bg-hubbi-primary/10 border-hubbi-primary text-hubbi-primary"
                                            : "bg-hubbi-input/30 border-hubbi-border text-hubbi-dim hover:border-hubbi-dim/50"
                                    )}
                                >
                                    {dept.name}
                                    {isAllowed && <Check size={12} />}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Floating Save Bar Logic */}
            {hasChanges && (
                <div className="sticky bottom-6 z-[60] mx-auto w-[90%] md:w-[50vw] bg-black/90 text-white p-4 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4 shadow-2xl border border-white/10 animate-in slide-in-from-bottom-4">
                    <span className="font-medium text-sm text-center md:text-left">
                        <span className="md:hidden">Tienes cambios sin guardar.</span>
                        <span className="hidden md:inline">¡Cuidado! Tienes cambios sin guardar.</span>
                    </span>
                    <div className="grid grid-cols-2 md:flex w-full md:w-auto gap-2 md:gap-3">
                        <button onClick={handleReset} disabled={saving} className="justify-center px-2 md:px-4 py-2 hover:bg-white/10 rounded-lg text-sm flex items-center gap-2 transition-colors">
                            <RotateCcw size={14} /> Restablecer
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className={clsx(
                                "justify-center px-4 md:px-6 py-2 bg-hubbi-success rounded-lg font-bold text-sm transition-colors flex items-center gap-2",
                                saving ? 'opacity-50 cursor-not-allowed' : 'hover:bg-hubbi-success/90'
                            )}
                        >
                            {saving ? <Loader2 className="animate-spin h-3.5 w-3.5" /> : <Save size={14} />}
                            {saving ? "Guardando..." : "Guardar"}
                        </button>
                    </div>
                </div>
            )}

        </div>
    );
}
