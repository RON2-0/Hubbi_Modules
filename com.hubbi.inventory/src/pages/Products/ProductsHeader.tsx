import { LayoutGrid, Table2 } from 'lucide-react';
import { useInventoryStore } from '../../context/InventoryContext';
import { clsx } from 'clsx';

export default function Header() {
    const { viewMode, setViewMode } = useInventoryStore();

    const options = [
        { id: 'table', label: 'Tabla', icon: Table2 },
        { id: 'vms', label: 'WMS', icon: LayoutGrid },
    ] as const;

    return (
        <div className="h-16 border-b border-hubbi-border flex items-center justify-between px-4 bg-hubbi-card">

            {/* Selector de modo */}
            <div className="grid grid-cols-2 gap-2 bg-hubbi-input/30 p-1 rounded-xl w-48">
                {options.map((option) => {
                    const isActive = viewMode === option.id;
                    return (
                        <button
                            key={option.id}
                            onClick={() => setViewMode(option.id)}
                            className={clsx(
                                "py-2 rounded-lg text-xs font-bold transition-all flex justify-center items-center gap-2",
                                isActive
                                    ? "bg-hubbi-card shadow text-hubbi-primary"
                                    : "text-hubbi-dim hover:text-hubbi-text"
                            )}
                        >
                            <option.icon className="w-3.5 h-3.5" />
                            {option.label}
                        </button>
                    );
                })}
            </div>

            <div className="flex items-center gap-2">
                {/* Global Actions like "New Item" will go here */}
            </div>
        </div>
    );
}
