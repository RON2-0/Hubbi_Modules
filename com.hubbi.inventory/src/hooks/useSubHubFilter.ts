/**
 * Sub-Hub Filter Hook
 * 
 * Manages sub-hub context for multi-sucursal inventory filtering.
 * Respects user's assigned sub_hub and permissions.
 */

import { useState, useEffect, useCallback } from 'react';
import { hubbi } from '../hubbi-sdk.d';

export interface SubHub {
    id: string;
    name: string;
    is_active: boolean;
}

export interface SubHubContext {
    assignedSubHubId: string | null;  // User's assigned sub_hub
    activeSubHubId: string | null;    // Currently selected for viewing
    subHubs: SubHub[];                // All available sub_hubs
    canViewAll: boolean;              // Can view all sub_hubs
    canEditOwn: boolean;              // Can edit their own sub_hub
    canEditAll: boolean;              // Can edit any sub_hub
    canSwitchActive: boolean;         // Can change active sub_hub
}

export function useSubHubFilter() {
    const [context, setContext] = useState<SubHubContext>({
        assignedSubHubId: null,
        activeSubHubId: null,
        subHubs: [],
        canViewAll: false,
        canEditOwn: true,
        canEditAll: false,
        canSwitchActive: false,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        initializeSubHubContext();
    }, []);

    const initializeSubHubContext = async () => {
        setLoading(true);

        // Get user context from Core
        const hubbiContext = hubbi.getContext();
        const assignedSubHubId = hubbiContext?.subHubId || null;

        // Check permissions
        const canViewAll = hubbi.permissions.has('inventory.view_all_subhubs');
        const canEditOwn = hubbi.permissions.has('inventory.edit_own_subhub');
        const canEditAll = hubbi.permissions.has('inventory.edit_all_subhubs');
        const canSwitchActive = hubbi.permissions.has('inventory.switch_active_subhub');

        // Get all sub_hubs from Core
        let subHubs: SubHub[] = [];
        try {
            const subHubList = await hubbi.subHubs.list();
            subHubs = subHubList || [];
        } catch {
            // Fallback: if sub_hubs API not available, use empty list
            subHubs = [];
        }

        // Load saved active sub_hub from settings (if user can switch)
        let activeSubHubId = assignedSubHubId;
        if (canSwitchActive) {
            const savedActive = await hubbi.settings.get('active_subhub_id');
            if (savedActive && subHubs.some(sh => sh.id === savedActive)) {
                activeSubHubId = savedActive;
            }
        }

        setContext({
            assignedSubHubId,
            activeSubHubId,
            subHubs,
            canViewAll,
            canEditOwn,
            canEditAll,
            canSwitchActive,
        });

        setLoading(false);
    };

    /**
     * Change the active sub_hub (requires permission)
     */
    const setActiveSubHub = useCallback(async (subHubId: string) => {
        if (!context.canSwitchActive) {
            hubbi.notify('No tienes permiso para cambiar de sucursal', 'error');
            return false;
        }

        // Save to settings
        await hubbi.settings.set('active_subhub_id', subHubId);

        setContext(prev => ({
            ...prev,
            activeSubHubId: subHubId,
        }));

        hubbi.notify('Sucursal activa cambiada', 'success');
        return true;
    }, [context.canSwitchActive]);

    /**
     * Check if user can edit inventory for a specific sub_hub
     */
    const canEditSubHub = useCallback((subHubId: string): boolean => {
        // If can edit all, always true
        if (context.canEditAll) return true;

        // If can edit own, check if it's the assigned sub_hub
        if (context.canEditOwn && subHubId === context.assignedSubHubId) return true;

        // Otherwise, read-only
        return false;
    }, [context.canEditAll, context.canEditOwn, context.assignedSubHubId]);

    /**
     * Get SQL WHERE clause for filtering by sub_hub
     * Returns empty string if user can view all
     */
    const getSubHubWhereClause = useCallback((columnName: string = 'sub_hub_id'): string => {
        if (context.canViewAll) {
            // If viewing a specific sub_hub (active), filter by it
            if (context.activeSubHubId) {
                return ` AND ${columnName} = '${context.activeSubHubId}'`;
            }
            // Otherwise, show all
            return '';
        }

        // User can only see their assigned sub_hub
        if (context.assignedSubHubId) {
            return ` AND ${columnName} = '${context.assignedSubHubId}'`;
        }

        // No sub_hub assigned - show nothing (safety)
        return ` AND 1=0`;
    }, [context.canViewAll, context.activeSubHubId, context.assignedSubHubId]);

    /**
     * Get the effective sub_hub ID for new records
     */
    const getEffectiveSubHubId = useCallback((): string | null => {
        // Use active sub_hub if switching is allowed
        if (context.canSwitchActive && context.activeSubHubId) {
            return context.activeSubHubId;
        }
        // Otherwise use assigned
        return context.assignedSubHubId;
    }, [context.canSwitchActive, context.activeSubHubId, context.assignedSubHubId]);

    /**
     * Get the current active or assigned sub_hub name
     */
    const getActiveSubHubName = useCallback((): string => {
        const activeId = context.activeSubHubId || context.assignedSubHubId;
        const subHub = context.subHubs.find(sh => sh.id === activeId);
        return subHub?.name || 'Sin Sucursal';
    }, [context.activeSubHubId, context.assignedSubHubId, context.subHubs]);

    return {
        ...context,
        loading,
        setActiveSubHub,
        canEditSubHub,
        getSubHubWhereClause,
        getEffectiveSubHubId,
        getActiveSubHubName,
        refreshContext: initializeSubHubContext,
    };
}

// Standalone helper functions for API usage
export function getSubHubIdFromContext(): string | null {
    const ctx = hubbi.getContext();
    return ctx?.subHubId || null;
}

export async function validateSubHubPermission(subHubId: string, action: 'view' | 'edit'): Promise<boolean> {
    const ctx = hubbi.getContext();
    const assignedSubHubId = ctx?.subHubId || null;

    if (action === 'view') {
        // Can view if has view_all or it's their assigned sub_hub
        if (hubbi.permissions.has('inventory.view_all_subhubs')) return true;
        return subHubId === assignedSubHubId;
    }

    if (action === 'edit') {
        // Can edit if has edit_all or (edit_own AND it's their sub_hub)
        if (hubbi.permissions.has('inventory.edit_all_subhubs')) return true;
        if (hubbi.permissions.has('inventory.edit_own_subhub') && subHubId === assignedSubHubId) return true;
        return false;
    }

    return false;
}
