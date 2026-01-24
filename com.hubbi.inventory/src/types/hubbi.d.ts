export { };

declare global {
    interface Window {
        hubbi: HubbiSDK;
        React: typeof import('react');
        ReactDOM: typeof import('react-dom');
        ReactDOMClient: typeof import('react-dom/client');
        HubbiJSX: typeof import('react/jsx-runtime');
    }

    interface HubbiSDK {
        // Module Registration
        register: (moduleId: string, component: React.ComponentType) => void;

        // Widgets
        widgets: {
            register: (config: {
                slotName: string;
                moduleId: string;
                component: React.ComponentType;
                priority?: number;
            }) => void;
        };

        // Database
        db: {
            execute: (sql: string, params?: unknown[], options?: { moduleId?: string }) => Promise<{ rowsAffected: number }>;
            query: <T = unknown>(sql: string, params?: unknown[], options?: { moduleId?: string }) => Promise<T[]>;
            insert: (table: string, data: Record<string, unknown>, options?: { moduleId?: string; offlineSupport?: boolean }) => Promise<string | number>;
            update: (table: string, id: string | number, data: Record<string, unknown>, options?: { moduleId?: string; offlineSupport?: boolean }) => Promise<number>;
            delete: (table: string, id: string | number, options?: { moduleId?: string; offlineSupport?: boolean }) => Promise<number>;
        };

        // Permissions
        hasPermission: (permissionId: string) => boolean;

        // Events
        events: {
            on: (event: string, callback: (data: unknown) => void) => () => void;
            dispatch: (event: string, data?: unknown) => void;
        };

        // Navigation
        navigate: (path: string) => void;

        // Notifications
        notify: (message: string, type?: 'info' | 'success' | 'error' | 'warning') => void;

        // Settings
        settings: {
            get: (key: string, moduleId?: string) => Promise<string | null>;
            set: (key: string, value: string, moduleId?: string) => Promise<void>;
            getAll: (moduleId?: string) => Promise<Record<string, string>>;
        };

        // Context
        getContext: () => {
            hubId: number;
            hubName: string;
            subHubId: number;
            subHubName: string;
            userId: number;
            userName: string;
            moduleId: string;
            hubLogo: string | null;
        };

        // Core Data
        subHubs: {
            list: () => Promise<Array<{ id: number; name: string; is_main: boolean }>>;
        };
        departments: {
            list: () => Promise<Array<{ id: number; name: string }>>;
        };
        members: {
            list: () => Promise<Array<{ id: number; user_id: number; role_id: number; sub_hub_id: number | null; department_id: number | null }>>;
        };

        // Module API
        modules: {
            expose: (name: string, handler: (...args: unknown[]) => unknown, moduleId: string) => void;
            call: (moduleId: string, method: string, ...args: unknown[]) => Promise<unknown>;
        };
    }
}
