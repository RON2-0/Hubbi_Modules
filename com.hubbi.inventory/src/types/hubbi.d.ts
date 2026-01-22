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
            execute: (sql: string, params?: unknown[], options?: { moduleId?: string }) => Promise<unknown>;
            query: <T = unknown>(sql: string, params?: unknown[], options?: { moduleId?: string }) => Promise<T[]>;
        };

        // Events
        events: {
            on: (event: string, callback: (data: unknown) => void) => () => void;
            dispatch: (event: string, data?: unknown) => void;
        };

        // Module API
        modules: {
            expose: (name: string, handler: (...args: unknown[]) => unknown, moduleId: string) => void;
            call: (moduleId: string, method: string, ...args: unknown[]) => Promise<unknown>;
        };
    }
}
