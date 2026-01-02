/**
 * Main Inventory Dashboard Component
 * This is the main page rendered when users navigate to the Inventory module
 */
import { useState } from 'react';
import { Sidebar, TabId } from './Sidebar';
import { ProductsTable } from './ProductsTable';
import { MovementsHistory } from './MovementsHistory';
import { TransferDashboard } from './TransferDashboard';
import { StockAlertsPanel } from './StockAlertsPanel';
import { PhysicalAudit } from './PhysicalAudit';
// import { ExcelExport } from './ExcelExport'; // Assuming reports tab uses this or a placeholder
import { OnboardingModal } from './OnboardingModal';
import { ExcelImport } from './ExcelImport';
import { InventoryStats } from './InventoryStats';
import { SuppliersManager } from './SuppliersManager';
import { BarcodeGenerator } from './BarcodeGenerator';

export const InventoryDashboard: React.FC = () => {
    const [activeTab, setActiveTab] = useState<TabId>('overview');
    const [showImport, setShowImport] = useState(false);

    const renderTabContent = () => {
        switch (activeTab) {
            case 'overview':
                return <InventoryStats />;
            case 'products':
                return <ProductsTable />;
            case 'movements':
                return <MovementsHistory />;
            case 'transfers':
                return <TransferDashboard />;
            case 'alerts':
                return <StockAlertsPanel />;
            case 'audit':
                return <PhysicalAudit />;
            case 'suppliers':
                return <SuppliersManager />;
            case 'barcodes':
                return <BarcodeGenerator />;
            case 'reports':
                return (
                    <div className="flex flex-col gap-6">
                        <div className="bg-hubbi-card border border-hubbi-border rounded-xl p-6">
                            <h2 className="text-lg font-semibold text-hubbi-text mb-4">Exportar Datos</h2>
                            <p className="text-hubbi-text-dim mb-6">Descarga reportes de inventario en formato Excel.</p>
                            {/* <ExcelExport onClose={() => {}} /> */}
                            <button className="px-4 py-2 bg-hubbi-primary text-white rounded-lg opacity-50 cursor-not-allowed">
                                Reportes avanzados (WIP)
                            </button>
                        </div>
                    </div>
                );
            default:
                return <ProductsTable />;
        }
    };

    return (
        <div className="flex h-screen w-full bg-hubbi-bg overflow-hidden text-hubbi-text">
            {/* Sidebar Navigation */}
            <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
                {/* Header Strip - Optional if needed for breadcrumbs or top actions */}
                {/* <header className="h-16 bg-hubbi-card border-b border-hubbi-border flex items-center px-6 justify-between shrink-0">
                    <h1 className="text-xl font-bold text-hubbi-text capitalize">{activeTab}</h1>
                </header> */}

                {/* Content Container */}
                <div className="flex-1 overflow-auto p-6 scrollbar-thin scrollbar-thumb-hubbi-border scrollbar-track-transparent">
                    <div className="max-w-7xl mx-auto h-full flex flex-col">
                        {renderTabContent()}
                    </div>
                </div>
            </main>

            {/* Onboarding & Modals */}
            <OnboardingModal
                onClose={() => { }}
                onImport={() => setShowImport(true)}
            />

            {showImport && (
                <ExcelImport
                    onClose={() => setShowImport(false)}
                    onSuccess={(count) => {
                        console.log(`Imported ${count} items`);
                        // Optionally refresh data if needed
                        // Implementation note: ProductsTable listens to events, so it should auto-refresh
                    }}
                />
            )}
        </div>
    );
};

export default InventoryDashboard;
