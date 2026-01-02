import { useState, useEffect } from 'react';
import { Share2, Check, X, Truck, ArrowRight, Clock } from 'lucide-react';
import { hubbi } from '../hubbi-sdk.d';

interface TransferRequest {
    id: string;
    source_location_id: string;
    target_location_id: string;
    status: 'pending' | 'approved' | 'rejected' | 'in_transit' | 'received';
    items: { item_id: string; quantity: number; item_name?: string }[];
    requested_by: string;
    created_at: string;
}

export const TransferDashboard = () => {
    const [requests, setRequests] = useState<TransferRequest[]>([]);
    // const [loading, setLoading] = useState(true);

    const fetchRequests = async () => {
        // setLoading(true);
        // Mock join for location names would be needed in real app
        const data = await hubbi.data.query(`SELECT * FROM com_hubbi_inventory_transfer_requests ORDER BY created_at DESC`);
        if (data && Array.isArray(data)) {
            // Parse JSON items
            const parsed = data.map(r => ({
                ...r,
                items: typeof r.items === 'string' ? JSON.parse(r.items) : r.items
            }));
            setRequests(parsed);
        }
        // setLoading(false);
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    const handleAction = async (id: string, action: 'approved' | 'rejected' | 'in_transit' | 'received') => {
        await hubbi.data.update({
            table: 'com_hubbi_inventory_transfer_requests',
            id,
            data: { status: action, updated_at: new Date().toISOString() },
            options: { strategy: 'online_first' }
        });

        // If approved/in_transit, ideally trigger Inventory Movement logic here 
        // using useInventoryMovements hook logic (but context-free).
        // For 'received', we would create the IN movement at target.

        hubbi.notify.success(`Solicitud ${action}`);
        fetchRequests();
    };

    const getStatusColor = (s: string) => {
        switch (s) {
            case 'pending': return 'bg-yellow-100 text-yellow-800';
            case 'approved': return 'bg-blue-100 text-blue-800';
            case 'in_transit': return 'bg-purple-100 text-purple-800';
            case 'received': return 'bg-green-100 text-green-800';
            case 'rejected': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="bg-hubbi-card rounded-xl border border-hubbi-border shadow-sm h-full flex flex-col">
            <div className="p-4 border-b border-hubbi-border flex items-center justify-between">
                <h3 className="font-semibold text-hubbi-text flex items-center gap-2">
                    <Share2 size={18} className="text-hubbi-primary" />
                    Gestión de Traslados
                </h3>
                <button
                    onClick={fetchRequests}
                    className="p-2 hover:bg-hubbi-bg rounded-full text-hubbi-dim"
                >
                    <Clock size={16} />
                </button>
            </div>

            <div className="flex-1 overflow-auto p-4 space-y-4">
                {requests.length === 0 ? (
                    <div className="text-center py-10 text-hubbi-dim">No hay solicitudes de traslado activas</div>
                ) : (
                    requests.map(req => (
                        <div key={req.id} className="border border-hubbi-border rounded-lg p-4 flex flex-col gap-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-sm text-hubbi-dim">
                                    <span className="font-medium text-hubbi-text">#{req.source_location_id.substring(0, 4)}...</span>
                                    <ArrowRight size={14} />
                                    <span className="font-medium text-hubbi-text">#{req.target_location_id.substring(0, 4)}...</span>
                                </div>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium uppercase ${getStatusColor(req.status)}`}>
                                    {req.status.replace('_', ' ')}
                                </span>
                            </div>

                            <div className="bg-hubbi-bg p-3 rounded text-sm text-hubbi-dim space-y-1">
                                {req.items.map((item, idx) => (
                                    <div key={idx} className="flex justify-between">
                                        <span>Item ID: {item.item_id.substring(0, 8)}...</span>
                                        <span className="font-mono font-medium">x{item.quantity}</span>
                                    </div>
                                ))}
                            </div>

                            {req.status === 'pending' && (
                                <div className="flex justify-end gap-2 pt-2 border-t border-hubbi-border">
                                    <button
                                        onClick={() => handleAction(req.id, 'rejected')}
                                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-hubbi-danger hover:bg-hubbi-danger/10 rounded bg-hubbi-card border border-hubbi-danger/30"
                                    >
                                        <X size={14} /> Rechazar
                                    </button>
                                    <button
                                        onClick={() => handleAction(req.id, 'approved')}
                                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-hubbi-success hover:bg-hubbi-success/10 rounded bg-hubbi-card border border-hubbi-success/30"
                                    >
                                        <Check size={14} /> Aprobar
                                    </button>
                                </div>
                            )}

                            {req.status === 'approved' && (
                                <div className="flex justify-end gap-2 pt-2">
                                    <button
                                        onClick={() => handleAction(req.id, 'in_transit')}
                                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-purple-400 hover:bg-purple-500/10 rounded bg-hubbi-card border border-purple-400/30"
                                    >
                                        <Truck size={14} /> Despachar (Enviar)
                                    </button>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
