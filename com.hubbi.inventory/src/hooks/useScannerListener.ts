
import { useEffect, useRef } from 'react';

interface ScannerOptions {
    onScan: (barcode: string) => void;
    minLength?: number;
    maxInterval?: number; // Time in ms between keystrokes to consider it a "scan"
    ignoredTags?: string[]; // Ignore if focus is on these tags (e.g. INPUT, TEXTAREA)
}

/**
 * useScannerListener
 * 
 * Listens for global keyboard events to detect barcode scanner input.
 * Scanners typically act as a Keyboard, typing very fast and ending with Enter.
 * 
 * @param onScan Callback function when a valid barcode is detected
 * @param options Configuration options
 */
export const useScannerListener = ({
    onScan,
    minLength = 3,
    maxInterval = 50,
    ignoredTags = ['INPUT', 'TEXTAREA', 'SELECT']
}: ScannerOptions) => {

    // Refs to keep track of state without triggering re-renders
    const buffer = useRef<string>('');
    const lastKeyTime = useRef<number>(0);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const now = Date.now();
            const timeDiff = now - lastKeyTime.current;
            const target = e.target as HTMLElement;

            // 1. Check if user is typing in a form field
            // If so, we usually want to ignore the global listener, 
            // BUT scanners might also scan into inputs. 
            // For a "Global Action" (like opening a product), we ignore inputs.
            if (target && ignoredTags.includes(target.tagName)) {
                return;
            }

            // 2. Logic: If keys are coming too slow, it's manual typing -> Reset
            if (timeDiff > maxInterval && buffer.current.length > 0) {
                // Heuristic: If it was just 1 or 2 chars, it was probably manual. Reset.
                // However, the first char of a scan will always have a large diff from the previous event.
                // So we only reset if we are "mid-scan" but it lagged.
                // Actually, simplest logic: If gap is big, this key is the START of a new potential scan.
                buffer.current = '';
            }

            lastKeyTime.current = now;

            // 3. Handle specific keys
            if (e.key === 'Enter') {
                // End of scan?
                if (buffer.current.length >= minLength) {
                    // Prevent default form submission if it was a scan capture
                    e.preventDefault();
                    e.stopPropagation();

                    const scannedCode = buffer.current;
                    buffer.current = ''; // Clear immediately

                    // Dispatch
                    console.log("[Scanner] Detected:", scannedCode);
                    onScan(scannedCode);
                } else {
                    buffer.current = '';
                }
                return;
            }

            if (e.key === 'Shift' || e.key === 'Control' || e.key === 'Alt' || e.key === 'Meta') {
                return; // Ignore modifiers
            }

            // 4. Append printable characters
            if (e.key.length === 1) {
                buffer.current += e.key;
            }
        };

        // Attach to window or document
        window.addEventListener('keydown', handleKeyDown, true); // Capture phase to intervene early if needed

        return () => {
            window.removeEventListener('keydown', handleKeyDown, true);
        };
    }, [onScan, minLength, maxInterval, ignoredTags]);
};
