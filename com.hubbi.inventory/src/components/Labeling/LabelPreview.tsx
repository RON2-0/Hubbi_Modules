
import React, { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';
import { clsx } from 'clsx';

interface LabelPreviewProps {
    sku: string;
    name: string;
    price?: number;
    size?: 'small' | 'medium' | 'large'; // 25mm, 50mm, 100mm approx width scale
}

export const LabelPreview: React.FC<LabelPreviewProps> = ({ sku, name, price, size = 'medium' }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (canvasRef.current && sku) {
            try {
                JsBarcode(canvasRef.current, sku, {
                    format: "CODE128",
                    lineColor: "#000",
                    width: 2,
                    height: 40,
                    displayValue: false,
                    margin: 0
                });
            } catch (e) {
                console.error("Barcode generation failed", e);
            }
        }
    }, [sku]);

    const sizeClasses = {
        small: 'w-32 text-[8px]',
        medium: 'w-48 text-[10px]',
        large: 'w-64 text-xs'
    };

    return (
        <div className={clsx(
            "bg-white border text-black font-sans p-2 flex flex-col items-center justify-center text-center shadow-sm select-none",
            sizeClasses[size],
            "aspect-[2/1]" // Standard label ratio
        )}>
            <div className="font-bold truncate w-full uppercase leading-tight mb-1">
                {name}
            </div>

            <canvas ref={canvasRef} className="w-full h-auto max-h-12 object-contain" />

            <div className="flex justify-between w-full mt-1 font-mono items-center">
                <span>{sku}</span>
                {price !== undefined && (
                    <span className="font-bold text-lg">${price.toFixed(2)}</span>
                )}
            </div>
        </div>
    );
};
