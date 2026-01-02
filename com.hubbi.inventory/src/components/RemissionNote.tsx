import { Truck } from 'lucide-react';

interface TransferRequest {
    id: string;
    source_location_id: string;
    target_location_id: string;
    status: string;
    items: { item_id: string; quantity: number; item_name?: string; sku?: string }[];
    requested_by: string;
    created_at: string;
}

interface RemissionNoteProps {
    data: TransferRequest;
    companyName?: string;
}

export const RemissionNote = ({ data, companyName = "MI EMPRESA S.A. DE C.V." }: RemissionNoteProps) => {
    return (
        <div className="bg-white p-8 max-w-2xl mx-auto border border-gray-200 shadow-sm print:shadow-none print:border-0" id="printable-remission">

            {/* Header */}
            <div className="flex justify-between items-start border-b border-gray-800 pb-4 mb-6">
                <div>
                    <h1 className="text-xl font-bold text-gray-900 uppercase tracking-widest">{companyName}</h1>
                    <p className="text-xs text-gray-500 mt-1">Giro: Venta de Repuestos y Servicios</p>
                    <p className="text-xs text-gray-500">San Salvador, El Salvador</p>
                </div>
                <div className="text-right">
                    <div className="inline-flex items-center gap-2 border-2 border-gray-900 px-3 py-1 rounded">
                        <Truck size={20} className="text-gray-900" />
                        <span className="font-bold text-lg">NOTA DE REMISIÓN</span>
                    </div>
                    <p className="text-sm font-mono mt-2 text-gray-600">REF: {data.id.substring(0, 8).toUpperCase()}</p>
                    <p className="text-xs text-gray-400">{new Date(data.created_at).toLocaleDateString()}</p>
                </div>
            </div>

            {/* Info */}
            <div className="grid grid-cols-2 gap-8 mb-8 text-sm">
                <div>
                    <h3 className="font-bold text-gray-900 mb-1 border-b border-gray-300 inline-block">ORIGEN (BODEGA)</h3>
                    <p className="font-mono text-gray-600 mt-1">{data.source_location_id}</p>
                </div>
                <div>
                    <h3 className="font-bold text-gray-900 mb-1 border-b border-gray-300 inline-block">DESTINO (SUCURSAL)</h3>
                    <p className="font-mono text-gray-600 mt-1">{data.target_location_id}</p>
                </div>
            </div>

            {/* Items */}
            <table className="w-full text-left text-sm mb-8">
                <thead className="border-b-2 border-gray-800">
                    <tr>
                        <th className="py-2 font-bold text-gray-900">CODIGO</th>
                        <th className="py-2 font-bold text-gray-900">DESCRIPCION</th>
                        <th className="py-2 font-bold text-gray-900 text-right">CANTIDAD</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                    {data.items.map((item, i) => (
                        <tr key={i}>
                            <td className="py-2 text-gray-600 font-mono">{item.sku || item.item_id.substring(0, 6)}</td>
                            <td className="py-2 text-gray-900">{item.item_name || "Item " + item.item_id}</td>
                            <td className="py-2 text-gray-900 text-right font-medium">{item.quantity}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Footer Signatures */}
            <div className="grid grid-cols-3 gap-8 mt-12 pt-8 border-t border-gray-200">
                <div className="text-center">
                    <div className="h-16 border-b border-gray-300 mb-2"></div>
                    <p className="text-xs font-bold text-gray-500 uppercase">Solicitado Por</p>
                    <p className="text-xs text-gray-400">{data.requested_by}</p>
                </div>
                <div className="text-center">
                    <div className="h-16 border-b border-gray-300 mb-2"></div>
                    <p className="text-xs font-bold text-gray-500 uppercase">Despachado Por</p>
                </div>
                <div className="text-center">
                    <div className="h-16 border-b border-gray-300 mb-2"></div>
                    <p className="text-xs font-bold text-gray-500 uppercase">Recibido Por (Sello)</p>
                </div>
            </div>

            <div className="mt-8 text-center text-[10px] text-gray-400">
                Documento interno de traslado. No válido como comprobante fiscal de venta.
                Generado por Hubbi Inventory Module.
            </div>
        </div>
    );
};
