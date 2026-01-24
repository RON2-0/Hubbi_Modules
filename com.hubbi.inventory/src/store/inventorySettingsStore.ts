import { createStore } from 'zustand';
import { persist } from 'zustand/middleware';
import {
    InventoryProfile,
    InventorySettings,
    FeatureFlagKey
} from '../types/inventory';

export interface InventorySettingsState extends InventorySettings {
    allowedDepartments: number[];

    // Actions
    setAllowedDepartments: (ids: number[]) => void;
    setProfile: (profile: InventoryProfile) => void;
    toggleFeature: (feature: FeatureFlagKey, enabled: boolean) => void;
    resetToProfileDefaults: () => void;
    isFeatureEnabled: (feature: FeatureFlagKey) => boolean;
}

// Default Feature Flags per Profile
const PROFILE_DEFAULTS: Record<InventoryProfile, Record<FeatureFlagKey, boolean>> = {
    [InventoryProfile.GENERIC]: {
        serial_tracking: false,
        batch_tracking: false,
        expiration_dates: false,
        negative_stock_allowed: false,
        work_order_consumption: false,
        asset_depreciation: false,
        kits_enabled: false,
        reservations_enabled: false,
    },
    [InventoryProfile.RETAIL]: {
        serial_tracking: true,
        batch_tracking: false,
        expiration_dates: false,
        negative_stock_allowed: true,
        work_order_consumption: false,
        asset_depreciation: false,
        kits_enabled: true,
        reservations_enabled: false,
    },
    [InventoryProfile.WORKSHOP]: {
        serial_tracking: false,
        batch_tracking: false,
        expiration_dates: false,
        negative_stock_allowed: false,
        work_order_consumption: true,
        asset_depreciation: false,
        kits_enabled: true,
        reservations_enabled: true,
    },
    [InventoryProfile.RESTAURANT]: {
        serial_tracking: false,
        batch_tracking: true,
        expiration_dates: true,
        negative_stock_allowed: true,
        work_order_consumption: true,
        asset_depreciation: false,
        kits_enabled: true,
        reservations_enabled: true,
    },
    [InventoryProfile.PHARMACY]: {
        serial_tracking: false,
        batch_tracking: true,
        expiration_dates: true,
        negative_stock_allowed: false,
        work_order_consumption: false,
        asset_depreciation: false,
        kits_enabled: false,
        reservations_enabled: true,
    },
};

export const createInventorySettingsStore = (initialState?: Partial<InventorySettingsState>) => {
    return createStore<InventorySettingsState>()(
        persist(
            (set, get) => ({
                profile: InventoryProfile.GENERIC,
                features: PROFILE_DEFAULTS[InventoryProfile.GENERIC],
                overridden: false,
                allowedDepartments: [],
                ...initialState,

                setAllowedDepartments: (allowedDepartments: number[]) => set({ allowedDepartments }),

                setProfile: (profile: InventoryProfile) => {
                    set({
                        profile,
                        features: { ...PROFILE_DEFAULTS[profile] },
                        overridden: false
                    });
                },

                toggleFeature: (feature: FeatureFlagKey, enabled: boolean) => {
                    set((state: InventorySettingsState) => ({
                        features: {
                            ...state.features,
                            [feature]: enabled
                        },
                        overridden: true
                    }));
                },

                resetToProfileDefaults: () => {
                    const currentProfile = get().profile;
                    set({
                        features: { ...PROFILE_DEFAULTS[currentProfile] },
                        overridden: false
                    });
                },

                isFeatureEnabled: (feature: FeatureFlagKey) => {
                    return get().features[feature] ?? false;
                }
            }),
            {
                name: 'inventory-settings-storage',
            }
        )
    );
};

export type InventorySettingsStore = ReturnType<typeof createInventorySettingsStore>;
