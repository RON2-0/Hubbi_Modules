/**
 * Fiscal Periods Hook
 * 
 * Manages fiscal periods for inventory and other modules.
 * Prioritizes accounting module when installed, falls back to inventory.
 */

import { useState, useEffect, useCallback } from 'react';
import { hubbi } from '../hubbi-sdk.d';

export interface FiscalPeriod {
    id: string;
    year: number;
    month: number;
    quarter?: number;
    start_date: string;
    end_date: string;
    status: 'open' | 'closed' | 'locked';
    is_current: boolean;
    created_by_module?: string;
    closed_by?: string;
    closed_at?: string;
}

export interface FiscalConfig {
    id: string;
    lock_after_periods: number;
    auto_close: boolean;
    period_type: 'monthly' | 'quarterly' | 'annual';
    fiscal_year_start_month: number;
    managed_by?: string;
}

const MODULE_ID = 'com.hubbi.inventory';
const ACCOUNTING_MODULE_ID = 'com.hubbi.accounting';

export function useFiscalPeriods() {
    const [periods, setPeriods] = useState<FiscalPeriod[]>([]);
    const [currentPeriod, setCurrentPeriod] = useState<FiscalPeriod | null>(null);
    const [config, setConfig] = useState<FiscalConfig | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedPeriodId, setSelectedPeriodId] = useState<string | null>(null);

    // Initialize and load periods
    useEffect(() => {
        initializePeriods();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const initializePeriods = async () => {
        setLoading(true);

        // Ensure tables exist (in case periods.sql wasn't run)
        await ensureTablesExist();

        // Load config
        const configData = await hubbi.db.query(
            `SELECT * FROM hubbi_fiscal_config WHERE id = 'default'`,
            [],
            { moduleId: MODULE_ID }
        );

        if (configData && configData.length > 0) {
            setConfig(configData[0] as FiscalConfig);
        }

        // Check if we should manage periods (accounting not installed)
        const isAccountingInstalled = await hubbi.modules.isInstalled(ACCOUNTING_MODULE_ID);

        if (!isAccountingInstalled && configData[0]?.managed_by !== MODULE_ID) {
            // Take ownership if not already managed
            await hubbi.db.execute(
                `UPDATE hubbi_fiscal_config SET managed_by = ? WHERE id = 'default'`,
                [MODULE_ID],
                { moduleId: MODULE_ID }
            );
        }

        // Create current period if none exists
        await ensureCurrentPeriodExists();

        // Load all periods
        await refreshPeriods();

        setLoading(false);
    };

    const ensureTablesExist = async () => {
        // Create config table
        await hubbi.db.execute(`
      CREATE TABLE IF NOT EXISTS hubbi_fiscal_config (
        id TEXT PRIMARY KEY DEFAULT 'default',
        lock_after_periods INTEGER DEFAULT 2,
        auto_close BOOLEAN DEFAULT FALSE,
        period_type TEXT DEFAULT 'monthly',
        fiscal_year_start_month INTEGER DEFAULT 1,
        managed_by TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `, [], { moduleId: MODULE_ID });

        // Insert default config
        await hubbi.db.execute(`
      INSERT OR IGNORE INTO hubbi_fiscal_config (id, lock_after_periods, period_type)
      VALUES ('default', 2, 'monthly')
    `, [], { moduleId: MODULE_ID });

        // Create periods table
        await hubbi.db.execute(`
      CREATE TABLE IF NOT EXISTS hubbi_fiscal_periods (
        id TEXT PRIMARY KEY,
        year INTEGER NOT NULL,
        month INTEGER NOT NULL,
        quarter INTEGER,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        status TEXT DEFAULT 'open',
        is_current BOOLEAN DEFAULT FALSE,
        created_by_module TEXT,
        closed_by TEXT,
        closed_at DATETIME,
        locked_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(year, month)
      )
    `, [], { moduleId: MODULE_ID });
    };

    const ensureCurrentPeriodExists = async () => {
        const existing = await hubbi.db.query(
            `SELECT * FROM hubbi_fiscal_periods WHERE is_current = TRUE`,
            [],
            { moduleId: MODULE_ID }
        );

        if (!existing || existing.length === 0) {
            const now = new Date();
            const year = now.getFullYear();
            const month = now.getMonth() + 1;
            const periodId = `${year}-${String(month).padStart(2, '0')}`;

            const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0];
            const endDate = new Date(year, month, 0).toISOString().split('T')[0];

            await hubbi.db.execute(`
        INSERT OR IGNORE INTO hubbi_fiscal_periods 
          (id, year, month, start_date, end_date, status, is_current, created_by_module)
        VALUES (?, ?, ?, ?, ?, 'open', TRUE, ?)
      `, [periodId, year, month, startDate, endDate, MODULE_ID], { moduleId: MODULE_ID });
        }
    };

    const refreshPeriods = async () => {
        const data = await hubbi.db.query(
            `SELECT * FROM hubbi_fiscal_periods ORDER BY year DESC, month DESC`,
            [],
            { moduleId: MODULE_ID }
        );

        if (data) {
            setPeriods(data as FiscalPeriod[]);
            const current = data.find((p: FiscalPeriod) => p.is_current);
            setCurrentPeriod(current || null);
            if (!selectedPeriodId && current) {
                setSelectedPeriodId(current.id);
            }
        }
    };

    const isPeriodEditable = useCallback((periodId: string): boolean => {
        if (!config || !currentPeriod) return false;

        const period = periods.find(p => p.id === periodId);
        if (!period) return false;

        // Closed or locked periods are never editable
        if (period.status === 'closed' || period.status === 'locked') return false;

        // Calculate period difference
        const currentMonths = currentPeriod.year * 12 + currentPeriod.month;
        const periodMonths = period.year * 12 + period.month;
        const diff = currentMonths - periodMonths;

        // If period is more than lock_after_periods behind, it's not editable
        return diff <= config.lock_after_periods;
    }, [config, currentPeriod, periods]);

    const closePeriod = async (periodId: string, userId: string): Promise<boolean> => {
        const period = periods.find(p => p.id === periodId);
        if (!period || period.status !== 'open') return false;

        await hubbi.db.execute(
            `UPDATE hubbi_fiscal_periods 
       SET status = 'closed', closed_by = ?, closed_at = ? 
       WHERE id = ?`,
            [userId, new Date().toISOString(), periodId],
            { moduleId: MODULE_ID }
        );

        // Create next period if this was current
        if (period.is_current) {
            const nextMonth = period.month === 12 ? 1 : period.month + 1;
            const nextYear = period.month === 12 ? period.year + 1 : period.year;
            const nextId = `${nextYear}-${String(nextMonth).padStart(2, '0')}`;

            const startDate = new Date(nextYear, nextMonth - 1, 1).toISOString().split('T')[0];
            const endDate = new Date(nextYear, nextMonth, 0).toISOString().split('T')[0];

            // Mark old as not current
            await hubbi.db.execute(
                `UPDATE hubbi_fiscal_periods SET is_current = FALSE WHERE id = ?`,
                [periodId],
                { moduleId: MODULE_ID }
            );

            // Create new current
            await hubbi.db.execute(`
        INSERT OR IGNORE INTO hubbi_fiscal_periods 
          (id, year, month, start_date, end_date, status, is_current, created_by_module)
        VALUES (?, ?, ?, ?, ?, 'open', TRUE, ?)
      `, [nextId, nextYear, nextMonth, startDate, endDate, MODULE_ID], { moduleId: MODULE_ID });
        }

        await refreshPeriods();
        return true;
    };

    const selectPeriod = (periodId: string) => {
        setSelectedPeriodId(periodId);
    };

    const getSelectedPeriod = (): FiscalPeriod | null => {
        return periods.find(p => p.id === selectedPeriodId) || currentPeriod;
    };

    const updateConfig = async (updates: Partial<FiscalConfig>): Promise<void> => {
        const sets: string[] = [];
        const params: unknown[] = [];

        if (updates.lock_after_periods !== undefined) {
            sets.push('lock_after_periods = ?');
            params.push(updates.lock_after_periods);
        }
        if (updates.auto_close !== undefined) {
            sets.push('auto_close = ?');
            params.push(updates.auto_close);
        }
        if (updates.period_type !== undefined) {
            sets.push('period_type = ?');
            params.push(updates.period_type);
        }

        if (sets.length > 0) {
            sets.push('updated_at = ?');
            params.push(new Date().toISOString());
            params.push('default');

            await hubbi.db.execute(
                `UPDATE hubbi_fiscal_config SET ${sets.join(', ')} WHERE id = ?`,
                params,
                { moduleId: MODULE_ID }
            );

            await initializePeriods();
        }
    };

    return {
        periods,
        currentPeriod,
        config,
        loading,
        selectedPeriodId,
        selectPeriod,
        getSelectedPeriod,
        isPeriodEditable,
        closePeriod,
        updateConfig,
        refreshPeriods,
    };
}

// Standalone functions for API usage
export async function getCurrentPeriod(): Promise<FiscalPeriod | null> {
    const data = await hubbi.db.query(
        `SELECT * FROM hubbi_fiscal_periods WHERE is_current = TRUE`,
        [],
        { moduleId: MODULE_ID }
    );
    return data && data.length > 0 ? data[0] as FiscalPeriod : null;
}

export async function getPeriodById(periodId: string): Promise<FiscalPeriod | null> {
    const data = await hubbi.db.query(
        `SELECT * FROM hubbi_fiscal_periods WHERE id = ?`,
        [periodId],
        { moduleId: MODULE_ID }
    );
    return data && data.length > 0 ? data[0] as FiscalPeriod : null;
}

export async function isPeriodEditableById(periodId: string): Promise<boolean> {
    const [period, current, configData] = await Promise.all([
        getPeriodById(periodId),
        getCurrentPeriod(),
        hubbi.db.query(`SELECT * FROM hubbi_fiscal_config WHERE id = 'default'`, [], { moduleId: MODULE_ID })
    ]);

    if (!period || !current || !configData || configData.length === 0) return false;

    const config = configData[0] as FiscalConfig;

    if (period.status === 'closed' || period.status === 'locked') return false;

    const currentMonths = current.year * 12 + current.month;
    const periodMonths = period.year * 12 + period.month;
    const diff = currentMonths - periodMonths;

    return diff <= config.lock_after_periods;
}
