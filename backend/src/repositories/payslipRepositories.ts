/**
 * Payslip Repository
 * Handles all database operations for the Payslip entity
 */

import { RowDataPacket } from "mysql2";
import { Database } from "../database/Database";
import { PayslipRecord, CreatePayslipRequest, UpdatePayslipRequest } from "../models/Payslip";

export class PayslipRepository {
  private readonly db = Database.getInstance();

  /**
   * Find payslip by ID
   */
  public async findById(id: number): Promise<PayslipRecord | null> {
    const rows = await this.db.query<RowDataPacket[]>(
      `SELECT id, payroll_id, employee_id, pay_period_start, pay_period_end,
              basic_salary, allowances, deductions, gross_salary, net_salary,
              status, generated_at, updated_at
       FROM payslips WHERE id = ?`,
      [id],
    );
    return rows.length > 0 ? (rows[0] as PayslipRecord) : null;
  }

  /**
   * Find payslip by payroll ID
   */
  public async findByPayrollId(payrollId: number): Promise<PayslipRecord | null> {
    const rows = await this.db.query<RowDataPacket[]>(
      `SELECT id, payroll_id, employee_id, pay_period_start, pay_period_end,
              basic_salary, allowances, deductions, gross_salary, net_salary,
              status, generated_at, updated_at
       FROM payslips WHERE payroll_id = ?`,
      [payrollId],
    );
    return rows.length > 0 ? (rows[0] as PayslipRecord) : null;
  }

  /**
   * Get payslips for employee
   */
  public async findByEmployee(
    employeeId: number,
    status?: string,
    limit: number = 50,
    offset: number = 0,
  ): Promise<PayslipRecord[]> {
    let query = `SELECT id, payroll_id, employee_id, pay_period_start, pay_period_end,
                        basic_salary, allowances, deductions, gross_salary, net_salary,
                        status, generated_at, updated_at
                 FROM payslips WHERE employee_id = ?`;
    const params: any[] = [employeeId];

    if (status) {
      query += ` AND status = ?`;
      params.push(status);
    }

    query += ` ORDER BY pay_period_start DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    return await this.db.query<RowDataPacket[]>(query, params) as PayslipRecord[];
  }

  /**
   * Get all payslips with filters
   */
  public async findAll(
    status?: string,
    limit: number = 50,
    offset: number = 0,
  ): Promise<PayslipRecord[]> {
    let query = `SELECT id, payroll_id, employee_id, pay_period_start, pay_period_end,
                        basic_salary, allowances, deductions, gross_salary, net_salary,
                        status, generated_at, updated_at
                 FROM payslips WHERE 1=1`;
    const params: any[] = [];

    if (status) {
      query += ` AND status = ?`;
      params.push(status);
    }

    query += ` ORDER BY pay_period_start DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    return await this.db.query<RowDataPacket[]>(query, params) as PayslipRecord[];
  }

  /**
   * Create payslip record
   */
  public async create(data: CreatePayslipRequest): Promise<number> {
    const result = await this.db.execute(
      `INSERT INTO payslips
       (payroll_id, employee_id, pay_period_start, pay_period_end, basic_salary,
        allowances, deductions, gross_salary, net_salary, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.payroll_id,
        data.employee_id,
        data.pay_period_start,
        data.pay_period_end,
        data.basic_salary,
        data.allowances,
        data.deductions,
        data.gross_salary,
        data.net_salary,
        "draft",
      ],
    );

    return result.insertId;
  }

  /**
   * Update payslip record
   */
  public async update(id: number, data: UpdatePayslipRequest): Promise<boolean> {
    const fields: string[] = [];
    const params: any[] = [];

    if (data.status !== undefined) {
      fields.push("status = ?");
      params.push(data.status);
    }

    if (fields.length === 0) return false;

    params.push(id);
    const result = await this.db.execute(
      `UPDATE payslips SET ${fields.join(", ")} WHERE id = ?`,
      params,
    );

    return result.affectedRows > 0;
  }

  /**
   * Delete payslip record
   */
  public async delete(id: number): Promise<boolean> {
    const result = await this.db.execute("DELETE FROM payslips WHERE id = ?", [id]);
    return result.affectedRows > 0;
  }

  /**
   * Count payslips by status
   */
  public async countByStatus(status: string): Promise<number> {
    const rows = await this.db.query<RowDataPacket[]>(
      "SELECT COUNT(*) as count FROM payslips WHERE status = ?",
      [status],
    );
    return (rows[0] as any).count || 0;
  }

  /**
   * Get unviewed payslips for employee
   */
  public async findUnviewedByEmployee(employeeId: number): Promise<PayslipRecord[]> {
    return await this.db.query<RowDataPacket[]>(
      `SELECT id, payroll_id, employee_id, pay_period_start, pay_period_end,
              basic_salary, allowances, deductions, gross_salary, net_salary,
              status, generated_at, updated_at
       FROM payslips
       WHERE employee_id = ? AND status IN ('generated', 'sent')
       ORDER BY pay_period_start DESC`,
      [employeeId],
    ) as PayslipRecord[];
  }
}
