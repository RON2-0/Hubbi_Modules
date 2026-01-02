/**
 * Period Selector Component
 * 
 * Dropdown to select fiscal period for viewing/editing.
 * Shows lock icon for non-editable periods.
 */

import { Lock, Calendar, ChevronDown, Check } from 'lucide-react';
import { useFiscalPeriods, FiscalPeriod } from '../hooks/useFiscalPeriods';

interface PeriodSelectorProps {
    onChange?: (periodId: string) => void;
    className?: string;
}

const MONTH_NAMES = [
    '', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export const PeriodSelector = ({ onChange, className = '' }: PeriodSelectorProps) => {
    const {
        periods,
        currentPeriod,
        selectedPeriodId,
        selectPeriod,
        isPeriodEditable,
        loading
    } = useFiscalPeriods();

    const handleSelect = (periodId: string) => {
        selectPeriod(periodId);
        onChange?.(periodId);
    };

    const formatPeriod = (period: FiscalPeriod): string => {
        return `${MONTH_NAMES[period.month]} ${period.year}`;
    };

    const getStatusBadge = (period: FiscalPeriod) => {
        if (period.is_current) {
            return <span className="ml-2 text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">Actual</span>;
        }
        if (period.status === 'closed') {
            return <span className="ml-2 text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">Cerrado</span>;
        }
        if (period.status === 'locked') {
            return <span className="ml-2 text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded">Bloqueado</span>;
        }
        return null;
    };

    const selectedPeriod = periods.find(p => p.id === selectedPeriodId) || currentPeriod;

    if (loading) {
        return (
            <div className={`inline-flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg text-sm ${className}`}>
                <Calendar size={16} className="text-gray-400" />
                <span className="text-gray-400">Cargando...</span>
            </div>
        );
    }

    return (
        <div className={`relative inline-block ${className}`}>
            <details className="group">
                <summary className="list-none cursor-pointer inline-flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
                    <Calendar size={16} className="text-blue-600" />
                    <span className="font-medium text-gray-900">
                        {selectedPeriod ? formatPeriod(selectedPeriod) : 'Seleccionar período'}
                    </span>
                    {selectedPeriod && !isPeriodEditable(selectedPeriod.id) && (
                        <span title="Solo lectura">
                            <Lock size={14} className="text-amber-500" />
                        </span>
                    )}
                    <ChevronDown size={16} className="text-gray-400 group-open:rotate-180 transition-transform" />
                </summary>

                <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-xl z-50 max-h-80 overflow-auto">
                    {periods.map(period => {
                        const isSelected = period.id === selectedPeriodId;
                        const editable = isPeriodEditable(period.id);

                        return (
                            <button
                                key={period.id}
                                onClick={() => handleSelect(period.id)}
                                className={`w-full text-left px-4 py-3 flex items-center justify-between hover:bg-gray-50 border-b border-gray-50 last:border-0 ${isSelected ? 'bg-blue-50' : ''
                                    }`}
                            >
                                <div className="flex items-center gap-2">
                                    {isSelected && <Check size={16} className="text-blue-600" />}
                                    <span className={`${isSelected ? 'font-semibold text-blue-900' : 'text-gray-700'}`}>
                                        {formatPeriod(period)}
                                    </span>
                                    {getStatusBadge(period)}
                                </div>
                                {!editable && <Lock size={14} className="text-gray-400" />}
                            </button>
                        );
                    })}

                    {periods.length === 0 && (
                        <div className="px-4 py-6 text-center text-gray-400 text-sm">
                            No hay períodos disponibles
                        </div>
                    )}
                </div>
            </details>
        </div>
    );
};

// Compact version for headers
export const PeriodBadge = ({ className = '' }: { className?: string }) => {
    const { currentPeriod, loading } = useFiscalPeriods();

    if (loading || !currentPeriod) return null;

    return (
        <span className={`inline-flex items-center gap-1.5 px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium ${className}`}>
            <Calendar size={12} />
            {MONTH_NAMES[currentPeriod.month]} {currentPeriod.year}
        </span>
    );
};
