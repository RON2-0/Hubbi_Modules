/**
 * Export Utilities - Generate reports for accountants and fiscal compliance
 * 
 * Supports exporting to CSV, Excel-compatible format, and JSON
 * for integration with accounting software.
 */

import { hubbi } from '../hubbi-sdk.d';

export interface ExportFilters {
    startDate?: string;
    endDate?: string;
    locationId?: string;
    categoryId?: string;
    itemType?: string;
}

export interface ExportResult {
    success: boolean;
    data?: string;
    rowCount?: number;
    error?: string;
}

/**
 * Export Kardex (movement history) for a specific item or all items
 */
export async function exportKardex(
    itemId?: string,
    filters?: ExportFilters
): Promise<ExportResult> {
    try {
        let sql = `
      SELECT 
        m.created_at as fecha,
        i.sku,
        i.name as producto,
        m.type as tipo,
        m.reason as motivo,
        m.quantity as cantidad,
        m.cost_at_moment as costo_unitario,
        m.total_value as valor_total,
        m.document_type as tipo_documento,
        m.document_number as numero_documento,
        l.name as ubicacion
      FROM com_hubbi_inventory_movements m
      JOIN com_hubbi_inventory_items i ON m.item_id = i.id
      LEFT JOIN com_hubbi_inventory_locations l ON m.location_id = l.id
      WHERE 1=1
    `;
        const params: unknown[] = [];

        if (itemId) {
            sql += ` AND m.item_id = ?`;
            params.push(itemId);
        }

        if (filters?.startDate) {
            sql += ` AND m.created_at >= ?`;
            params.push(filters.startDate);
        }

        if (filters?.endDate) {
            sql += ` AND m.created_at <= ?`;
            params.push(filters.endDate);
        }

        if (filters?.locationId) {
            sql += ` AND m.location_id = ?`;
            params.push(filters.locationId);
        }

        sql += ` ORDER BY m.created_at DESC`;

        const rows = await hubbi.db.query(sql, params, { moduleId: 'com.hubbi.inventory' });

        return {
            success: true,
            data: convertToCSV(rows),
            rowCount: rows.length,
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Error al exportar Kardex',
        };
    }
}

/**
 * Export Stock Valuation (for balance sheet / fiscal reporting)
 */
export async function exportStockValuation(filters?: ExportFilters): Promise<ExportResult> {
    try {
        let sql = `
      SELECT 
        i.sku,
        i.name as producto,
        i.category_id as categoria,
        i.type as tipo,
        i.weighted_average_cost as costo_promedio,
        s.quantity as cantidad,
        (s.quantity * i.weighted_average_cost) as valor_total,
        l.name as ubicacion
      FROM com_hubbi_inventory_items i
      JOIN com_hubbi_inventory_stock s ON i.id = s.item_id
      LEFT JOIN com_hubbi_inventory_locations l ON s.location_id = l.id
      WHERE i.is_active = TRUE
    `;
        const params: unknown[] = [];

        if (filters?.locationId) {
            sql += ` AND s.location_id = ?`;
            params.push(filters.locationId);
        }

        if (filters?.categoryId) {
            sql += ` AND i.category_id = ?`;
            params.push(filters.categoryId);
        }

        if (filters?.itemType) {
            sql += ` AND i.type = ?`;
            params.push(filters.itemType);
        }

        sql += ` ORDER BY i.name`;

        const rows = await hubbi.db.query(sql, params, { moduleId: 'com.hubbi.inventory' });

        // Calculate total
        const total = rows.reduce((sum, row: Record<string, unknown>) => sum + (row.valor_total as number || 0), 0);

        return {
            success: true,
            data: convertToCSV(rows, { footer: `TOTAL VALORIZACIÓN: ${total.toFixed(2)}` }),
            rowCount: rows.length,
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Error al exportar valorización',
        };
    }
}

/**
 * Export Inventory Summary per Period (for fiscal declarations)
 */
export async function exportFiscalSummary(
    year: number,
    period: 'Q1' | 'Q2' | 'Q3' | 'Q4' | 'annual'
): Promise<ExportResult> {
    try {
        const { startDate, endDate } = getPeriodDates(year, period);

        // Get movements summary
        const movementsSql = `
      SELECT 
        m.type,
        m.reason,
        COUNT(*) as cantidad_movimientos,
        SUM(m.quantity) as unidades_totales,
        SUM(m.total_value) as valor_total
      FROM com_hubbi_inventory_movements m
      WHERE m.created_at >= ? AND m.created_at <= ?
      GROUP BY m.type, m.reason
      ORDER BY m.type, m.reason
    `;

        const movements = await hubbi.db.query(movementsSql, [startDate, endDate], { moduleId: 'com.hubbi.inventory' });

        // Get stock at end of period
        const stockSql = `
      SELECT 
        i.type,
        COUNT(DISTINCT i.id) as productos,
        SUM(s.quantity) as unidades,
        SUM(s.quantity * i.weighted_average_cost) as valor
      FROM com_hubbi_inventory_items i
      JOIN com_hubbi_inventory_stock s ON i.id = s.item_id
      WHERE i.is_active = TRUE
      GROUP BY i.type
    `;

        const stock = await hubbi.db.query(stockSql, [], { moduleId: 'com.hubbi.inventory' });

        const report = {
            periodo: `${period} ${year}`,
            fecha_inicio: startDate,
            fecha_fin: endDate,
            resumen_movimientos: movements,
            stock_al_cierre: stock,
        };

        return {
            success: true,
            data: JSON.stringify(report, null, 2),
            rowCount: movements.length + stock.length,
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Error al generar resumen fiscal',
        };
    }
}

/**
 * Log an export operation for auditing
 */
export async function logExport(params: {
    reportType: string;
    format: string;
    periodStart?: string;
    periodEnd?: string;
    filters?: Record<string, unknown>;
    rowCount: number;
    userId: string;
    filePath?: string;
    fileSize?: number;
}): Promise<void> {
    const id = crypto.randomUUID();

    await hubbi.db.execute(`
    INSERT INTO com_hubbi_inventory_export_logs 
      (id, report_type, format, period_start, period_end, filters, row_count, generated_by, file_path, file_size)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
        id,
        params.reportType,
        params.format,
        params.periodStart || null,
        params.periodEnd || null,
        params.filters ? JSON.stringify(params.filters) : null,
        params.rowCount,
        params.userId,
        params.filePath || null,
        params.fileSize || null,
    ], { moduleId: 'com.hubbi.inventory' });
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function convertToCSV(data: Record<string, unknown>[], options?: { footer?: string }): string {
    if (data.length === 0) return '';

    const headers = Object.keys(data[0]);
    const csvLines: string[] = [];

    // Header row
    csvLines.push(headers.join(','));

    // Data rows
    for (const row of data) {
        const values = headers.map(h => {
            const val = row[h];
            if (val === null || val === undefined) return '';
            if (typeof val === 'string' && (val.includes(',') || val.includes('"'))) {
                return `"${val.replace(/"/g, '""')}"`;
            }
            return String(val);
        });
        csvLines.push(values.join(','));
    }

    // Footer if provided
    if (options?.footer) {
        csvLines.push('');
        csvLines.push(options.footer);
    }

    return csvLines.join('\n');
}

function getPeriodDates(year: number, period: string): { startDate: string; endDate: string } {
    switch (period) {
        case 'Q1':
            return { startDate: `${year}-01-01`, endDate: `${year}-03-31` };
        case 'Q2':
            return { startDate: `${year}-04-01`, endDate: `${year}-06-30` };
        case 'Q3':
            return { startDate: `${year}-07-01`, endDate: `${year}-09-30` };
        case 'Q4':
            return { startDate: `${year}-10-01`, endDate: `${year}-12-31` };
        case 'annual':
        default:
            return { startDate: `${year}-01-01`, endDate: `${year}-12-31` };
    }
}
