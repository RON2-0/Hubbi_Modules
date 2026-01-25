import { clsx } from 'clsx';
import {
    Settings,
    Warehouse,
    Ruler,
    Tags,
    Layers,
    PenTool,
} from 'lucide-react';

interface SettingsHeaderProps {
    activeTab: string;
}

export default function SettingsHeader({ activeTab }: SettingsHeaderProps) {
    const tabs = [
        { id: 'settings-general', label: 'General', icon: Settings },
        { id: 'settings-warehouses', label: 'Bodegas', icon: Warehouse },
        { id: 'settings-units', label: 'Unidades', icon: Ruler },
        { id: 'settings-categories', label: 'Categorías', icon: Tags },
        { id: 'settings-groups', label: 'Grupos', icon: Layers },
        { id: 'settings-custom-fields', label: 'Campos Personalizados', icon: PenTool },
    ];

    const navigate = (route: string) => {
        // Construct URL based on the route ID
        // settings-general -> /app/com.hubbi.inventory/settings/general
        // settings-warehouses -> /app/com.hubbi.inventory/settings/warehouses

        let path = '/app/com.hubbi.inventory';
        // All settings routes follow pattern: settings-X -> /settings/X
        path += '/' + route.replace('-', '/');

        window.hubbi.navigate(path);
    };

    return (
        <div className="h-14 border-b border-hubbi-border flex items-center px-4 bg-hubbi-card gap-2 overflow-x-auto min-w-0">
            {tabs.map((tab) => {
                const isActive = activeTab === tab.id || (tab.id === 'settings-general' && activeTab === 'settings');
                return (
                    <button
                        key={tab.id}
                        onClick={() => navigate(tab.id)}
                        className={clsx(
                            "px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 whitespace-nowrap",
                            isActive
                                ? "bg-hubbi-primary/10 text-hubbi-primary shadow-sm ring-1 ring-hubbi-primary/20"
                                : "text-hubbi-dim hover:text-hubbi-text hover:bg-hubbi-muted"
                        )}
                    >
                        <tab.icon className={clsx("w-4 h-4", isActive ? "text-hubbi-primary" : "text-hubbi-dim")} />
                        {tab.label}
                    </button>
                );
            })}
        </div>
    );
}
