import { clsx } from 'clsx';

interface ToggleProps {
    checked: boolean;
    onChange: (val: boolean) => void;
    disabled?: boolean;
    className?: string;
}

/**
 * Standard Toggle component for the Inventory Module.
 * Matches the Hubbi Core visual standard:
 * - Active background: bg-hubbi-success
 * - Inactive background: bg-hubbi-dim/30
 * - Transition: transition-all with left-6/1 positioning
 */
export const Toggle = ({ checked, onChange, disabled, className }: ToggleProps) => {
    return (
        <button
            type="button"
            disabled={disabled}
            onClick={() => !disabled && onChange(!checked)}
            className={clsx(
                "w-11 h-6 rounded-full transition-colors relative outline-none",
                checked ? 'bg-hubbi-success' : 'bg-hubbi-dim/30',
                disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
                className
            )}
        >
            <div
                className={clsx(
                    "w-4 h-4 bg-white rounded-full absolute top-1 transition-all shadow-sm",
                    checked ? 'left-6' : 'left-1'
                )}
            />
        </button>
    );
};
