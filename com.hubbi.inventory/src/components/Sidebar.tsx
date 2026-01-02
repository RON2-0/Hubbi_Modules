import { Package, ArrowRightLeft, AlertTriangle, Layers, Truck, BarChart3, ClipboardList, LayoutDashboard } from 'lucide-react';

export type TabId = 'overview' | 'products' | 'movements' | 'transfers' | 'alerts' | 'audit' | 'reports';

interface SidebarProps {
    activeTab: TabId;
    onTabChange: (tab: TabId) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange }) => {
    const menuItems = [
        { id: 'overview', label: 'Resumen', icon: <LayoutDashboard size={20} /> },
        { id: 'products', label: 'Productos', icon: <Package size={20} /> },
        { id: 'movements', label: 'Movimientos', icon: <ArrowRightLeft size={20} /> },
        { id: 'transfers', label: 'Transferencias', icon: <Truck size={20} /> },
        { id: 'alerts', label: 'Alertas', icon: <AlertTriangle size={20} /> },
        { id: 'audit', label: 'Auditoría', icon: <ClipboardList size={20} /> },
        { id: 'reports', label: 'Reportes', icon: <BarChart3 size={20} /> },
    ];

    return (
        <aside className="w-64 bg-hubbi-card border-r border-hubbi-border flex flex-col h-full transition-colors duration-200">
            <div className="p-6 border-b border-hubbi-border/50">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-hubbi-primary/10 rounded-lg text-hubbi-primary">
                        <Layers size={24} />
                    </div>
                    <div>
                        <h2 className="font-bold text-hubbi-text text-lg leading-tight">Inventario</h2>
                        <p className="text-xs text-hubbi-text-dim">Gestión WMS</p>
                    </div>
                </div>
            </div>

            <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
                {menuItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => onTabChange(item.id as TabId)}
                        className={`
                            w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group
                            ${activeTab === item.id
                                ? 'bg-hubbi-primary text-white shadow-md shadow-hubbi-primary/25'
                                : 'text-hubbi-text-dim hover:bg-hubbi-bg hover:text-hubbi-text'
                            }
                        `}
                    >
                        <span className={activeTab === item.id ? 'text-white' : 'text-hubbi-text-dim group-hover:text-hubbi-primary transition-colors'}>
                            {item.icon}
                        </span>
                        {item.label}
                    </button>
                ))}
            </nav>

            <div className="p-4 border-t border-hubbi-border/50">
                <div className="p-3 bg-hubbi-bg rounded-lg border border-hubbi-border/50">
                    <h3 className="text-xs font-semibold text-hubbi-text uppercase tracking-wider mb-2">Estado</h3>
                    <div className="flex items-center gap-2 text-xs text-hubbi-text-dim">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                        Sincronizado
                    </div>
                </div>
            </div>
        </aside>
    );
};
