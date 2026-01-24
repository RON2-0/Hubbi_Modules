import SettingsHeader from './SettingsHeader';
import GeneralSettings from './GeneralSettings';
import WarehousesSettings from './WarehousesSettings';
import { PlaceholderPage } from '../../components/PlaceholderPage';

interface SettingsViewProps {
    currentRoute: string; // 'settings', 'settings-warehouses', etc.
}

export default function SettingsView({ currentRoute }: SettingsViewProps) {

    // Render content based on sub-route
    const renderContent = () => {
        switch (currentRoute) {
            case 'settings-general':
            case 'settings':
                return <GeneralSettings />;
            case 'settings-warehouses':
                return <WarehousesSettings />;
            case 'settings-categories':
                return <PlaceholderPage title="Categorías" description="Define la jerarquía de productos." />;
            case 'settings-groups':
                return <PlaceholderPage title="Grupos y Familias" description="Agrupación avanzada de inventario." />;
            case 'settings-custom-fields':
                return <PlaceholderPage title="Campos Personalizados" description="Define atributos extra para tus productos." />;
            default:
                return <GeneralSettings />;
        }
    };

    return (
        <div className="h-full w-full flex flex-col bg-hubbi-card">
            <SettingsHeader activeTab={currentRoute} />
            <div className="flex-1 overflow-y-auto min-h-0 relative">
                {renderContent()}
            </div>
        </div>
    );
}
