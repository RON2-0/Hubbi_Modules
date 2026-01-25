
import React from 'react';
import { useScannerListener } from '../hooks/useScannerListener';
import { InventoryItem } from '../types/inventory';

export const GlobalScannerHandler: React.FC = () => {

    const handleScan = async (barcode: string) => {
        console.log("Global Scan Detected:", barcode);

        // 1. Search in DB (SKU or Barcode in item_uoms)
        try {
            // Check by SKU first
            let items = await window.hubbi.db.query<InventoryItem>(
                "SELECT * FROM items WHERE sku = ?",
                [barcode],
                { moduleId: 'com.hubbi.inventory' }
            );

            // If not found, check additional UOM barcodes
            if (items.length === 0) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const uomItems = await window.hubbi.db.query<any>(
                    "SELECT i.* FROM items i JOIN item_uoms u ON i.id = u.item_id WHERE u.barcode = ?",
                    [barcode],
                    { moduleId: 'com.hubbi.inventory' }
                );
                if (uomItems.length > 0) {
                    items = uomItems;
                }
            }

            if (items.length > 0) {
                const item = items[0];
                window.hubbi.notify(`Producto encontrado: ${item.name}`, 'success');

                // Navigate to product details
                // Assuming we use Query Params for details or filter
                window.hubbi.navigate(`/products?search=${item.sku}`);

                // Ideally, we might want to open a "Quick View" modal here directly
                // But navigation is a safe bet for now.
            } else {
                window.hubbi.notify(`Código no encontrado: ${barcode}`, 'info');
            }

        } catch (e) {
            console.error("Scan Error", e);
        }
    };

    useScannerListener({
        onScan: handleScan,
        minLength: 3
    });

    // This component renders nothing physically
    return null;
};
