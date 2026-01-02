/* eslint-disable @typescript-eslint/no-explicit-any */
// Declaration for the global 'hubbi' object provided by the host
// Aligned with module-development.md SDK specification
export { };

declare global {
  interface Window {
    hubbi: HubbiSDK;
  }
}

export interface HubbiSDK {
  // Database operations (official API per module-development.md)
  db: {
    query: (sql: string, params?: unknown[], opts?: { moduleId?: string }) => Promise<any[]>;
    execute: (sql: string, params?: unknown[], opts?: { moduleId?: string }) => Promise<any>;
    executeOffline: (sql: string, params?: unknown[], opts?: { moduleId?: string }) => Promise<any>;
  };

  // Alias for backward compatibility during migration
  data: {
    create: (options: { table: string; data: unknown; options?: { strategy?: 'online_first' | 'local_only' } }) => Promise<{ offline: boolean; data: any; error: any }>;
    update: (options: { table: string; id: string; data: unknown; options?: { strategy?: 'online_first' | 'local_only' } }) => Promise<{ offline: boolean; data: any; error: any }>;
    delete: (options: { table: string; id: string; options?: { strategy?: 'online_first' | 'local_only' } }) => Promise<{ offline: boolean; error: any }>;
    list: (options: { table: string; query?: unknown; options?: { strategy?: 'cache_first' } }) => Promise<{ data: any[]; error: any }>;
    query: (sql: string, params?: unknown[], options?: { moduleId?: string }) => Promise<any[]>;
    execute: (sql: string, params?: unknown[], options?: { moduleId?: string }) => Promise<any>;
  };

  // Notifications
  notify: {
    success: (msg: string) => void;
    error: (msg: string) => void;
    warning: (msg: string) => void;
    info: (msg: string) => void;
  } & ((msg: string, type: 'success' | 'error' | 'warning' | 'info') => void);

  // Settings
  settings: {
    get: (key: string) => Promise<any>;
    set: (key: string, value: unknown) => Promise<void>;
    getAll: () => Promise<Record<string, string>>;
  };

  // Widgets
  widgets: {
    register: (config: { slotName: string; moduleId: string; component: React.ComponentType; priority?: number }) => void;
    unregister: (widgetId: string) => void;
  };

  // Module communication
  modules: {
    expose: (name: string, fn: (...args: any[]) => any) => void;
    call: <T = unknown>(targetModuleId: string, method: string, args?: unknown) => Promise<T>;
    isInstalled: (moduleId: string) => boolean;
    list: () => Array<{ id: string; name: string; version: string }>;
  };

  // Permissions
  hasPermission: (permissionId: string) => boolean;
  permissions: {
    list: () => string[];
    has: (permissionId: string) => boolean;
  };

  // Context
  getContext: () => {
    hubId: string;
    hubName: string;
    subHubId?: string;
    subHubName?: string;
    userId: string;
    userName: string;
    moduleId?: string;
  };

  // Events
  events: {
    on: (type: string, callback: (event: any) => void) => void;
    off: (type: string, callback: (event: any) => void) => void;
    once: (type: string, callback: (event: any) => void) => void;
  };

  // Audit
  audit: (entry: { action: string; entity: string; entityId: string; description?: string }) => void;

  // Navigation
  navigate: (path: string) => void;

  // Persistent Notifications
  sendNotification: (notification: {
    title: string;
    message: string;
    category?: string;
    severity?: 'info' | 'warning' | 'error';
    actionUrl?: string;
  }) => Promise<void>;

  // Core data (read-only)
  members: { list: () => Promise<any[]>; get: (id: string) => Promise<any> };
  roles: { list: () => Promise<any[]>; get: (id: string) => Promise<any> };
  departments: { list: () => Promise<any[]> };
  subHubs: { list: () => Promise<any[]> };

  // Sync
  sync: {
    getStatus: () => 'idle' | 'syncing' | 'error';
    flush: () => Promise<void>;
    onStatusChange: (callback: (status: string) => void) => void;
  };

  // System
  system: {
    getTimezone: () => string;
    getDateTime: () => Date;
    getLocale: () => string;
    getPlatform: () => 'desktop' | 'mobile' | 'web';
  };

  // Auth - Danger zone operations
  auth: {
    /**
     * Request user to re-enter password for critical operations
     * Returns true if revalidation successful, false if cancelled
     */
    requireRevalidation?: (reason: string) => Promise<boolean>;

    /**
     * Get current user's auth state
     */
    isAuthenticated: () => boolean;

    /**
     * Get time since last password entry (for session timeout)
     */
    getLastActivity: () => Date | null;
  };
}

export const hubbi = window.hubbi;
