import { useInventoryStore } from '../../../context/InventoryContext';
import InventoryTable from './InventoryTable';
import WmsView from '../WMS/WmsView';
import ProductsHeader from '../ProductsHeader';

export default function ProductsView() {
    const { viewMode } = useInventoryStore();

    return (
        <div className="h-full w-full flex flex-col">
            <ProductsHeader />
            <div className="flex-1 relative min-h-0">
                {/* 
                  We use absolute positioning or conditional rendering. 
                  Conditional rendering is better for performance (removes WebGL context).
                  But usually map/table toggle preserves state.
                  For now, hard switch.
                */}
                {viewMode === 'table' ? (
                    <InventoryTable />
                ) : (
                    <WmsView />
                )}
            </div>
        </div>
    );
}
