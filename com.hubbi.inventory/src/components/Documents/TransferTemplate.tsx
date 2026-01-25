import React from 'react';
// import { format } from 'date-fns'; // Assuming date-fns might be available, or use native Intl

export interface TransferDocumentProps {
    transactionId: string;
    date: Date | string;
    type: 'IN' | 'OUT' | 'TRANSFER' | 'ADJUSTMENT';
    status: string;

    sourceWarehouse?: string;
    destinationWarehouse?: string;

    requestedBy: string;
    approvedBy?: string;

    items: Array<{
        sku: string;
        name: string;
        quantity: number;
        uom: string;
        notes?: string;
    }>;

    notes?: string;
}

export const TransferTemplate = React.forwardRef<HTMLDivElement, TransferDocumentProps>((props, ref) => {

    const formatDate = (d: Date | string) => {
        return new Date(d).toLocaleDateString('es-ES', {
            year: 'numeric', month: 'long', day: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    return (
        <div ref={ref} className="bg-white text-black p-10 max-w-[210mm] mx-auto min-h-[297mm] text-sm font-sans leading-relaxed">

            {/* Header */}
            <div className="flex justify-between items-start border-b-2 border-black pb-6 mb-8">
                <div>
                    {/* Placeholder for Logo - In real app, render <img src={logoUrl} /> */}
                    <div className="text-3xl font-black uppercase tracking-tighter mb-1">Hubbi</div>
                    <div className="text-xs text-gray-500 uppercase tracking-widest">Gestión Inteligente de Inventario</div>
                </div>
                <div className="text-right">
                    <h1 className="text-2xl font-bold uppercase mb-1">Comprobante de Movimiento</h1>
                    <div className="font-mono text-lg text-gray-600">#{props.transactionId.split('-')[0].toUpperCase()}</div>
                    <div className="mt-2 text-xs font-bold px-2 py-1 bg-gray-100 inline-block border border-gray-300 rounded">
                        {props.type} - {props.status}
                    </div>
                </div>
            </div>

            {/* Meta Data */}
            <div className="grid grid-cols-2 gap-8 mb-8">
                <div className="space-y-1">
                    <div className="grid grid-cols-[100px_1fr]">
                        <span className="font-bold text-gray-500 uppercase text-xs">Fecha:</span>
                        <span>{formatDate(props.date)}</span>
                    </div>
                    <div className="grid grid-cols-[100px_1fr]">
                        <span className="font-bold text-gray-500 uppercase text-xs">Solicitado por:</span>
                        <span>{props.requestedBy}</span>
                    </div>
                    {props.approvedBy && (
                        <div className="grid grid-cols-[100px_1fr]">
                            <span className="font-bold text-gray-500 uppercase text-xs">Aprobado por:</span>
                            <span>{props.approvedBy}</span>
                        </div>
                    )}
                </div>

                <div className="space-y-1">
                    {props.sourceWarehouse && (
                        <div className="grid grid-cols-[100px_1fr]">
                            <span className="font-bold text-gray-500 uppercase text-xs">Origen:</span>
                            <span>{props.sourceWarehouse}</span>
                        </div>
                    )}
                    {props.destinationWarehouse && (
                        <div className="grid grid-cols-[100px_1fr]">
                            <span className="font-bold text-gray-500 uppercase text-xs">Destino:</span>
                            <span>{props.destinationWarehouse}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Items Table */}
            <div className="mb-8">
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="border-b-2 border-black">
                            <th className="text-left py-2 font-black uppercase text-xs">SKU</th>
                            <th className="text-left py-2 font-black uppercase text-xs w-1/2">Descripción</th>
                            <th className="text-right py-2 font-black uppercase text-xs">Cant.</th>
                            <th className="text-left py-2 pl-2 font-black uppercase text-xs">Unidad</th>
                        </tr>
                    </thead>
                    <tbody>
                        {props.items.map((item, idx) => (
                            <tr key={idx} className="border-b border-gray-200">
                                <td className="py-3 font-mono text-xs">{item.sku}</td>
                                <td className="py-3">
                                    <div className="font-bold">{item.name}</div>
                                    {item.notes && <div className="text-xs text-gray-500 italic">{item.notes}</div>}
                                </td>
                                <td className="py-3 text-right font-mono text-base">{item.quantity}</td>
                                <td className="py-3 pl-2 text-xs text-gray-500">{item.uom}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Notes */}
            {props.notes && (
                <div className="mb-12 p-4 bg-gray-50 border border-gray-200 rounded">
                    <h4 className="font-bold text-xs uppercase text-gray-500 mb-1">Notas Adicionales</h4>
                    <p className="italic">{props.notes}</p>
                </div>
            )}

            {/* Signatures */}
            <div className="grid grid-cols-2 gap-12 mt-20 page-break-inside-avoid">
                <div className="border-t border-black pt-2">
                    <div className="font-bold uppercase text-xs mb-8">Entregado por</div>
                    <div className="h-0"></div>
                    {/* Space for manual signature */}
                </div>
                <div className="border-t border-black pt-2">
                    <div className="font-bold uppercase text-xs mb-8">Recibido por</div>
                    <div className="h-0"></div>
                </div>
            </div>

            <div className="mt-12 text-center text-xs text-gray-400 uppercase">
                Generado por Hubbi Inventory System
            </div>

            <style>{`
                @media print {
                    @page { margin: 10mm; size: auto; }
                    body { -webkit-print-color-adjust: exact; }
                }
            `}</style>
        </div>
    );
});

TransferTemplate.displayName = "TransferTemplate";
