/**
 * Payroll Settings Module - Models and Interfaces
 * Defines payroll configuration for each employee
 */

// ========== Database Record Interface ==========
export interface PayrollSettingsRecord {
  id: number;
  employee_id: number;
  base_salary: number;
  housing_allowance: number;
  transport_allowance: number;
  other_allowances: number;
  deduction_per_absent_day: number;
  deduction_per_late_day: number;
  deduction_per_half_day: number;
  created_at: Date;
  updated_at: Date;
}

// ========== Request DTOs ==========
export interface CreatePayrollSettingsRequest {
  employee_id: number;
  base_salary: number;
  housing_allowance?: number;
  transport_allowance?: number;
  other_allowances?: number;
  deduction_per_absent_day?: number;
  deduction_per_late_day?: number;
  deduction_per_half_day?: number;
}

export interface UpdatePayrollSettingsRequest {
  base_salary?: number;
  housing_allowance?: number;
  transport_allowance?: number;
  other_allowances?: number;
  deduction_per_absent_day?: number;
  deduction_per_late_day?: number;
  deduction_per_half_day?: number;
}

// ========== Response DTOs ==========
export interface PayrollSettingsResponse {
  id: number;
  employee_id: number;
  base_salary: number;
  housing_allowance: number;
  transport_allowance: number;
  other_allowances: number;
  deduction_per_absent_day: number;
  deduction_per_late_day: number;
  deduction_per_half_day: number;
  total_allowances: number;
}

// ========== Class Definition ==========
export class PayrollSettings {
  constructor(private readonly record: PayrollSettingsRecord) {}

  public toResponse(): PayrollSettingsResponse {
    const total_allowances =
      this.record.housing_allowance +
      this.record.transport_allowance +
      this.record.other_allowances;

    return {
      id: this.record.id,
      employee_id: this.record.employee_id,
      base_salary: this.record.base_salary,
      housing_allowance: this.record.housing_allowance,
      transport_allowance: this.record.transport_allowance,
      other_allowances: this.record.other_allowances,
      deduction_per_absent_day: this.record.deduction_per_absent_day,
      deduction_per_late_day: this.record.deduction_per_late_day,
      deduction_per_half_day: this.record.deduction_per_half_day,
      total_allowances,
    };
  }

  /**
   * Calculate total allowances
   */
  public getTotalAllowances(): number {
    return (
      this.record.housing_allowance +
      this.record.transport_allowance +
      this.record.other_allowances
    );
  }

  /**
   * Get base salary
   */
  public getBaseSalary(): number {
    return this.record.base_salary;
  }

  /**
   * Get deduction per day
   */
  public getDeductionPerDay(dayType: "absent" | "late" | "half-day"): number {
    switch (dayType) {
      case "absent":
        return this.record.deduction_per_absent_day;
      case "late":
        return this.record.deduction_per_late_day;
      case "half-day":
        return this.record.deduction_per_half_day;
      default:
        return 0;
    }
  }
}
