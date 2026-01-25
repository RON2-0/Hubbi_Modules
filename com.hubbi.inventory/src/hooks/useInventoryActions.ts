import { useCallback } from 'react';
import { InventoryTransactionManager } from '../core/transaction';
import { InventoryDataProvider } from '../services/inventoryProvider';
import { MovementRequest } from '../core/types';

export function useInventoryActions() {

    // We instantiate the manager on the fly. 
    // In a larger app, this might be a singleton or Context-injected.
    const executeMovement = useCallback(async (request: MovementRequest) => {
        try {
            // 1. Build Context
            // TODO: Get real profile/features from Settings Store
            const ctx = {
                profile: 'GENERIC' as const,
                features: {
                    allow_negative_stock: false,
                    serial_tracking: false,
                    batch_tracking: false
                },
                user_role: 'admin' // TODO: Get from window.hubbi.getContext()
            };

            const manager = new InventoryTransactionManager(ctx, InventoryDataProvider);

            // 2. Prepare (Validate)
            const tx = await manager.prepare(request);

            // 3. Commit
            await manager.commit(tx);

            // 4. Notify
            window.hubbi.notify('Movimiento registrado correctamente', 'success');

            return { success: true };

        } catch (err: unknown) {
            const error = err as Error;
            console.error('Movement Failed:', error);

            // Format friendly error message
            let msg = error.message || 'Error desconocido';
            if (msg.includes('Validation Failed')) {
                msg = msg.replace('Validation Failed:', 'Error de validación:');
            }

            window.hubbi.notify(msg, 'error');
            return { success: false, error: msg };
        }
    }, []);

    return {
        executeMovement
    };
}
