/**
 * Sub-Hub Selector Component
 * 
 * Allows users with permission to switch between sub_hubs
 * for viewing/editing inventory.
 */

import { Building2, ChevronDown, Check, Lock } from 'lucide-react';
import { useSubHubFilter } from '../hooks/useSubHubFilter';

interface SubHubSelectorProps {
    onChange?: (subHubId: string) => void;
    className?: string;
    compact?: boolean;
}

export const SubHubSelector = ({ onChange, className = '', compact = false }: SubHubSelectorProps) => {
    const {
        subHubs,
        activeSubHubId,
        assignedSubHubId,
        canSwitchActive,
        canEditSubHub,
        setActiveSubHub,
        getActiveSubHubName,
        loading
    } = useSubHubFilter();

    const handleSelect = async (subHubId: string) => {
        const success = await setActiveSubHub(subHubId);
        if (success) {
            onChange?.(subHubId);
        }
    };

    // If user can't switch, just show current sub_hub name
    if (!canSwitchActive) {
        return (
            <div className={`inline-flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg text-sm ${className}`}>
                <Building2 size={16} className="text-gray-500" />
                <span className="text-gray-700">{getActiveSubHubName()}</span>
                <span title="No puedes cambiar de sucursal">
                    <Lock size={14} className="text-gray-400" />
                </span>
            </div>
        );
    }

    if (loading) {
        return (
            <div className={`inline-flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg text-sm ${className}`}>
                <Building2 size={16} className="text-gray-400" />
                <span className="text-gray-400">Cargando...</span>
            </div>
        );
    }

    // If no sub_hubs available
    if (subHubs.length === 0) {
        return (
            <div className={`inline-flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg text-sm ${className}`}>
                <Building2 size={16} className="text-gray-500" />
                <span className="text-gray-500">Sin Sucursales</span>
            </div>
        );
    }

    return (
        <div className={`relative inline-block ${className}`}>
            <details className="group">
                <summary className="list-none cursor-pointer inline-flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
                    <Building2 size={16} className="text-indigo-600" />
                    <span className={`font-medium text-gray-900 ${compact ? 'hidden sm:inline' : ''}`}>
                        {getActiveSubHubName()}
                    </span>
                    <ChevronDown size={16} className="text-gray-400 group-open:rotate-180 transition-transform" />
                </summary>

                <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-xl z-50 max-h-80 overflow-auto">
                    {subHubs.map(subHub => {
                        const isSelected = subHub.id === activeSubHubId;
                        const isAssigned = subHub.id === assignedSubHubId;
                        const canEdit = canEditSubHub(subHub.id);

                        return (
                            <button
                                key={subHub.id}
                                onClick={() => handleSelect(subHub.id)}
                                className={`w-full text-left px-4 py-3 flex items-center justify-between hover:bg-gray-50 border-b border-gray-50 last:border-0 ${isSelected ? 'bg-indigo-50' : ''
                                    }`}
                            >
                                <div className="flex items-center gap-2">
                                    {isSelected && <Check size={16} className="text-indigo-600" />}
                                    <div>
                                        <span className={`block ${isSelected ? 'font-semibold text-indigo-900' : 'text-gray-700'}`}>
                                            {subHub.name}
                                        </span>
                                        {isAssigned && (
                                            <span className="text-xs text-gray-400">Tu sucursal asignada</span>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-1">
                                    {!canEdit && (
                                        <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">Solo lectura</span>
                                    )}
                                </div>
                            </button>
                        );
                    })}
                </div>
            </details>
        </div>
    );
};

// Compact badge version for headers
export const SubHubBadge = ({ className = '' }: { className?: string }) => {
    const { getActiveSubHubName, loading, canEditSubHub, activeSubHubId } = useSubHubFilter();

    if (loading) return null;

    const canEdit = activeSubHubId ? canEditSubHub(activeSubHubId) : false;

    return (
        <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium ${canEdit ? 'bg-indigo-50 text-indigo-700' : 'bg-gray-100 text-gray-600'
            } ${className}`}>
            <Building2 size={12} />
            {getActiveSubHubName()}
            {!canEdit && <Lock size={10} />}
        </span>
    );
};
