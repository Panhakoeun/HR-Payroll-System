/**
 * Payslip Module - Models and Interfaces
 * Defines all types and interfaces for the Payslip entity
 */

export type PayslipStatus = "draft" | "generated" | "sent" | "viewed";

// ========== Database Record Interface ==========
export interface PayslipRecord {
  id: number;
  payroll_id: number;
  employee_id: number;
  pay_period_start: Date;
  pay_period_end: Date;
  basic_salary: number;
  allowances: number;
  deductions: number;
  gross_salary: number;
  net_salary: number;
  status: PayslipStatus;
  generated_at: Date;
  updated_at: Date;
}

// ========== Request DTOs ==========
export interface CreatePayslipRequest {
  payroll_id: number;
  employee_id: number;
  pay_period_start: Date;
  pay_period_end: Date;
  basic_salary: number;
  allowances: number;
  deductions: number;
  gross_salary: number;
  net_salary: number;
}

export interface UpdatePayslipRequest {
  status?: PayslipStatus;
}

export interface PayslipFilterRequest {
  employee_id?: number;
  status?: PayslipStatus;
  pay_period_start?: Date;
  pay_period_end?: Date;
  limit?: number;
  offset?: number;
}

// ========== Response DTOs ==========
export interface PayslipResponse {
  id: number;
  payroll_id: number;
  employee_id: number;
  pay_period_start: Date;
  pay_period_end: Date;
  basic_salary: number;
  allowances: number;
  deductions: number;
  gross_salary: number;
  net_salary: number;
  status: PayslipStatus;
  generated_at: Date;
}

// ========== Class Definition ==========
export class Payslip {
  constructor(private readonly record: PayslipRecord) {}

  public toResponse(): PayslipResponse {
    return {
      id: this.record.id,
      payroll_id: this.record.payroll_id,
      employee_id: this.record.employee_id,
      pay_period_start: this.record.pay_period_start,
      pay_period_end: this.record.pay_period_end,
      basic_salary: this.record.basic_salary,
      allowances: this.record.allowances,
      deductions: this.record.deductions,
      gross_salary: this.record.gross_salary,
      net_salary: this.record.net_salary,
      status: this.record.status,
      generated_at: this.record.generated_at,
    };
  }

  /**
   * Check if payslip has been viewed
   */
  public isViewed(): boolean {
    return this.record.status === "viewed";
  }

  /**
   * Mark payslip as sent
   */
  public setSent(): PayslipStatus {
    return "sent";
  }

  /**
   * Mark payslip as viewed
   */
  public setViewed(): PayslipStatus {
    return "viewed";
  }
}
