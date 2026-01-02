/**
 * Barcode Generator Component
 * 
 * Allows users to generate barcodes for products using different formats.
 * Supports CODE128, EAN13, UPC-A, and QR codes.
 */

import { useState, useRef, useEffect } from 'react';
import { Barcode, Download, Copy, Printer, Check, Package } from 'lucide-react';
import JsBarcode from 'jsbarcode';
import { hubbi } from '../hubbi-sdk.d';
import { InventoryItem } from '../types/inventory';

type BarcodeFormat = 'CODE128' | 'EAN13' | 'UPC' | 'CODE39';

interface BarcodeGeneratorProps {
    item?: InventoryItem;
    onClose?: () => void;
}

export const BarcodeGenerator = ({ item, onClose }: BarcodeGeneratorProps) => {
    const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(item || null);
    const [search, setSearch] = useState(item?.name || '');
    const [results, setResults] = useState<InventoryItem[]>([]);
    const [format, setFormat] = useState<BarcodeFormat>('CODE128');
    const [text, setText] = useState(item?.sku || '');
    const [copied, setCopied] = useState(false);
    const svgRef = useRef<SVGSVGElement>(null);

    // Generate barcode when text or format changes
    useEffect(() => {
        if (svgRef.current && text) {
            try {
                JsBarcode(svgRef.current, text, {
                    format: format,
                    displayValue: true,
                    fontSize: 14,
                    height: 80,
                    margin: 10,
                    background: '#ffffff',
                    lineColor: '#000000'
                });
            } catch (e) {
                console.error('Barcode generation error:', e);
            }
        }
    }, [text, format]);

    const handleSearch = async () => {
        if (!search.trim()) return;
        const data = await hubbi.db.query(
            `SELECT * FROM com_hubbi_inventory_items WHERE name LIKE $1 OR sku LIKE $1 LIMIT 10`,
            [`%${search}%`],
            { moduleId: 'com.hubbi.inventory' }
        );
        setResults(data as InventoryItem[]);
    };

    const selectProduct = (item: InventoryItem) => {
        setSelectedItem(item);
        setText(item.sku || item.id.substring(0, 12));
        setSearch(item.name);
        setResults([]);
    };

    const copyToClipboard = async () => {
        if (svgRef.current) {
            const svgData = new XMLSerializer().serializeToString(svgRef.current);
            const blob = new Blob([svgData], { type: 'image/svg+xml' });
            await navigator.clipboard.write([
                new ClipboardItem({ 'image/svg+xml': blob })
            ]).catch(() => {
                // Fallback: copy text
                navigator.clipboard.writeText(text);
            });
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const downloadSVG = () => {
        if (svgRef.current) {
            const svgData = new XMLSerializer().serializeToString(svgRef.current);
            const blob = new Blob([svgData], { type: 'image/svg+xml' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `barcode-${text}.svg`;
            a.click();
            URL.revokeObjectURL(url);
        }
    };

    const print = () => {
        const printWindow = window.open('', '_blank');
        if (printWindow && svgRef.current) {
            printWindow.document.write(`
                <html>
                <head><title>Barcode - ${text}</title></head>
                <body style="display:flex;justify-content:center;align-items:center;min-height:100vh;margin:0;">
                    ${svgRef.current.outerHTML}
                </body>
                </html>
            `);
            printWindow.document.close();
            printWindow.print();
        }
    };

    return (
        <div className="bg-hubbi-card rounded-xl border border-hubbi-border shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-hubbi-text flex items-center gap-2">
                    <Barcode size={20} className="text-hubbi-primary" />
                    Generador de Códigos de Barra
                </h2>
                {onClose && (
                    <button onClick={onClose} className="text-hubbi-dim hover:text-hubbi-text">✕</button>
                )}
            </div>

            {/* Product Search */}
            <div className="mb-4">
                <label className="block text-sm font-medium text-hubbi-dim mb-1">Producto</label>
                <div className="relative">
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        placeholder="Buscar producto..."
                        className="w-full px-3 py-2 border border-hubbi-border rounded-lg bg-hubbi-input text-hubbi-text"
                    />
                    {results.length > 0 && (
                        <div className="absolute z-10 mt-1 w-full bg-hubbi-card border border-hubbi-border rounded-lg shadow-lg max-h-48 overflow-auto">
                            {results.map(item => (
                                <button
                                    key={item.id}
                                    onClick={() => selectProduct(item)}
                                    className="w-full text-left px-4 py-2 hover:bg-hubbi-bg border-b border-hubbi-border last:border-0"
                                >
                                    <div className="font-medium text-hubbi-text">{item.name}</div>
                                    <div className="text-xs text-hubbi-dim">SKU: {item.sku}</div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Selected Product */}
            {selectedItem && (
                <div className="mb-4 p-3 bg-hubbi-primary/10 rounded-lg flex items-center gap-3">
                    <Package size={20} className="text-hubbi-primary" />
                    <div>
                        <div className="font-medium text-hubbi-text">{selectedItem.name}</div>
                        <div className="text-xs text-hubbi-dim">SKU: {selectedItem.sku}</div>
                    </div>
                </div>
            )}

            {/* Barcode Text */}
            <div className="mb-4">
                <label className="block text-sm font-medium text-hubbi-dim mb-1">Texto del Código</label>
                <input
                    type="text"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Ingresa el código..."
                    className="w-full px-3 py-2 border border-hubbi-border rounded-lg bg-hubbi-input text-hubbi-text font-mono"
                />
            </div>

            {/* Format Selector */}
            <div className="mb-6">
                <label className="block text-sm font-medium text-hubbi-dim mb-1">Formato</label>
                <div className="flex gap-2">
                    {(['CODE128', 'EAN13', 'UPC', 'CODE39'] as BarcodeFormat[]).map(f => (
                        <button
                            key={f}
                            onClick={() => setFormat(f)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${format === f
                                    ? 'bg-hubbi-primary text-hubbi-primary-fg'
                                    : 'bg-hubbi-bg text-hubbi-dim hover:text-hubbi-text'
                                }`}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            {/* Barcode Preview */}
            <div className="mb-6 p-4 bg-white rounded-lg flex justify-center border border-hubbi-border">
                {text ? (
                    <svg ref={svgRef}></svg>
                ) : (
                    <div className="text-gray-400 py-8">Ingresa un texto para generar el código</div>
                )}
            </div>

            {/* Actions */}
            <div className="flex gap-3">
                <button
                    onClick={copyToClipboard}
                    disabled={!text}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-hubbi-bg border border-hubbi-border rounded-lg text-hubbi-text hover:bg-hubbi-border disabled:opacity-50"
                >
                    {copied ? <Check size={18} /> : <Copy size={18} />}
                    {copied ? 'Copiado!' : 'Copiar'}
                </button>
                <button
                    onClick={downloadSVG}
                    disabled={!text}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-hubbi-bg border border-hubbi-border rounded-lg text-hubbi-text hover:bg-hubbi-border disabled:opacity-50"
                >
                    <Download size={18} />
                    Descargar
                </button>
                <button
                    onClick={print}
                    disabled={!text}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-hubbi-primary text-hubbi-primary-fg rounded-lg hover:opacity-90 disabled:opacity-50"
                >
                    <Printer size={18} />
                    Imprimir
                </button>
            </div>
        </div>
    );
};
