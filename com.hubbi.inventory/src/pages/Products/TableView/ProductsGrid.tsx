import React, { useEffect, useMemo, useState } from 'react';
import { GridCell, GridColumn, GridCellKind, Item, GridMouseEventArgs } from '@glideapps/glide-data-grid';
import { useInventoryStore } from '../../../context/InventoryContext';
import { InventoryItem } from '../../../types/inventory';

// Interface for ActionCell (defined here to avoid relative core imports)
type ActionGridCell = GridCell & {
    kind: GridCellKind.Custom;
    copyData: string;
    allowOverlay: boolean;
    data: {
        kind: "action-cell";
        actions: {
            id: string;
            iconPath: string;
            label?: string;
            color: string;
            hoverColor: string;
        }[];
    };
}

// Lucide Icons (SVG Paths)
const ICON_PENCIL = "M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z";
const ICON_EYE = "M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z";

// Interfaces for UI Data
interface ProductRow {
    id: string; // or number
    type: string;
    sku: string;
    name: string;
    category_id: string;
    price_base: number;
    cost_avg: number;
    is_active: boolean;
    // Dynamic fields could be mapped here too
    [key: string]: unknown;
}

export default function ProductsGrid() {
    const { selectItem } = useInventoryStore();
    const [rows, setRows] = useState<ProductRow[]>([]);

    // UI States
    const [globalSearch, setGlobalSearch] = useState("");
    const [colFilters, setColFilters] = useState<Record<string, string>>({});
    const [sort, setSort] = useState<{ colId: string, dir: 'asc' | 'desc' } | null>(null);
    const [menuAnchor, setMenuAnchor] = useState<{ x: number, y: number, colId: string } | null>(null);
    const [columnWidths, setColumnWidths] = useState<Record<string, number>>({
        type: 80,
        sku: 120,
        name: 350,
        category: 150,
        price: 100,
        cost: 100,
        is_active: 90,
        actions: 140
    });

    // Fetch Data (Realtime Store)
    useEffect(() => {
        const loadData = async () => {
            if (window.hubbi?.realtime) {
                try {
                    // Optimized Query: Cast UUID to TEXT to ensure JS receives it correctly
                    const query = `
                        SELECT 
                            CAST(id AS TEXT) as id, 
                            type, 
                            sku, 
                            name, 
                            category_id, 
                            price_base, 
                            cost_avg, 
                            is_active 
                        FROM com_hubbi_inventory.items 
                        ORDER BY name ASC
                    `;
                    const products = await window.hubbi.realtime.query<ProductRow>(query, []);

                    setRows(products);
                } catch (e) {
                    console.error("Failed to load products query:", e);
                }
            }
        };

        loadData();

        // Subscribe to changes
        let unsubscribe: () => void;
        if (window.hubbi?.realtime?.subscribe) {
            unsubscribe = window.hubbi.realtime.subscribe('com_hubbi_inventory.items', () => {
                loadData();
            });
        }

        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, []);

    // Column Resizing Handler
    const onColumnResize = React.useCallback((column: GridColumn, newSize: number) => {
        setColumnWidths(prev => ({
            ...prev,
            [column.id as string]: newSize
        }));
    }, []);

    // Filtering Logic
    const filteredRows = useMemo(() => {
        let result = rows;

        // Global Search
        if (globalSearch) {
            const searchUpper = globalSearch.toUpperCase();
            result = result.filter(row => {
                return (
                    (row.name?.toUpperCase().includes(searchUpper)) ||
                    (row.sku?.toUpperCase().includes(searchUpper)) ||
                    (row.type?.toUpperCase().includes(searchUpper))
                );
            });
        }

        // Column Specific Filters
        Object.entries(colFilters).forEach(([colId, filterValue]) => {
            if (!filterValue) return;
            const filterUpper = filterValue.toUpperCase();
            result = result.filter(row => {
                const val = (row[colId] || '').toString().toUpperCase();
                return val.includes(filterUpper);
            });
        });

        // Sorting Logic
        if (sort) {
            result = [...result].sort((a, b) => {
                const aVal = a[sort.colId];
                const bVal = b[sort.colId];

                if (aVal === bVal) return 0;

                let comparison = 0;
                if (typeof aVal === 'number' && typeof bVal === 'number') {
                    comparison = aVal - bVal;
                } else {
                    comparison = String(aVal).localeCompare(String(bVal));
                }

                return sort.dir === 'asc' ? comparison : -comparison;
            });
        }

        return result;
    }, [rows, globalSearch, colFilters, sort]);

    // Define Columns with dynamic widths and Sort Indicators
    const columns = useMemo<GridColumn[]>(() => [
        { title: `Tipo ${sort?.colId === 'type' ? (sort.dir === 'asc' ? '↑' : '↓') : ''}`, id: "type", width: columnWidths.type, hasMenu: true },
        { title: `SKU ${sort?.colId === 'sku' ? (sort.dir === 'asc' ? '↑' : '↓') : ''}`, id: "sku", width: columnWidths.sku, hasMenu: true },
        { title: `Nombre ${sort?.colId === 'name' ? (sort.dir === 'asc' ? '↑' : '↓') : ''}`, id: "name", width: columnWidths.name, hasMenu: true },
        { title: `Categoría ${sort?.colId === 'category' ? (sort.dir === 'asc' ? '↑' : '↓') : ''}`, id: "category", width: columnWidths.category, hasMenu: true },
        { title: `Precio ${sort?.colId === 'price' ? (sort.dir === 'asc' ? '↑' : '↓') : ''}`, id: "price", width: columnWidths.price, hasMenu: true },
        { title: `Costo ${sort?.colId === 'cost' ? (sort.dir === 'asc' ? '↑' : '↓') : ''}`, id: "cost", width: columnWidths.cost, hasMenu: true },
        { title: `Estado ${sort?.colId === 'is_active' ? (sort.dir === 'asc' ? '↑' : '↓') : ''}`, id: "is_active", width: columnWidths.is_active, hasMenu: true },
        { title: "Acciones", id: "actions", width: columnWidths.actions },
    ], [columnWidths, sort]);

    // Cell Renderer
    const getCellContent = React.useCallback((cell: Item): GridCell => {
        const [col, row] = cell;
        const dataRow = filteredRows[row];

        if (!dataRow) return { kind: GridCellKind.Loading, allowOverlay: false };

        const colId = columns[col].id;

        if (colId === 'type') {
            return {
                kind: GridCellKind.Bubble,
                data: [dataRow.type || 'product'],
                allowOverlay: false,
            };
        } else if (colId === 'sku') {
            return {
                kind: GridCellKind.Text,
                displayData: dataRow.sku || '-',
                data: dataRow.sku || '',
                allowOverlay: false,
            };
        } else if (colId === 'name') {
            return {
                kind: GridCellKind.Text,
                displayData: dataRow.name || 'Sin Nombre',
                data: dataRow.name || '',
                allowOverlay: false,
                themeOverride: {
                    baseFontStyle: "500 13px"
                }
            };
        } else if (colId === 'category') {
            return {
                kind: GridCellKind.Bubble,
                data: [dataRow.category_id || 'Sin Cat'],
                allowOverlay: false
            };
        } else if (colId === 'price') {
            const price = Number(dataRow.price_base);
            return {
                kind: GridCellKind.Text,
                displayData: !isNaN(price) ? `$${price.toFixed(2)}` : '$0.00',
                data: price.toString(),
                allowOverlay: false,
                contentAlign: 'right',
                themeOverride: {
                    baseFontStyle: "700 12px"
                }
            };
        } else if (colId === 'cost') {
            const cost = Number(dataRow.cost_avg);
            return {
                kind: GridCellKind.Text,
                displayData: !isNaN(cost) ? `$${cost.toFixed(2)}` : '$0.00',
                data: cost.toString(),
                allowOverlay: false,
                contentAlign: 'right'
            };
        } else if (colId === 'is_active') {
            const isActive = !!dataRow.is_active;
            return {
                kind: GridCellKind.Bubble,
                data: [isActive ? 'Activo' : 'Inactivo'],
                allowOverlay: false,
                themeOverride: {
                    textDark: isActive ? "rgb(var(--color-success))" : "rgb(var(--color-danger))"
                }
            };
        } else if (colId === 'actions') {
            return {
                kind: GridCellKind.Custom,
                allowOverlay: false,
                copyData: "Actions",
                readonly: true,
                data: {
                    kind: "action-cell",
                    actions: [
                        {
                            id: 'edit',
                            iconPath: ICON_PENCIL,
                            label: 'Editar',
                            color: '#0062ff',
                            hoverColor: '#0062ff'
                        },
                        {
                            id: 'view',
                            iconPath: ICON_EYE,
                            label: 'Ver',
                            color: '#10b981',
                            hoverColor: '#10b981'
                        }
                    ]
                }
            } as ActionGridCell;
        }

        return { kind: GridCellKind.Text, displayData: 'ERR', data: '', allowOverlay: false };
    }, [filteredRows, columns]);

    if (!window.hubbi?.ui?.HighPerformanceGrid) {
        return <div className="p-4 text-red-500">Error: HighPerformanceGrid not available in Core SDK.</div>;
    }

    const HighPerformanceGrid = window.hubbi.ui.HighPerformanceGrid as any;

    return (
        <div className="w-full h-full flex flex-col">

            <div className="flex-1 w-full min-h-0 bg-hubbi-bg relative">
                {/* Floating Header Menu Backdrop */}
                {menuAnchor && (
                    <div
                        className="fixed inset-0 z-[90] bg-black/5"
                        onClick={() => setMenuAnchor(null)}
                    />
                )}

                {menuAnchor && (
                    <div
                        className="fixed z-[100] w-64 bg-hubbi-card/95 backdrop-blur-xl border border-hubbi-border rounded-xl shadow-2xl p-4 flex flex-col gap-3 animate-in fade-in zoom-in-95 duration-200"
                        style={{ top: menuAnchor.y + 10, left: Math.min(menuAnchor.x, window.innerWidth - 270) }}
                    >
                        <div className="flex items-center justify-between px-1">
                            <span className="text-[12px] font-bold text-hubbi-primary uppercase tracking-wider">
                                {columns.find(c => c.id === menuAnchor.colId)?.title.replace(/[↑↓]/, '').trim()}
                            </span>
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <span className="text-[10px] text-hubbi-dim px-1 font-medium">Ordenación</span>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    onClick={() => {
                                        setSort({ colId: menuAnchor.colId, dir: 'asc' });
                                        setMenuAnchor(null);
                                    }}
                                    className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${sort?.colId === menuAnchor.colId && sort.dir === 'asc' ? 'bg-hubbi-primary text-white shadow-lg shadow-hubbi-primary/30' : 'bg-hubbi-bg/60 text-hubbi-text hover:bg-hubbi-bg border border-hubbi-border/50'}`}
                                >
                                    <span>Ascendente ↑</span>
                                </button>
                                <button
                                    onClick={() => {
                                        setSort({ colId: menuAnchor.colId, dir: 'desc' });
                                        setMenuAnchor(null);
                                    }}
                                    className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${sort?.colId === menuAnchor.colId && sort.dir === 'desc' ? 'bg-hubbi-primary text-white shadow-lg shadow-hubbi-primary/30' : 'bg-hubbi-bg/60 text-hubbi-text hover:bg-hubbi-bg border border-hubbi-border/50'}`}
                                >
                                    <span>Descendente ↓</span>
                                </button>
                            </div>
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <span className="text-[10px] text-hubbi-dim px-1 font-medium">Búsqueda en Columna</span>
                            <div className="relative">
                                <input
                                    autoFocus
                                    type="text"
                                    placeholder="Escribe para filtrar..."
                                    value={colFilters[menuAnchor.colId] || ''}
                                    onChange={(e) => setColFilters(prev => ({ ...prev, [menuAnchor.colId]: e.target.value }))}
                                    className="w-full bg-hubbi-bg/40 border border-hubbi-border rounded-lg px-3 py-2.5 text-xs text-hubbi-text focus:outline-none focus:ring-2 focus:ring-hubbi-primary/50 transition-all"
                                />
                                {colFilters[menuAnchor.colId] && (
                                    <button
                                        onClick={() => setColFilters(prev => ({ ...prev, [menuAnchor.colId]: '' }))}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 text-hubbi-dim hover:text-hubbi-danger transition-colors p-1"
                                    >
                                        <span className="text-xs">✕</span>
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="pt-1 flex flex-col gap-1 border-t border-hubbi-border/50">
                            {(sort?.colId === menuAnchor.colId || colFilters[menuAnchor.colId]) && (
                                <button
                                    onClick={() => {
                                        setSort(null);
                                        setColFilters(prev => {
                                            const newFilters = { ...prev };
                                            delete newFilters[menuAnchor.colId];
                                            return newFilters;
                                        });
                                        setMenuAnchor(null);
                                    }}
                                    className="text-[11px] text-hubbi-danger hover:bg-hubbi-danger/10 py-1.5 px-2 rounded-md transition-colors text-left font-medium"
                                >
                                    Limpiar filtros
                                </button>
                            )}
                        </div>
                    </div>
                )}

                <HighPerformanceGrid
                    columns={columns as any}
                    rowCount={filteredRows.length}
                    getCellContent={getCellContent}
                    searchValue={globalSearch}
                    onSearchChange={setGlobalSearch}
                    onColumnResize={onColumnResize as any}
                    onHeaderMenuClick={(colIndex: number, bounds: { x: number, y: number, width: number, height: number }) => {
                        const colId = columns[colIndex].id;
                        if (!colId || colId === 'actions') return;
                        setMenuAnchor({ x: bounds.x, y: bounds.y + bounds.height, colId });
                    }}
                    onHeaderClicked={(colIndex: number) => {
                        const colId = columns[colIndex].id;
                        if (!colId || colId === 'actions') return;
                        setSort(prev => {
                            if (prev?.colId === colId) {
                                if (prev.dir === 'asc') return { colId, dir: 'desc' };
                                return null;
                            }
                            return { colId, dir: 'asc' };
                        });
                    }}
                    onCellEdited={(cell: Item, newVal: GridCell) => {
                        console.log('Edit:', cell, newVal);
                    }}
                    onCellClicked={(async (cell: Item, event: GridMouseEventArgs) => {
                        const [col, row] = cell;
                        const dataRow = filteredRows[row];
                        if (!dataRow) return;

                        const colId = columns[col].id;

                        if (colId === 'actions') {
                            // Hit detection for Action Buttons
                            const BUTTON_PADDING = 8;
                            const GAP = 8;

                            // Calculate clicked position relative to cell
                            const anyEvent = event as any;
                            const bounds = anyEvent.bounds;
                            const localEvent = anyEvent.localEvent;

                            if (!bounds || !localEvent) return;

                            const relativeX = localEvent.clientX - bounds.x;

                            // Approximate button widths based on ActionCell implementation
                            const editBtnWidth = 72;

                            if (relativeX >= BUTTON_PADDING && relativeX <= BUTTON_PADDING + editBtnWidth) {
                                // Clicked Edit
                                const item = dataRow as unknown as InventoryItem;
                                selectItem(item);
                            } else if (relativeX >= BUTTON_PADDING + editBtnWidth + GAP && relativeX <= 160) {
                                // Clicked View
                                const item = dataRow as unknown as InventoryItem;
                                selectItem(item);
                            }
                            return;
                        }

                        if (colId === 'is_active') {
                            const newStatus = !dataRow.is_active;
                            try {
                                await window.hubbi.realtime.mutate({
                                    table: 'com_hubbi_inventory.items',
                                    type: 'UPDATE',
                                    id: dataRow.id,
                                    data: { is_active: newStatus }
                                });
                            } catch (e) {
                                console.error('Mutation failed', e);
                            }
                        }
                    }) as any}
                />
            </div>

            <div className="p-1 px-4 text-[10px] text-hubbi-dim flex justify-between bg-hubbi-bg/50">
                <span>Total Productos: {filteredRows.length} {(globalSearch || Object.values(colFilters).some(v => v)) && `(filtrados)`}</span>
                <span>Engine: Glide Data Grid (High Performance)</span>
            </div>

        </div >
    );
}



