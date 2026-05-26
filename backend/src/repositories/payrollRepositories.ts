/**
 * Payroll Repository
 * Handles all database operations for the Payroll entity
 */

import { RowDataPacket } from "mysql2";
import { Database } from "../database/Database";
import { PayrollRecord, CreatePayrollRequest, UpdatePayrollRequest } from "../models/Payroll";

export class PayrollRepository {
  private readonly db = Database.getInstance();

  /**
   * Find payroll by ID
   */
  public async findById(id: number): Promise<PayrollRecord | null> {
    const rows = await this.db.query<RowDataPacket[]>(
      `SELECT id, employee_id, pay_period_start, pay_period_end, basic_salary,
              allowances, deductions, gross_salary, net_salary, status,
              payment_date, remarks, created_at, updated_at
       FROM payroll WHERE id = ?`,
      [id],
    );
    return rows.length > 0 ? (rows[0] as PayrollRecord) : null;
  }

  /**
   * Find payroll by employee and period
   */
  public async findByEmployeeAndPeriod(
    employeeId: number,
    startDate: Date,
    endDate: Date,
  ): Promise<PayrollRecord | null> {
    const rows = await this.db.query<RowDataPacket[]>(
      `SELECT id, employee_id, pay_period_start, pay_period_end, basic_salary,
              allowances, deductions, gross_salary, net_salary, status,
              payment_date, remarks, created_at, updated_at
       FROM payroll WHERE employee_id = ? AND pay_period_start = ? AND pay_period_end = ?`,
      [employeeId, startDate, endDate],
    );
    return rows.length > 0 ? (rows[0] as PayrollRecord) : null;
  }

  /**
   * Get payroll records for employee
   */
  public async findByEmployee(
    employeeId: number,
    status?: string,
    limit: number = 50,
    offset: number = 0,
  ): Promise<PayrollRecord[]> {
    let query = `SELECT id, employee_id, pay_period_start, pay_period_end, basic_salary,
                        allowances, deductions, gross_salary, net_salary, status,
                        payment_date, remarks, created_at, updated_at
                 FROM payroll WHERE employee_id = ?`;
    const params: any[] = [employeeId];

    if (status) {
      query += ` AND status = ?`;
      params.push(status);
    }

    query += ` ORDER BY pay_period_start DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    return await this.db.query<RowDataPacket[]>(query, params) as PayrollRecord[];
  }

  /**
   * Get all payroll records with filters
   */
  public async findAll(
    status?: string,
    limit: number = 50,
    offset: number = 0,
  ): Promise<PayrollRecord[]> {
    let query = `SELECT id, employee_id, pay_period_start, pay_period_end, basic_salary,
                        allowances, deductions, gross_salary, net_salary, status,
                        payment_date, remarks, created_at, updated_at
                 FROM payroll WHERE 1=1`;
    const params: any[] = [];

    if (status) {
      query += ` AND status = ?`;
      params.push(status);
    }

    query += ` ORDER BY pay_period_start DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    return await this.db.query<RowDataPacket[]>(query, params) as PayrollRecord[];
  }

  /**
   * Create payroll record
   */
  public async create(data: CreatePayrollRequest): Promise<number> {
    const { basic_salary, allowances = 0, deductions = 0 } = data;
    const gross_salary = basic_salary + allowances;
    const net_salary = gross_salary - deductions;

    const result = await this.db.execute(
      `INSERT INTO payroll
       (employee_id, pay_period_start, pay_period_end, basic_salary, allowances,
        deductions, gross_salary, net_salary, status, remarks)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.employee_id,
        data.pay_period_start,
        data.pay_period_end,
        basic_salary,
        allowances,
        deductions,
        gross_salary,
        net_salary,
        "pending",
        data.remarks || null,
      ],
    );

    return result.insertId;
  }

  /**
   * Update payroll record
   */
  public async update(id: number, data: UpdatePayrollRequest): Promise<boolean> {
    const fields: string[] = [];
    const params: any[] = [];

    if (data.allowances !== undefined) {
      fields.push("allowances = ?");
      params.push(data.allowances);
    }
    if (data.deductions !== undefined) {
      fields.push("deductions = ?");
      params.push(data.deductions);
    }
    if (data.status !== undefined) {
      fields.push("status = ?");
      params.push(data.status);
    }
    if (data.payment_date !== undefined) {
      fields.push("payment_date = ?");
      params.push(data.payment_date || null);
    }
    if (data.remarks !== undefined) {
      fields.push("remarks = ?");
      params.push(data.remarks || null);
    }

    // Recalculate gross and net if allowances or deductions changed
    if (data.allowances !== undefined || data.deductions !== undefined) {
      const payroll = await this.findById(id);
      if (payroll) {
        const allowances = data.allowances !== undefined ? data.allowances : payroll.allowances;
        const deductions = data.deductions !== undefined ? data.deductions : payroll.deductions;
        const gross_salary = payroll.basic_salary + allowances;
        const net_salary = gross_salary - deductions;

        fields.push("gross_salary = ?");
        fields.push("net_salary = ?");
        params.push(gross_salary, net_salary);
      }
    }

    if (fields.length === 0) return false;

    params.push(id);
    const result = await this.db.execute(
      `UPDATE payroll SET ${fields.join(", ")} WHERE id = ?`,
      params,
    );

    return result.affectedRows > 0;
  }

  /**
   * Delete payroll record
   */
  public async delete(id: number): Promise<boolean> {
    const result = await this.db.execute("DELETE FROM payroll WHERE id = ?", [id]);
    return result.affectedRows > 0;
  }

  /**
   * Count payroll by status
   */
  public async countByStatus(status: string): Promise<number> {
    const rows = await this.db.query<RowDataPacket[]>(
      "SELECT COUNT(*) as count FROM payroll WHERE status = ?",
      [status],
    );
    return (rows[0] as any).count || 0;
  }
}
