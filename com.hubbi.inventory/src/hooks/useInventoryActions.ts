import { useState } from 'react';
import { InventoryItem } from '../types/inventory';
import { hubbi as _hubbi } from '../hubbi-sdk.d';

export const useInventoryActions = () => {
  const [loading, setLoading] = useState(false);

  const createItem = async (item: Omit<InventoryItem, 'id' | 'created_at' | 'updated_at'>) => {
    setLoading(true);
    try {
      // Generate client-side UUID if not provided by SDK
      const newItem = {
        ...item,
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Online-First Strategy:
      // hubbi.data.create handles the logic: Try Cloud -> Fail? -> Save Local & Enqueue Sync
      // We rely on window.hubbi being present at runtime
      const sdk = window.hubbi;

      const result = await sdk.data.create({
        table: 'com_hubbi_inventory_items',
        data: newItem,
        options: { strategy: 'online_first' }
      });

      if (result.error) throw result.error;

      if (result.offline) {
        sdk.notify.warning('Guardado localmente. Se sincronizará al recuperar conexión.');
      } else {
        sdk.notify.success('Producto creado exitosamente.');
      }

      return { success: true, data: newItem };
    } catch (error: unknown) {
      console.error('Error creating item:', error);
      if (window.hubbi) {
        window.hubbi.notify.error('Error al crear el producto: ' + (error instanceof Error ? error.message : String(error)));
      }
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  return {
    createItem,
    loading
  };
};
