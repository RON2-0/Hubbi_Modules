import SettingsHeader from './SettingsHeader';
import GeneralSettings from './GeneralSettings';
import WarehousesSettings from './WarehousesSettings';
import UnitsSettings from './UnitsSettings';
import CategoriesSettings from './CategoriesSettings';
import GroupsSettings from './GroupsSettings';
import CustomFieldsSettings from './CustomFieldsSettings';

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
            case 'settings-units':
                return <UnitsSettings />;
            case 'settings-categories':
                return <CategoriesSettings />;
            case 'settings-groups':
                return <GroupsSettings />;
            case 'settings-custom-fields':
                return <CustomFieldsSettings />;
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
