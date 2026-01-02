import { useState } from 'react';
import { Scan } from 'lucide-react';

export const MobileScanner = () => {
    const [scanMode, setScanMode] = useState(false);
    const [result, setResult] = useState<{ name: string; sku: string; stock: number; location: string; } | null>(null);

    const handleScan = (code: string) => {
        // setScannedCode(code);
        setScanMode(false);
        // Simulate fetch
        setTimeout(() => {
            setResult({
                name: "Filtro Aceite Toyota",
                sku: code,
                stock: 15,
                location: "Estante A-02"
            });
        }, 500);
    };

    return (
        <div className="flex flex-col h-full bg-gray-50">
            {/* Mobile Header */}
            <div className="bg-blue-600 text-white p-4 pt-8 shadow-lg sticky top-0 z-20">
                <div className="flex justify-between items-center">
                    <h1 className="text-lg font-bold">Scanner Hubbi</h1>
                    <div className="bg-white/20 p-2 rounded-full">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    </div>
                </div>
            </div>

            <div className="flex-1 p-4 flex flex-col gap-6">

                {/* Big Action Button */}
                {!scanMode ? (
                    <button
                        onClick={() => setScanMode(true)}
                        className="w-full aspect-square max-w-[200px] mx-auto bg-white rounded-3xl shadow-sm border-2 border-blue-100 flex flex-col items-center justify-center gap-4 hover:shadow-md transition-all active:scale-95"
                    >
                        <div className="bg-blue-600 p-4 rounded-full shadow-lg shadow-blue-600/30">
                            <Scan size={32} className="text-white" />
                        </div>
                        <span className="font-bold text-gray-600">Escanear</span>
                    </button>
                ) : (
                    <div className="bg-gray-900 rounded-2xl aspect-[4/3] flex items-center justify-center relative overflow-hidden">
                        <div className="absolute inset-0 border-2 border-red-500/50 animate-pulse"></div>
                        <p className="text-white/50 text-sm">Cámara activa (Simulada)</p>
                        <div className="absolute bottom-4 flex gap-4">
                            <button onClick={() => handleScan('SKU-123')} className="bg-white text-black text-xs px-3 py-1 rounded">Simular Código 1</button>
                            <button onClick={() => setScanMode(false)} className="bg-white/20 text-white text-xs px-3 py-1 rounded">Cancelar</button>
                        </div>
                    </div>
                )}

                {/* Result Card */}
                {result && (
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 animate-in slide-in-from-bottom-10 fade-in">
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <h3 className="font-bold text-xl text-gray-900">{result.name}</h3>
                                <p className="text-gray-400 font-mono text-sm">{result.sku}</p>
                            </div>
                            <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold">
                                Activo
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-gray-50 p-3 rounded-lg">
                                <span className="text-xs text-gray-500 uppercase block mb-1">Stock</span>
                                <span className="text-2xl font-bold text-gray-900">{result.stock}</span>
                            </div>
                            <div className="bg-gray-50 p-3 rounded-lg">
                                <span className="text-xs text-gray-500 uppercase block mb-1">Ubicación</span>
                                <span className="text-lg font-semibold text-blue-600">{result.location}</span>
                            </div>
                        </div>

                        <div className="mt-6 flex gap-3">
                            <button className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-medium shadow-lg shadow-blue-600/20 active:bg-blue-700">
                                Ver Detalles
                            </button>
                            <button className="flex-1 bg-white border border-gray-200 text-gray-700 py-3 rounded-xl font-medium active:bg-gray-50">
                                Inventariar
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
