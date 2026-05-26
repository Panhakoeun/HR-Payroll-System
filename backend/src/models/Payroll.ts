/**
 * Payroll Module - Models and Interfaces
 * Defines all types and interfaces for the Payroll entity
 */

export type PayrollStatus = "pending" | "approved" | "processed" | "paid";

// ========== Database Record Interface ==========
export interface PayrollRecord {
  id: number;
  employee_id: number;
  pay_period_start: Date;
  pay_period_end: Date;
  basic_salary: number;
  allowances: number;
  deductions: number;
  gross_salary: number;
  net_salary: number;
  status: PayrollStatus;
  payment_date: Date | null;
  remarks: string | null;
  created_at: Date;
  updated_at: Date;
}

// ========== Request DTOs ==========
export interface CreatePayrollRequest {
  employee_id: number;
  pay_period_start: Date;
  pay_period_end: Date;
  basic_salary: number;
  allowances?: number;
  deductions?: number;
  remarks?: string;
}

export interface UpdatePayrollRequest {
  allowances?: number;
  deductions?: number;
  status?: PayrollStatus;
  payment_date?: Date;
  remarks?: string;
}

export interface PayrollFilterRequest {
  employee_id?: number;
  status?: PayrollStatus;
  pay_period_start?: Date;
  pay_period_end?: Date;
  limit?: number;
  offset?: number;
}

// ========== Response DTOs ==========
export interface PayrollResponse {
  id: number;
  employee_id: number;
  pay_period_start: Date;
  pay_period_end: Date;
  basic_salary: number;
  allowances: number;
  deductions: number;
  gross_salary: number;
  net_salary: number;
  status: PayrollStatus;
  payment_date: Date | null;
  remarks: string | null;
}

// ========== Class Definition ==========
export class Payroll {
  constructor(private readonly record: PayrollRecord) {}

  public toResponse(): PayrollResponse {
    return {
      id: this.record.id,
      employee_id: this.record.employee_id,
      pay_period_start: this.record.pay_period_start,
      pay_period_end: this.record.pay_period_end,
      basic_salary: this.record.basic_salary,
      allowances: this.record.allowances,
      deductions: this.record.deductions,
      gross_salary: this.record.gross_salary,
      net_salary: this.record.net_salary,
      status: this.record.status,
      payment_date: this.record.payment_date,
      remarks: this.record.remarks,
    };
  }

  /**
   * Check if payroll is paid
   */
  public isPaid(): boolean {
    return this.record.status === "paid";
  }

  /**
   * Calculate payroll amounts
   */
  public static calculatePayroll(
    basicSalary: number,
    allowances: number = 0,
    deductions: number = 0,
  ): { gross: number; net: number } {
    const gross = basicSalary + allowances;
    const net = gross - deductions;

    return {
      gross: Math.round(gross * 100) / 100,
      net: Math.round(net * 100) / 100,
    };
  }
}
