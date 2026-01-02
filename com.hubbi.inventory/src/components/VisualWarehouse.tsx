import { useEffect, useRef, useState } from 'react';
import { Box, ZoomIn, ZoomOut, Save, Maximize } from 'lucide-react';

interface Zone {
    id: string;
    x: number;
    y: number;
    w: number;
    h: number;
    color: string;
    label: string;
}

export const VisualWarehouse = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [zones, setZones] = useState<Zone[]>([]);
    const [scale, setScale] = useState(1);
    const [selectedZone, setSelectedZone] = useState<string | null>(null);

    // Mock initial data
    useEffect(() => {
        setZones([
            { id: '1', x: 50, y: 50, w: 100, h: 200, color: '#e0e7ff', label: 'Estante A' },
            { id: '2', x: 200, y: 50, w: 100, h: 200, color: '#e0e7ff', label: 'Estante B' },
            { id: '3', x: 50, y: 300, w: 250, h: 100, color: '#fee2e2', label: 'Zona de Carga' },
        ]);
    }, []);

    // Draw Loop
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Clear
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        ctx.save();
        ctx.scale(scale, scale);

        // Grid
        ctx.strokeStyle = '#f0f0f0';
        ctx.lineWidth = 1;
        for (let i = 0; i < canvas.width / scale; i += 20) {
            ctx.beginPath();
            ctx.moveTo(i, 0);
            ctx.lineTo(i, canvas.height / scale);
            ctx.stroke();
        }
        for (let i = 0; i < canvas.height / scale; i += 20) {
            ctx.beginPath();
            ctx.moveTo(0, i);
            ctx.lineTo(canvas.width / scale, i);
            ctx.stroke();
        }

        // Zones
        zones.forEach(zone => {
            ctx.fillStyle = zone.color;
            ctx.fillRect(zone.x, zone.y, zone.w, zone.h);

            // Border (Highlight if selected)
            ctx.strokeStyle = selectedZone === zone.id ? '#2563eb' : '#94a3b8';
            ctx.lineWidth = selectedZone === zone.id ? 2 : 1;
            ctx.strokeRect(zone.x, zone.y, zone.w, zone.h);

            // Label
            ctx.fillStyle = '#1e293b';
            ctx.font = '12px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(zone.label, zone.x + zone.w / 2, zone.y + zone.h / 2);
        });

        ctx.restore();
    }, [zones, scale, selectedZone]);

    const handleCanvasClick = (e: React.MouseEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) / scale;
        const y = (e.clientY - rect.top) / scale;

        // Simple hit test
        const hit = zones.find(z =>
            x >= z.x && x <= z.x + z.w &&
            y >= z.y && y <= z.y + z.h
        );

        setSelectedZone(hit ? hit.id : null);
    };

    return (
        <div className="flex h-full bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {/* Sidebar / Tools */}
            <div className="w-64 border-r border-gray-200 p-4 bg-gray-50 flex flex-col gap-4">
                <div className="flex items-center gap-2 text-gray-800 font-bold border-b border-gray-200 pb-2">
                    <Box size={20} className="text-blue-600" />
                    <h2>Diseñador de Bodega</h2>
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-500 uppercase">Herramientas</label>
                    <button className="w-full flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded text-sm hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 transition-colors">
                        <Box size={16} /> Nuevo Estante
                    </button>
                    <button className="w-full flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded text-sm hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 transition-colors">
                        <Maximize size={16} /> Zona de Piso
                    </button>
                </div>

                {selectedZone && (
                    <div className="mt-auto bg-white p-3 rounded border border-gray-200 shadow-sm animate-in slide-in-from-bottom-5">
                        <h4 className="text-xs font-bold text-gray-400 mb-2 uppercase">Propiedades</h4>
                        <div className="space-y-2">
                            <label className="text-xs text-gray-500">Etiqueta</label>
                            <input
                                className="w-full border rounded px-2 py-1 text-sm"
                                value={zones.find(z => z.id === selectedZone)?.label}
                                onChange={(e) => setZones(zones.map(z => z.id === selectedZone ? { ...z, label: e.target.value } : z))}
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Canvas Area */}
            <div className="flex-1 relative bg-gray-100 overflow-hidden" ref={containerRef}>

                {/* Toolbar */}
                <div className="absolute top-4 right-4 flex gap-2 bg-white shadow-md rounded-lg p-1 z-10">
                    <button onClick={() => setScale(s => Math.max(0.5, s - 0.1))} className="p-2 hover:bg-gray-100 rounded">
                        <ZoomOut size={18} className="text-gray-600" />
                    </button>
                    <span className="flex items-center text-xs font-mono text-gray-500 px-2 min-w-[3rem] justify-center">
                        {Math.round(scale * 100)}%
                    </span>
                    <button onClick={() => setScale(s => Math.min(2, s + 0.1))} className="p-2 hover:bg-gray-100 rounded">
                        <ZoomIn size={18} className="text-gray-600" />
                    </button>
                    <div className="w-px bg-gray-200 my-1 mx-1"></div>
                    <button className="p-2 hover:bg-blue-50 text-blue-600 rounded">
                        <Save size={18} />
                    </button>
                </div>

                <div className="overflow-auto w-full h-full flex justify-center items-center p-8">
                    <canvas
                        ref={canvasRef}
                        width={800}
                        height={600}
                        className="bg-white shadow-xl cursor-crosshair"
                        onMouseDown={handleCanvasClick}
                    />
                </div>
            </div>
        </div>
    );
};
