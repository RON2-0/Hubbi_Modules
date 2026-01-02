/**
 * Sticker Print Dialog Component
 *
 * Print product labels/stickers with barcode, name, price.
 * Supports multiple sticker sizes and templates.
 */

import { useState, useRef, useEffect } from 'react';
import { Printer, X, Settings, Grid3X3 } from 'lucide-react';
import JsBarcode from 'jsbarcode';
import { InventoryItem } from '../types/inventory';

interface StickerPrintDialogProps {
    items: InventoryItem[];
    onClose: () => void;
}

type StickerSize = 'small' | 'medium' | 'large';

const STICKER_SIZES: Record<StickerSize, { width: string; height: string; label: string }> = {
    small: { width: '2in', height: '1in', label: '2" x 1" (Pequeño)' },
    medium: { width: '3in', height: '2in', label: '3" x 2" (Mediano)' },
    large: { width: '4in', height: '3in', label: '4" x 3" (Grande)' },
};

export const StickerPrintDialog = ({ items, onClose }: StickerPrintDialogProps) => {
    const [size, setSize] = useState<StickerSize>('medium');
    const [copies, setCopies] = useState(1);
    const [showPrice, setShowPrice] = useState(true);
    const [showSKU, setShowSKU] = useState(true);
    const printRef = useRef<HTMLDivElement>(null);

    // Generate barcodes after render
    useEffect(() => {
        items.forEach((item, idx) => {
            const svg = document.getElementById(`barcode-${idx}`) as SVGElement | null;
            if (svg && item.sku) {
                try {
                    JsBarcode(svg, item.sku, {
                        format: 'CODE128',
                        displayValue: false,
                        height: size === 'small' ? 30 : size === 'medium' ? 50 : 70,
                        margin: 0,
                        background: '#ffffff',
                        lineColor: '#000000'
                    });
                } catch (e) {
                    console.error('Barcode error:', e);
                }
            }
        });
    }, [items, size]);

    const handlePrint = () => {
        const printContent = printRef.current;
        if (!printContent) return;

        const printWindow = window.open('', '_blank');
        if (printWindow) {
            const sizeConfig = STICKER_SIZES[size];
            printWindow.document.write(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Stickers</title>
                    <style>
                        @page {
                            size: ${sizeConfig.width} ${sizeConfig.height};
                            margin: 0;
                        }
                        body {
                            margin: 0;
                            padding: 0;
                            font-family: Arial, sans-serif;
                        }
                        .sticker {
                            width: ${sizeConfig.width};
                            height: ${sizeConfig.height};
                            padding: 8px;
                            box-sizing: border-box;
                            display: flex;
                            flex-direction: column;
                            justify-content: center;
                            align-items: center;
                            page-break-after: always;
                            text-align: center;
                        }
                        .sticker:last-child {
                            page-break-after: avoid;
                        }
                        .name {
                            font-weight: bold;
                            font-size: ${size === 'small' ? '10px' : size === 'medium' ? '14px' : '18px'};
                            margin-bottom: 4px;
                            max-width: 100%;
                            overflow: hidden;
                            text-overflow: ellipsis;
                            white-space: nowrap;
                        }
                        .sku {
                            font-size: ${size === 'small' ? '8px' : '10px'};
                            color: #666;
                            margin-bottom: 4px;
                        }
                        .barcode {
                            margin: 4px 0;
                        }
                        .price {
                            font-size: ${size === 'small' ? '12px' : size === 'medium' ? '16px' : '20px'};
                            font-weight: bold;
                            margin-top: 4px;
                        }
                    </style>
                </head>
                <body>
                    ${printContent.innerHTML}
                </body>
                </html>
            `);
            printWindow.document.close();
            setTimeout(() => {
                printWindow.print();
                printWindow.close();
            }, 250);
        }
    };

    // Generate stickers array based on copies
    const stickers: InventoryItem[] = [];
    items.forEach(item => {
        for (let i = 0; i < copies; i++) {
            stickers.push(item);
        }
    });

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-hubbi-card rounded-xl shadow-2xl w-full max-w-2xl mx-4 border border-hubbi-border max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-hubbi-border shrink-0">
                    <h2 className="text-lg font-semibold text-hubbi-text flex items-center gap-2">
                        <Printer size={20} className="text-hubbi-primary" />
                        Imprimir Stickers ({items.length} productos)
                    </h2>
                    <button onClick={onClose} className="p-1 hover:bg-hubbi-bg rounded">
                        <X size={20} className="text-hubbi-dim" />
                    </button>
                </div>

                {/* Settings */}
                <div className="p-6 border-b border-hubbi-border shrink-0">
                    <div className="flex items-center gap-2 mb-4 text-hubbi-dim">
                        <Settings size={16} />
                        <span className="text-sm font-medium">Configuración</span>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Size */}
                        <div>
                            <label className="block text-sm font-medium text-hubbi-dim mb-1">Tamaño de Sticker</label>
                            <select
                                value={size}
                                onChange={(e) => setSize(e.target.value as StickerSize)}
                                className="w-full px-3 py-2 border border-hubbi-border rounded-lg bg-hubbi-input text-hubbi-text"
                            >
                                {Object.entries(STICKER_SIZES).map(([key, val]) => (
                                    <option key={key} value={key}>{val.label}</option>
                                ))}
                            </select>
                        </div>

                        {/* Copies */}
                        <div>
                            <label className="block text-sm font-medium text-hubbi-dim mb-1">Copias por Producto</label>
                            <input
                                type="number"
                                min={1}
                                max={100}
                                value={copies}
                                onChange={(e) => setCopies(Math.max(1, parseInt(e.target.value) || 1))}
                                className="w-full px-3 py-2 border border-hubbi-border rounded-lg bg-hubbi-input text-hubbi-text"
                            />
                        </div>
                    </div>

                    <div className="flex gap-4 mt-4">
                        <label className="flex items-center gap-2 text-sm text-hubbi-text cursor-pointer">
                            <input
                                type="checkbox"
                                checked={showPrice}
                                onChange={(e) => setShowPrice(e.target.checked)}
                                className="rounded border-hubbi-border"
                            />
                            Mostrar Precio
                        </label>
                        <label className="flex items-center gap-2 text-sm text-hubbi-text cursor-pointer">
                            <input
                                type="checkbox"
                                checked={showSKU}
                                onChange={(e) => setShowSKU(e.target.checked)}
                                className="rounded border-hubbi-border"
                            />
                            Mostrar SKU
                        </label>
                    </div>
                </div>

                {/* Preview */}
                <div className="flex-1 overflow-auto p-6">
                    <div className="flex items-center gap-2 mb-4 text-hubbi-dim">
                        <Grid3X3 size={16} />
                        <span className="text-sm font-medium">Vista Previa ({stickers.length} stickers)</span>
                    </div>

                    <div ref={printRef} className="flex flex-wrap gap-4 justify-center">
                        {stickers.map((item, idx) => (
                            <div
                                key={`${item.id}-${idx}`}
                                className="sticker bg-white border border-gray-200 rounded-lg p-3 flex flex-col items-center justify-center text-center"
                                style={{
                                    width: size === 'small' ? '150px' : size === 'medium' ? '200px' : '250px',
                                    height: size === 'small' ? '75px' : size === 'medium' ? '130px' : '180px',
                                }}
                            >
                                <div className="name font-bold text-black truncate w-full" style={{ fontSize: size === 'small' ? '10px' : '14px' }}>
                                    {item.name}
                                </div>
                                {showSKU && (
                                    <div className="sku text-gray-500" style={{ fontSize: size === 'small' ? '8px' : '10px' }}>
                                        SKU: {item.sku}
                                    </div>
                                )}
                                <svg id={`barcode-${idx}`} className="barcode my-1"></svg>
                                {showPrice && (
                                    <div className="price text-black font-bold" style={{ fontSize: size === 'small' ? '12px' : '16px' }}>
                                        ${item.price_base?.toFixed(2) || '0.00'}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 px-6 py-4 border-t border-hubbi-border bg-hubbi-bg rounded-b-xl shrink-0">
                    <button onClick={onClose} className="px-4 py-2 text-hubbi-text hover:bg-hubbi-border rounded-lg">
                        Cancelar
                    </button>
                    <button
                        onClick={handlePrint}
                        className="px-4 py-2 bg-hubbi-primary text-hubbi-primary-fg rounded-lg hover:opacity-90 flex items-center gap-2"
                    >
                        <Printer size={16} />
                        Imprimir {stickers.length} Stickers
                    </button>
                </div>
            </div>
        </div>
    );
};
