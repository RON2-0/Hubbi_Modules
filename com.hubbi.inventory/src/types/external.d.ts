// Type declarations for jsbarcode
declare module 'jsbarcode' {
    interface Options {
        format?: string;
        width?: number;
        height?: number;
        displayValue?: boolean;
        text?: string;
        fontOptions?: string;
        font?: string;
        textAlign?: string;
        textPosition?: string;
        textMargin?: number;
        fontSize?: number;
        background?: string;
        lineColor?: string;
        margin?: number;
        marginTop?: number;
        marginBottom?: number;
        marginLeft?: number;
        marginRight?: number;
        flat?: boolean;
        valid?: (valid: boolean) => void;
    }

    function JsBarcode(
        element: string | HTMLCanvasElement | HTMLImageElement | SVGElement,
        text: string,
        options?: Options
    ): void;

    export = JsBarcode;
}

// Type declarations for react-grid-layout
declare module 'react-grid-layout' {
    import { ComponentType, ReactNode } from 'react';

    export interface Layout {
        i: string;
        x: number;
        y: number;
        w: number;
        h: number;
        minW?: number;
        maxW?: number;
        minH?: number;
        maxH?: number;
        static?: boolean;
        isDraggable?: boolean;
        isResizable?: boolean;
    }

    export interface Layouts {
        [key: string]: Layout[];
    }

    export interface ResponsiveProps {
        className?: string;
        layouts?: Layouts;
        breakpoints?: { [key: string]: number };
        cols?: { [key: string]: number };
        rowHeight?: number;
        width?: number;
        margin?: [number, number] | { [key: string]: [number, number] };
        containerPadding?: [number, number] | { [key: string]: [number, number] };
        isDraggable?: boolean;
        isResizable?: boolean;
        isBounded?: boolean;
        useCSSTransforms?: boolean;
        transformScale?: number;
        allowOverlap?: boolean;
        preventCollision?: boolean;
        compactType?: 'vertical' | 'horizontal' | null;
        onLayoutChange?: (currentLayout: Layout[], allLayouts?: Layouts) => void;
        onBreakpointChange?: (newBreakpoint: string, newCols: number) => void;
        children?: ReactNode;
    }

    export const Responsive: ComponentType<ResponsiveProps>;
    export function WidthProvider<P>(component: ComponentType<P>): ComponentType<Omit<P, 'width'>>;

    export default ComponentType<ResponsiveProps>;
}

declare module 'react-grid-layout/css/styles.css' {
    const styles: Record<string, string>;
    export default styles;
}
