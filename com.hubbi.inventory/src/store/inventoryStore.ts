import { createStore } from 'zustand';
import { InventoryItem } from '../types/inventory';

export interface InventoryState {
    viewMode: 'table' | 'vms';
    selectedItemId: string | null;
    selectedItem: InventoryItem | null;

    // Actions
    setViewMode: (mode: 'table' | 'vms') => void;
    selectItem: (item: InventoryItem | null) => void;
}

export type InventoryStore = ReturnType<typeof createInventoryStore>;

export const createInventoryStore = (initProps?: Partial<InventoryState>) => {
    return createStore<InventoryState>()((set) => ({
        viewMode: 'table',
        selectedItemId: null,
        selectedItem: null,
        ...initProps,

        setViewMode: (mode) => set({ viewMode: mode }),
        selectItem: (item) => set({
            selectedItem: item,
            selectedItemId: item?.id || null
        }),
    }));
};
