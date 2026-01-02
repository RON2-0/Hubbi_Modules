/**
 * Mobile Scanner Component
 * 
 * Uses camera to scan QR codes and barcodes, then queries inventory.
 * Upgraded to @yudiel/react-qr-scanner for React 18 compatibility.
 */

import { useState } from 'react';
import { Scan, X } from 'lucide-react';
import { Scanner } from '@yudiel/react-qr-scanner';
import { hubbi } from '../hubbi-sdk.d';

export const MobileScanner = () => {
    const [scanMode, setScanMode] = useState(false);
    const [result, setResult] = useState<{ name: string; sku: string; stock: number; location: string; } | null>(null);
    const [loading, setLoading] = useState(false);

    const handleScan = async (detectedCodes: { rawValue: string }[]) => {
        if (detectedCodes.length === 0 || loading) return;

        const code = detectedCodes[0].rawValue;
        if (!code) return;

        setScanMode(false);
        setLoading(true);

        try {
            // Query database for the scanned code (SKU or Barcode)
            const items = await hubbi.db.query(
                `SELECT i.name, i.sku, s.quantity, l.name as location_name
                 FROM com_hubbi_inventory_items i
                 LEFT JOIN com_hubbi_inventory_stock s ON i.id = s.item_id
                 LEFT JOIN com_hubbi_inventory_locations l ON s.location_id = l.id
                 WHERE i.sku = $1 OR i.barcode = $1
                 LIMIT 1`,
                [code],
                { moduleId: 'com.hubbi.inventory' }
            );

            if (items && items.length > 0) {
                setResult({
                    name: items[0].name,
                    sku: items[0].sku,
                    stock: items[0].quantity || 0,
                    location: items[0].location_name || 'Sin Ubicación'
                });
                hubbi.notify('Producto encontrado', 'success');
            } else {
                hubbi.notify('Producto no encontrado en inventario', 'warning');
                setResult(null);
            }
        } catch (e) {
            console.error("Scan Error:", e);
            hubbi.notify('Error al buscar producto', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-hubbi-bg">
            {/* Mobile Header */}
            <div className="bg-hubbi-primary text-hubbi-primary-fg p-4 pt-8 shadow-lg sticky top-0 z-20">
                <div className="flex justify-between items-center">
                    <h1 className="text-lg font-bold">Scanner Hubbi</h1>
                    {scanMode && (
                        <div className="bg-white/20 p-2 rounded-full">
                            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                        </div>
                    )}
                </div>
            </div>

            <div className="flex-1 p-4 flex flex-col gap-6 relative">

                {/* Main Action Area */}
                {!scanMode ? (
                    <div className="flex flex-col items-center gap-6 mt-10">
                        <button
                            onClick={() => setScanMode(true)}
                            className="w-48 h-48 bg-hubbi-card rounded-3xl shadow-sm border-2 border-hubbi-border flex flex-col items-center justify-center gap-4 hover:shadow-md transition-all active:scale-95 group"
                        >
                            <div className="bg-hubbi-primary/10 p-6 rounded-full group-hover:bg-hubbi-primary/20 transition-colors">
                                <Scan size={48} className="text-hubbi-primary" />
                            </div>
                            <span className="font-bold text-hubbi-text text-lg">Escanear</span>
                        </button>

                        <p className="text-center text-hubbi-dim text-sm max-w-xs">
                            Apunta la cámara al código de barras o QR del producto para ver detalles y stock.
                        </p>
                    </div>
                ) : (
                    <div className="bg-black rounded-3xl overflow-hidden shadow-2xl relative aspect-[3/4] max-h-[60vh]">
                        <Scanner
                            onScan={handleScan}
                            formats={['qr_code', 'code_128', 'ean_13', 'ean_8', 'upc_a', 'upc_e']}
                            components={{
                                audio: false,
                                torch: true,
                            }}
                            styles={{
                                container: { width: '100%', height: '100%' },
                                video: { width: '100%', height: '100%', objectFit: 'cover' },
                            }}
                        />

                        {/* Overlay Guide */}
                        <div className="absolute inset-0 border-2 border-white/30 rounded-3xl pointer-events-none flex items-center justify-center">
                            <div className="w-64 h-64 border-2 border-white/80 rounded-lg relative">
                                <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-hubbi-primary -mt-0.5 -ml-0.5"></div>
                                <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-hubbi-primary -mt-0.5 -mr-0.5"></div>
                                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-hubbi-primary -mb-0.5 -ml-0.5"></div>
                                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-hubbi-primary -mb-0.5 -mr-0.5"></div>
                            </div>
                        </div>

                        {/* Close Button */}
                        <button
                            onClick={() => setScanMode(false)}
                            className="absolute top-4 right-4 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 backdrop-blur-sm z-30"
                        >
                            <X size={24} />
                        </button>
                    </div>
                )}

                {/* Loading State */}
                {loading && (
                    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center">
                        <div className="bg-hubbi-card p-4 rounded-xl shadow-lg flex items-center gap-3">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-hubbi-primary"></div>
                            <span className="font-medium text-hubbi-text">Buscando producto...</span>
                        </div>
                    </div>
                )}

                {/* Result Card */}
                {result && !scanMode && !loading && (
                    <div className="bg-hubbi-card rounded-xl p-6 shadow-lg border border-hubbi-border animate-in slide-in-from-bottom-5 fade-in">
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <h3 className="font-extrabold text-xl text-hubbi-text leading-tight">{result.name}</h3>
                                <p className="text-hubbi-dim font-mono text-sm mt-1 flex items-center gap-1">
                                    <Scan size={12} /> {result.sku}
                                </p>
                            </div>
                            <div className="bg-hubbi-success/20 text-hubbi-success px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap">
                                En Catálogo
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div className="bg-hubbi-primary/10 p-4 rounded-xl border border-hubbi-primary/20">
                                <span className="text-xs text-hubbi-primary uppercase font-bold block mb-1">Stock Actual</span>
                                <span className="text-3xl font-bold text-hubbi-text">{result.stock}</span>
                            </div>
                            <div className="bg-hubbi-bg p-4 rounded-xl border border-hubbi-border">
                                <span className="text-xs text-hubbi-dim uppercase font-bold block mb-1">Ubicación</span>
                                <span className="text-base font-semibold text-hubbi-text leading-tight">{result.location}</span>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button className="flex-1 bg-hubbi-primary text-hubbi-primary-fg py-3.5 rounded-xl font-bold shadow-lg shadow-hubbi-primary/20 active:opacity-90 transition-colors">
                                Ver Detalles
                            </button>
                            <button className="flex-1 bg-hubbi-card border-2 border-hubbi-border text-hubbi-text py-3.5 rounded-xl font-bold hover:bg-hubbi-bg active:bg-hubbi-border transition-colors">
                                Ajustar
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
