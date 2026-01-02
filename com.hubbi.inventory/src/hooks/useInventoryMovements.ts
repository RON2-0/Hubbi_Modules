import { useState } from 'react';
import { hubbi } from '../hubbi-sdk.d';
import { InventoryItem } from '../types/inventory';
import { recordMovement, MovementParams } from '../api/inventory-api';

interface MovementRequest {
    item: InventoryItem;
    location_id: string;
    type: MovementParams['type'];
    quantity: number;
    unit_cost?: number;
    reason?: MovementParams['reason']; // Optional in hook, but will default if missing
    reference?: { type: string; id: string };
}

export const useInventoryMovements = () => {
    const [processing, setProcessing] = useState(false);

    const registerMovement = async (req: MovementRequest) => {
        setProcessing(true);
        try {
            const ctx = hubbi.getContext();
            const result = await recordMovement({
                itemId: req.item.id,
                locationId: req.location_id,
                type: req.type,
                quantity: req.quantity,
                reason: req.reason || 'other',
                unitCost: req.unit_cost,
                documentType: req.reference?.type,
                documentNumber: req.reference?.id,
                createdBy: ctx?.userId || 'system',
                subHubId: ctx?.subHubId // Implicitly use current sub_hub context
            });

            if (!result.success) {
                throw new Error(result.error || 'Error desconocido al registrar movimiento');
            }

            hubbi.notify.success('Movimiento registrado exitosamente');
            return { success: true, movementId: result.movementId };

        } catch (error: unknown) {
            console.error(error);
            hubbi.notify.error((error instanceof Error ? error.message : String(error)) || 'Error al registrar movimiento');
            return { success: false, error };
        } finally {
            setProcessing(false);
        }
    };

    return {
        registerMovement,
        processing
    };
};
