
import React, { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { Printer, X, FileText } from 'lucide-react';
import { Button } from '../../../../../Hubbi/src/components/ui/Button';
import { TransferTemplate, TransferDocumentProps } from './TransferTemplate';

interface Props {
    open: boolean;
    onClose: () => void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    transaction: any; // Ideally this should be a proper Transaction Interface
}

export const DocumentViewerModal: React.FC<Props> = ({ open, onClose, transaction }) => {
    const componentRef = useRef<HTMLDivElement>(null);
    const templateProps = React.useMemo(() => {
        if (!transaction || !open) return null;

        return {
            transactionId: transaction.id || 'Unknown',
            date: transaction.timestamp || new Date(),
            type: transaction.type || 'TRANSFER',
            status: transaction.status || 'COMPLETED',
            requestedBy: transaction.requested_by || 'Usuario Actual',
            sourceWarehouse: transaction.from_warehouse_name || 'N/A',
            destinationWarehouse: transaction.to_warehouse_name || 'N/A',
            items: transaction.items || [], // Assumes transaction has populated items
            notes: transaction.reason || ''
        } as TransferDocumentProps;
    }, [transaction, open]);

    const handlePrint = useReactToPrint({
        contentRef: componentRef,
        documentTitle: transaction ? `Movimiento_${transaction.id}` : 'Documento',
    });

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="absolute inset-0" onClick={onClose}></div>

            <div className="relative bg-hubbi-card w-full max-w-5xl h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>

                {/* Toolbar */}
                <div className="flex items-center justify-between p-4 border-b border-hubbi-border bg-hubbi-muted/10">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-lg">
                            <FileText size={20} />
                        </div>
                        <div>
                            <h3 className="font-bold text-hubbi-text">Vista Previa de Documento</h3>
                            <p className="text-xs text-hubbi-dim">#{transaction?.id?.substring(0, 8)}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button onClick={handlePrint} className="gap-2">
                            <Printer size={16} /> Imprimir
                        </Button>
                        <button onClick={onClose} className="p-2 hover:bg-hubbi-muted rounded-full">
                            <X size={20} className="text-hubbi-dim" />
                        </button>
                    </div>
                </div>

                {/* Preview Area */}
                <div className="flex-1 overflow-auto bg-gray-100 dark:bg-neutral-900 p-8 flex justify-center">
                    <div className="shadow-xl">
                        {templateProps && (
                            <TransferTemplate ref={componentRef} {...templateProps} />
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};
