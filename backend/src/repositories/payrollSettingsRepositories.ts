/**
 * Payroll Settings Repository
 * Handles all database operations for payroll settings
 */

import { RowDataPacket, ResultSetHeader } from "mysql2";
import { Database } from "../database/Database";
import {
  PayrollSettingsRecord,
  CreatePayrollSettingsRequest,
  UpdatePayrollSettingsRequest,
} from "../models/PayrollSettings";

export class PayrollSettingsRepository {
  private readonly db = Database.getInstance();

  /**
   * Find payroll settings by ID
   */
  public async findById(id: number): Promise<PayrollSettingsRecord | null> {
    const rows = await this.db.query<RowDataPacket[]>(
      `SELECT id, employee_id, base_salary, housing_allowance, transport_allowance,
              other_allowances, deduction_per_absent_day, deduction_per_late_day,
              deduction_per_half_day, created_at, updated_at
       FROM payroll_settings WHERE id = ?`,
      [id],
    );
    return rows.length > 0 ? (rows[0] as PayrollSettingsRecord) : null;
  }

  /**
   * Find payroll settings by employee ID
   */
  public async findByEmployeeId(
    employeeId: number,
  ): Promise<PayrollSettingsRecord | null> {
    const rows = await this.db.query<RowDataPacket[]>(
      `SELECT id, employee_id, base_salary, housing_allowance, transport_allowance,
              other_allowances, deduction_per_absent_day, deduction_per_late_day,
              deduction_per_half_day, created_at, updated_at
       FROM payroll_settings WHERE employee_id = ?`,
      [employeeId],
    );
    return rows.length > 0 ? (rows[0] as PayrollSettingsRecord) : null;
  }

  /**
   * Get all payroll settings with pagination
   */
  public async findAll(
    limit: number = 50,
    offset: number = 0,
  ): Promise<PayrollSettingsRecord[]> {
    return await this.db.query<RowDataPacket[]>(
      `SELECT id, employee_id, base_salary, housing_allowance, transport_allowance,
              other_allowances, deduction_per_absent_day, deduction_per_late_day,
              deduction_per_half_day, created_at, updated_at
       FROM payroll_settings
       ORDER BY employee_id ASC
       LIMIT ? OFFSET ?`,
      [limit, offset],
    ) as PayrollSettingsRecord[];
  }

  /**
   * Create new payroll settings
   */
  public async create(
    data: CreatePayrollSettingsRequest,
  ): Promise<number> {
    const result = await this.db.execute(
      `INSERT INTO payroll_settings 
       (employee_id, base_salary, housing_allowance, transport_allowance, 
        other_allowances, deduction_per_absent_day, deduction_per_late_day, 
        deduction_per_half_day)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.employee_id,
        data.base_salary,
        data.housing_allowance || 0,
        data.transport_allowance || 0,
        data.other_allowances || 0,
        data.deduction_per_absent_day || data.base_salary / 22,
        data.deduction_per_late_day || (data.base_salary / 22) * 0.5,
        data.deduction_per_half_day || (data.base_salary / 22) * 0.5,
      ],
    );
    return result.insertId;
  }

  /**
   * Update payroll settings
   */
  public async update(
    id: number,
    data: UpdatePayrollSettingsRequest,
  ): Promise<boolean> {
    const fields: string[] = [];
    const values: any[] = [];

    if (data.base_salary !== undefined) {
      fields.push("base_salary = ?");
      values.push(data.base_salary);
    }
    if (data.housing_allowance !== undefined) {
      fields.push("housing_allowance = ?");
      values.push(data.housing_allowance);
    }
    if (data.transport_allowance !== undefined) {
      fields.push("transport_allowance = ?");
      values.push(data.transport_allowance);
    }
    if (data.other_allowances !== undefined) {
      fields.push("other_allowances = ?");
      values.push(data.other_allowances);
    }
    if (data.deduction_per_absent_day !== undefined) {
      fields.push("deduction_per_absent_day = ?");
      values.push(data.deduction_per_absent_day);
    }
    if (data.deduction_per_late_day !== undefined) {
      fields.push("deduction_per_late_day = ?");
      values.push(data.deduction_per_late_day);
    }
    if (data.deduction_per_half_day !== undefined) {
      fields.push("deduction_per_half_day = ?");
      values.push(data.deduction_per_half_day);
    }

    if (fields.length === 0) return false;

    fields.push("updated_at = CURRENT_TIMESTAMP");
    values.push(id);

    const result = await this.db.execute(
      `UPDATE payroll_settings SET ${fields.join(", ")} WHERE id = ?`,
      values,
    );

    return result.affectedRows > 0;
  }

  /**
   * Delete payroll settings
   */
  public async delete(id: number): Promise<boolean> {
    const result = await this.db.execute(
      `DELETE FROM payroll_settings WHERE id = ?`,
      [id],
    );
    return result.affectedRows > 0;
  }

  /**
   * Check if settings exist for employee
   */
  public async existsForEmployee(employeeId: number): Promise<boolean> {
    const rows = await this.db.query<RowDataPacket[]>(
      `SELECT 1 FROM payroll_settings WHERE employee_id = ? LIMIT 1`,
      [employeeId],
    );
    return rows.length > 0;
  }
}
