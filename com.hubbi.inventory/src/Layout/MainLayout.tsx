import { ReactNode } from 'react';
import SidebarPreview from '../pages/Products/TableView/SidebarPreview';
import { useInventoryStore } from '../context/InventoryContext';
import { clsx } from 'clsx';
import { X } from 'lucide-react';

interface MainLayoutProps {
    children?: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
    const { selectedItem, selectItem } = useInventoryStore();

    return (
        <div className="h-full w-full flex flex-col bg-hubbi-card text-hubbi-text overflow-hidden relative">
            <div className="flex-1 flex flex-col h-full min-w-0 bg-hubbi-card">
                {/* Header Area REMOVED from here - moved to individual pages like ProductsView */}

                {/* Main Content Area */}
                <div className="flex-1 flex min-h-0 relative">

                    {/* Primary View (Table or VMS) */}
                    <div className={clsx(
                        "flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out",
                        selectedItem ? "mr-[400px]" : "" // Make space for sidebar
                    )}>
                        {children}
                    </div>

                    {/* Sidebar Preview (Mac-style Overlay/Push) */}
                    <div
                        className={clsx(
                            "absolute top-0 right-0 h-full w-[400px] border-l border-hubbi-border bg-hubbi-card shadow-lg transform transition-transform duration-300 z-50",
                            selectedItem ? "translate-x-0" : "translate-x-full"
                        )}
                    >
                        {selectedItem && (
                            <div className="h-full flex flex-col">
                                {/* Sidebar Header with Close Button */}
                                <div className="p-4 border-b border-hubbi-border flex justify-between items-center bg-hubbi-muted/50 backdrop-blur-sm">
                                    <h3 className="font-semibold text-lg text-hubbi-text">Detalles</h3>
                                    <button
                                        onClick={() => selectItem(null)}
                                        className="p-1 hover:bg-hubbi-muted rounded-md transition-colors text-hubbi-dim hover:text-hubbi-text"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                {/* Content */}
                                <div className="flex-1 overflow-y-auto">
                                    <SidebarPreview />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Backdrop for mobile (optional) */}
                    {selectedItem && (
                        <div
                            className="absolute inset-0 bg-black/20 z-40 lg:hidden"
                            onClick={() => selectItem(null)}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
