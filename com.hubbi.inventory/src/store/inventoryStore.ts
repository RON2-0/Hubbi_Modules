import { createStore } from 'zustand';
import { InventoryItem, InventoryMovement, InventoryStockView } from '../types/inventory';

export interface InventoryState {
    // UI State
    viewMode: 'table' | 'vms';
    selectedItemId: string | null;
    selectedItem: InventoryItem | null;
    searchQuery: string;

    // Organization Filters
    selectedSubHubId: string | null;
    selectedWarehouseId: string | null;

    // Cache / Data State (Read-Only Views)
    // Keyed by ID
    items: Record<string, InventoryItem>;
    stockCache: Record<string, InventoryStockView>;
    movementsCache: Record<string, InventoryMovement[]>;

    // Actions (UI)
    setViewMode: (mode: 'table' | 'vms') => void;
    selectItem: (item: InventoryItem | null) => void;
    setSearchQuery: (query: string) => void;

    // Filter Actions
    setSubHubFilter: (id: string | null) => void;
    setWarehouseFilter: (id: string | null) => void;

    // Actions (Data Ingestion - from Core Events)
    setStockView: (itemId: string, stock: InventoryStockView) => void;
    addMovementLog: (movement: InventoryMovement) => void;
    setMovements: (itemId: string, movements: InventoryMovement[]) => void;

    // Selectors (Derived)
    getStock: (itemId: string) => InventoryStockView | undefined;
    getMovements: (itemId: string) => InventoryMovement[];
}

export type InventoryStore = ReturnType<typeof createInventoryStore>;

export const createInventoryStore = (initProps?: Partial<InventoryState>) => {
    return createStore<InventoryState>()((set, get) => ({
        viewMode: 'table',
        selectedItemId: null,
        selectedItem: null,
        searchQuery: '',

        // Defaults from Hubbi Context
        selectedSubHubId: typeof window !== 'undefined' ? (window.hubbi?.getContext()?.subHubId ? String(window.hubbi.getContext().subHubId) : null) : null,
        selectedWarehouseId: null,

        items: {},
        stockCache: {},
        movementsCache: {},

        ...initProps,

        setViewMode: (mode) => set({ viewMode: mode }),

        selectItem: (item) => set({
            selectedItem: item,
            selectedItemId: item?.id || null
        }),

        setSearchQuery: (query) => set({ searchQuery: query }),

        setSubHubFilter: (id) => set({ selectedSubHubId: id, selectedWarehouseId: null }),
        setWarehouseFilter: (id) => set({ selectedWarehouseId: id }),

        // Cache Updates
        setStockView: (itemId, stock) => set(state => ({
            stockCache: { ...state.stockCache, [itemId]: stock }
        })),

        addMovementLog: (movement) => set(state => {
            const current = state.movementsCache[movement.item_id] || [];
            return {
                movementsCache: {
                    ...state.movementsCache,
                    [movement.item_id]: [movement, ...current] // Prepend new movement
                }
            };
        }),

        setMovements: (itemId, movements) => set(state => ({
            movementsCache: { ...state.movementsCache, [itemId]: movements }
        })),

        // Selectors
        getStock: (itemId) => get().stockCache[itemId],

        getMovements: (itemId) => get().movementsCache[itemId] || []
    }));
};
