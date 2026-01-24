import { createContext, useContext, useRef, ReactNode } from 'react';
import { useStore } from 'zustand';
import { createInventoryStore, InventoryStore, InventoryState } from '../store/inventoryStore';
import { createInventorySettingsStore, InventorySettingsStore, InventorySettingsState } from '../store/inventorySettingsStore';


// 1. Create Context
const InventoryContext = createContext<{
    store: InventoryStore;
    settings: InventorySettingsStore;
} | null>(null);


// 2. Provider Component
interface InventoryProviderProps {
    children: ReactNode;
    initialState?: Partial<InventoryState>;
}

export const InventoryProvider = ({ children, initialState }: InventoryProviderProps) => {
    // Ensure store is created once per component instance (per tab)
    const storeRef = useRef<InventoryStore>(undefined);
    if (!storeRef.current) {
        storeRef.current = createInventoryStore(initialState);
    }

    const settingsStoreRef = useRef<InventorySettingsStore>(undefined);
    if (!settingsStoreRef.current) {
        settingsStoreRef.current = createInventorySettingsStore();
    }

    return (
        <InventoryContext.Provider value={{
            store: storeRef.current,
            settings: settingsStoreRef.current
        }}>
            {children}
        </InventoryContext.Provider>
    );
};


// 3. Hook to use the store
export function useInventoryStore<T = InventoryState>(
    selector?: (state: InventoryState) => T
): T {
    const context = useContext(InventoryContext);
    if (!context) {
        throw new Error('useInventoryStore must be used within an InventoryProvider');
    }
    const store = context.store;

    if (!store) {
        throw new Error('useInventoryStore must be used within an InventoryProvider');
    }
    // If no selector is provided, return the full state
    const finalSelector = selector || ((state: InventoryState) => state as unknown as T);
    return useStore(store, finalSelector);
}
// 4. Hook to use the settings
export function useInventorySettings<T = InventorySettingsState>(
    selector?: (state: InventorySettingsState) => T
): T {
    const context = useContext(InventoryContext);
    if (!context) {
        throw new Error('useInventorySettings must be used within an InventoryProvider');
    }
    const store = context.settings;
    const finalSelector = selector || ((state: InventorySettingsState) => state as unknown as T);
    return useStore(store, finalSelector);
}
