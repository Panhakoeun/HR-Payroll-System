/**
 * Payroll Validation
 * Input validation rules for Payroll operations
 */

import { CreatePayrollRequest, UpdatePayrollRequest } from "../models/Payroll";

export class PayrollValidation {
  /**
   * Validate create payroll request
   */
  public static validateCreatePayroll(body: Partial<CreatePayrollRequest>): string | null {
    if (!body.employee_id) {
      return "Employee ID is required";
    }

    if (!body.pay_period_start) {
      return "Pay period start date is required";
    }

    if (!body.pay_period_end) {
      return "Pay period end date is required";
    }

    if (!body.basic_salary || body.basic_salary <= 0) {
      return "Basic salary is required and must be greater than 0";
    }

    if (body.allowances !== undefined && body.allowances < 0) {
      return "Allowances cannot be negative";
    }

    if (body.deductions !== undefined && body.deductions < 0) {
      return "Deductions cannot be negative";
    }

    // Validate date range
    const startDate = new Date(body.pay_period_start);
    const endDate = new Date(body.pay_period_end);

    if (startDate >= endDate) {
      return "Pay period start date must be before end date";
    }

    return null;
  }

  /**
   * Validate update payroll request
   */
  public static validateUpdatePayroll(body: Partial<UpdatePayrollRequest>): string | null {
    if (body.allowances !== undefined && body.allowances < 0) {
      return "Allowances cannot be negative";
    }

    if (body.deductions !== undefined && body.deductions < 0) {
      return "Deductions cannot be negative";
    }

    if (body.status && !this.isValidStatus(body.status)) {
      return "Invalid payroll status";
    }

    return null;
  }

  private static isValidStatus(status: string): boolean {
    return ["pending", "approved", "processed", "paid"].includes(status);
  }
}
