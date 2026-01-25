import { createContext, useContext, useState, ReactNode } from 'react';
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
    // Ensure store is created once per component instance using useState lazy initializer
    const [store] = useState(() => createInventoryStore(initialState));
    const [settings] = useState(() => createInventorySettingsStore());

    return (
        <InventoryContext.Provider value={{
            store,
            settings
        }}>
            {children}
        </InventoryContext.Provider>
    );
};


// 3. Hook to use the store
// eslint-disable-next-line react-refresh/only-export-components
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
// eslint-disable-next-line react-refresh/only-export-components
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
