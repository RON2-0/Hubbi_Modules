import { createContext, useContext, useRef, ReactNode } from 'react';
import { useStore } from 'zustand';
import { createInventoryStore, InventoryStore, InventoryState } from '../store/inventoryStore';

// 1. Create Context
const InventoryContext = createContext<InventoryStore | null>(null);

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

    return (
        <InventoryContext.Provider value={storeRef.current}>
            {children}
        </InventoryContext.Provider>
    );
};

// 3. Hook to use the store
export function useInventoryStore<T = InventoryState>(
    selector?: (state: InventoryState) => T
): T {
    const store = useContext(InventoryContext);
    if (!store) {
        throw new Error('useInventoryStore must be used within an InventoryProvider');
    }
    // If no selector is provided, return the full state
    const finalSelector = selector || ((state: InventoryState) => state as unknown as T);
    return useStore(store, finalSelector);
}
