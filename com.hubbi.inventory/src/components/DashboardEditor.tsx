/**
 * Dashboard Editor Component
 *
 * Drag-and-drop widget layout using react-grid-layout.
 * Persists layout to module settings.
 */

import { useState, useEffect } from 'react';
import { Responsive, WidthProvider } from 'react-grid-layout';
import { Settings, LayoutGrid, Package, AlertTriangle, TrendingUp, DollarSign, Zap } from 'lucide-react';
import { hubbi } from '../hubbi-sdk.d';
import 'react-grid-layout/css/styles.css';

const ResponsiveGridLayout = WidthProvider(Responsive);

interface Widget {
    id: string;
    name: string;
    icon: React.ReactNode;
    component: React.ReactNode;
}

const WIDGETS: Widget[] = [
    {
        id: 'total-value',
        name: 'Valor Total',
        icon: <DollarSign size={16} />,
        component: (
            <div className="h-full flex flex-col items-center justify-center">
                <DollarSign size={32} className="text-hubbi-primary mb-2" />
                <span className="text-2xl font-bold text-hubbi-text">$124,500.00</span>
                <span className="text-sm text-hubbi-dim">Valor del Inventario</span>
            </div>
        )
    },
    {
        id: 'stock-alerts',
        name: 'Alertas de Stock',
        icon: <AlertTriangle size={16} />,
        component: (
            <div className="h-full flex flex-col items-center justify-center">
                <AlertTriangle size={32} className="text-hubbi-warning mb-2" />
                <span className="text-2xl font-bold text-hubbi-text">12</span>
                <span className="text-sm text-hubbi-dim">Productos Bajo Mínimo</span>
            </div>
        )
    },
    {
        id: 'best-sellers',
        name: 'Más Vendidos',
        icon: <TrendingUp size={16} />,
        component: (
            <div className="h-full flex flex-col items-center justify-center">
                <TrendingUp size={32} className="text-hubbi-success mb-2" />
                <span className="text-lg font-bold text-hubbi-text">Producto A</span>
                <span className="text-sm text-hubbi-dim">245 unidades vendidas</span>
            </div>
        )
    },
    {
        id: 'total-products',
        name: 'Total Productos',
        icon: <Package size={16} />,
        component: (
            <div className="h-full flex flex-col items-center justify-center">
                <Package size={32} className="text-hubbi-primary mb-2" />
                <span className="text-2xl font-bold text-hubbi-text">1,234</span>
                <span className="text-sm text-hubbi-dim">Productos Activos</span>
            </div>
        )
    },
    {
        id: 'quick-actions',
        name: 'Acciones Rápidas',
        icon: <Zap size={16} />,
        component: (
            <div className="h-full flex flex-col gap-2 p-2 justify-center">
                <button className="px-3 py-2 bg-hubbi-primary text-hubbi-primary-fg rounded-lg text-sm">Nuevo Producto</button>
                <button className="px-3 py-2 bg-hubbi-bg border border-hubbi-border text-hubbi-text rounded-lg text-sm">Ajuste Rápido</button>
            </div>
        )
    }
];

const DEFAULT_LAYOUT = [
    { i: 'total-value', x: 0, y: 0, w: 2, h: 2 },
    { i: 'stock-alerts', x: 2, y: 0, w: 2, h: 2 },
    { i: 'best-sellers', x: 4, y: 0, w: 2, h: 2 },
    { i: 'total-products', x: 0, y: 2, w: 2, h: 2 },
    { i: 'quick-actions', x: 2, y: 2, w: 2, h: 2 },
];

interface DashboardEditorProps {
    onClose?: () => void;
}

export const DashboardEditor = ({ onClose }: DashboardEditorProps) => {
    const [layout, setLayout] = useState(DEFAULT_LAYOUT);
    const [isEditing, setIsEditing] = useState(false);
    const [activeWidgets, setActiveWidgets] = useState<string[]>(WIDGETS.map(w => w.id));

    // Load saved layout
    useEffect(() => {
        const loadLayout = async () => {
            const saved = await hubbi.settings.get('dashboard_layout');
            if (saved) {
                try {
                    const parsed = JSON.parse(saved as string);
                    setLayout(parsed.layout || DEFAULT_LAYOUT);
                    setActiveWidgets(parsed.activeWidgets || WIDGETS.map(w => w.id));
                } catch {
                    // Use defaults
                }
            }
        };
        loadLayout();
    }, []);

    const saveLayout = async () => {
        await hubbi.settings.set('dashboard_layout', JSON.stringify({
            layout,
            activeWidgets
        }));
        setIsEditing(false);
        hubbi.notify('Layout guardado', 'success');
    };

    const toggleWidget = (widgetId: string) => {
        if (activeWidgets.includes(widgetId)) {
            setActiveWidgets(activeWidgets.filter(id => id !== widgetId));
            setLayout(layout.filter(l => l.i !== widgetId));
        } else {
            setActiveWidgets([...activeWidgets, widgetId]);
            // Add to layout
            const maxY = Math.max(...layout.map(l => l.y + l.h), 0);
            setLayout([...layout, { i: widgetId, x: 0, y: maxY, w: 2, h: 2 }]);
        }
    };

    const handleLayoutChange = (newLayout: { i: string; x: number; y: number; w: number; h: number }[]) => {
        setLayout(newLayout);
    };

    return (
        <div className="bg-hubbi-card rounded-xl border border-hubbi-border shadow-sm overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-hubbi-border">
                <h2 className="text-lg font-semibold text-hubbi-text flex items-center gap-2">
                    <LayoutGrid size={20} className="text-hubbi-primary" />
                    Dashboard Personalizado
                </h2>
                <div className="flex items-center gap-2">
                    {isEditing ? (
                        <>
                            <button
                                onClick={() => setIsEditing(false)}
                                className="px-3 py-1.5 text-hubbi-dim hover:text-hubbi-text"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={saveLayout}
                                className="px-3 py-1.5 bg-hubbi-primary text-hubbi-primary-fg rounded-lg"
                            >
                                Guardar
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={() => setIsEditing(true)}
                            className="flex items-center gap-2 px-3 py-1.5 text-hubbi-dim hover:text-hubbi-text"
                        >
                            <Settings size={16} />
                            Editar Layout
                        </button>
                    )}
                    {onClose && (
                        <button onClick={onClose} className="p-1 hover:bg-hubbi-bg rounded ml-2">
                            ✕
                        </button>
                    )}
                </div>
            </div>

            {/* Widget Toggle (only in edit mode) */}
            {isEditing && (
                <div className="px-6 py-3 border-b border-hubbi-border bg-hubbi-bg">
                    <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-sm text-hubbi-dim">Widgets:</span>
                        {WIDGETS.map(widget => (
                            <button
                                key={widget.id}
                                onClick={() => toggleWidget(widget.id)}
                                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors ${activeWidgets.includes(widget.id)
                                        ? 'bg-hubbi-primary text-hubbi-primary-fg'
                                        : 'bg-hubbi-border text-hubbi-dim'
                                    }`}
                            >
                                {widget.icon}
                                {widget.name}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Grid */}
            <div className="p-6 min-h-96">
                <ResponsiveGridLayout
                    className="layout"
                    layouts={{ lg: layout }}
                    breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
                    cols={{ lg: 6, md: 4, sm: 2, xs: 2, xxs: 1 }}
                    rowHeight={80}
                    isDraggable={isEditing}
                    isResizable={isEditing}
                    onLayoutChange={handleLayoutChange}
                >
                    {activeWidgets.map(widgetId => {
                        const widget = WIDGETS.find(w => w.id === widgetId);
                        if (!widget) return null;
                        return (
                            <div
                                key={widgetId}
                                className={`bg-hubbi-bg border border-hubbi-border rounded-lg overflow-hidden ${isEditing ? 'cursor-move ring-2 ring-hubbi-primary/20' : ''
                                    }`}
                            >
                                {widget.component}
                            </div>
                        );
                    })}
                </ResponsiveGridLayout>
            </div>
        </div>
    );
};
