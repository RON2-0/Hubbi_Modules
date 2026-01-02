import { useState, useEffect } from 'react';
import { Package, Upload, X, ArrowRight, Database } from 'lucide-react';
import { hubbi } from '../hubbi-sdk.d';

interface OnboardingModalProps {
    onClose: () => void;
    onImport: () => void;
}

export const OnboardingModal = ({ onClose, onImport }: OnboardingModalProps) => {
    const [isVisible, setIsVisible] = useState(false);
    const [checking, setChecking] = useState(true);

    useEffect(() => {
        const checkFirstTime = async () => {
            try {
                // Check if we have any products
                const products = await hubbi.db.query(
                    'SELECT count(*) as count FROM com_hubbi_inventory_items',
                    [],
                    { moduleId: 'com.hubbi.inventory' }
                );

                const count = (products[0] as { count: number }).count;

                // Also check if user has already dismissed it
                const dismissed = await hubbi.settings.get('inventory_onboarding_dismissed');

                if (count === 0 && !dismissed) {
                    setIsVisible(true);
                }
            } catch (err) {
                console.error('Error checking onboarding status:', err);
            } finally {
                setChecking(false);
            }
        };

        checkFirstTime();
    }, []);

    const handleDismiss = async () => {
        setIsVisible(false);
        await hubbi.settings.set('inventory_onboarding_dismissed', true);
        onClose();
    };

    const handleImportClick = async () => {
        setIsVisible(false);
        await hubbi.settings.set('inventory_onboarding_dismissed', true);
        onImport();
    };

    if (checking || !isVisible) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full border border-gray-100 dark:border-gray-700 overflow-hidden animate-in fade-in zoom-in duration-300">
                <div className="relative">
                    {/* Hero pattern background */}
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-indigo-700 opacity-10"></div>
                    <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>

                    <div className="relative p-8">
                        <button
                            onClick={handleDismiss}
                            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                        >
                            <X size={20} />
                        </button>

                        <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mb-6 text-blue-600 dark:text-blue-400">
                            <Package size={32} strokeWidth={1.5} />
                        </div>

                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
                            Bienvenido a Inventario
                        </h2>
                        <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 max-w-md">
                            Tu espacio de trabajo está vacío. Vamos a configurar tus productos para empezar a gestionar tu stock.
                        </p>

                        <div className="grid md:grid-cols-2 gap-4">
                            <button
                                onClick={handleImportClick}
                                className="group relative overflow-hidden rounded-xl p-6 bg-white dark:bg-gray-700 border-2 border-blue-100 dark:border-blue-900/50 hover:border-blue-500 dark:hover:border-blue-400 transition-all text-left shadow-sm hover:shadow-md"
                            >
                                <div className="mb-4 w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center text-green-600 dark:text-green-400 group-hover:scale-110 transition-transform">
                                    <Upload size={20} />
                                </div>
                                <h3 className="font-semibold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
                                    Importar Excel
                                    <ArrowRight size={16} className="opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0" />
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Carga masiva de productos y stock inicial desde un archivo.
                                </p>
                            </button>

                            <button
                                onClick={handleDismiss}
                                className="group relative overflow-hidden rounded-xl p-6 bg-gray-50 dark:bg-gray-700/50 border-2 border-transparent hover:border-gray-300 dark:hover:border-gray-600 transition-all text-left"
                            >
                                <div className="mb-4 w-10 h-10 bg-gray-200 dark:bg-gray-600/50 rounded-lg flex items-center justify-center text-gray-600 dark:text-gray-300 group-hover:scale-110 transition-transform">
                                    <Database size={20} />
                                </div>
                                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                                    Crear Manualmente
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Añade productos uno por uno desde el formulario.
                                </p>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
