// Type declarations for @yudiel/react-qr-scanner
declare module '@yudiel/react-qr-scanner' {
    import { ComponentType, CSSProperties } from 'react';

    export interface DetectedBarcode {
        rawValue: string;
        format: string;
        boundingBox?: DOMRectReadOnly;
        cornerPoints?: { x: number; y: number }[];
    }

    export type BarcodeFormat =
        | 'aztec'
        | 'code_128'
        | 'code_39'
        | 'code_93'
        | 'codabar'
        | 'data_matrix'
        | 'ean_13'
        | 'ean_8'
        | 'itf'
        | 'pdf417'
        | 'qr_code'
        | 'upc_a'
        | 'upc_e'
        | 'unknown';

    export interface ScannerProps {
        onScan: (detectedCodes: DetectedBarcode[]) => void;
        onError?: (error: unknown) => void;
        formats?: BarcodeFormat[];
        paused?: boolean;
        children?: React.ReactNode;
        components?: {
            audio?: boolean;
            torch?: boolean;
            zoom?: boolean;
            finder?: boolean;
            onOff?: boolean;
            tracker?: (detectedCodes: DetectedBarcode[], ctx: CanvasRenderingContext2D) => void;
        };
        constraints?: MediaTrackConstraints;
        styles?: {
            container?: CSSProperties;
            video?: CSSProperties;
            finderBorder?: number;
        };
        scanDelay?: number;
        allowMultiple?: boolean;
    }

    export const Scanner: ComponentType<ScannerProps>;
    export const useDevices: () => { devices: MediaDeviceInfo[]; loading: boolean };
}
