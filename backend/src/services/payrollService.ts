/**
 * Payroll Service
 * Business logic for payroll calculations and processing
 * Covers US-18 and US-19
 */

import { Database } from "../database/Database";
import { RowDataPacket } from "mysql2";
import { PayrollRepository } from "../repositories/payrooRepositories";
import { EmployeeRepository } from "../repositories/employeeRepositories";
import { PayrollSettingsRepository } from "../repositories/payrollSettingsRepositories";
import {
  CreatePayrollRequest,
  UpdatePayrollRequest,
  PayrollResponse,
  Payroll,
} from "../models/Payroll";

export interface PayrollCalculation {
  employee_id: number;
  employee_name: string;
  base_salary: number;
  allowances: number;
  deductions: number;
  gross_salary: number;
  net_salary: number;
}

type EmployeePayrollAmounts = Omit<PayrollCalculation, "employee_id" | "employee_name">;

export interface PayrollSummary {
  month: string;
  year: number;
  total_employees: number;
  calculations: PayrollCalculation[];
  total_gross: number;
  total_deductions: number;
  total_net: number;
}

export class PayrollService {
  private readonly db = Database.getInstance();
  private readonly payrollRepository = new PayrollRepository();
  private readonly employeeRepository = new EmployeeRepository();
  private readonly settingsRepo = new PayrollSettingsRepository();

  /**
   * Get payroll by ID
   */
  public async getPayrollById(id: number): Promise<PayrollResponse | null> {
    const record = await this.payrollRepository.findById(id);
    if (!record) return null;
    return new Payroll(record).toResponse();
  }

  /**
   * Get payroll for employee in period
   */
  public async getPayrollByPeriod(
    employeeId: number,
    startDate: Date,
    endDate: Date,
  ): Promise<PayrollResponse | null> {
    const employee = await this.employeeRepository.findById(employeeId);
    if (!employee) {
      throw new Error("Employee not found");
    }

    const record = await this.payrollRepository.findByEmployeeAndPeriod(
      employeeId,
      startDate,
      endDate,
    );
    if (!record) return null;
    return new Payroll(record).toResponse();
  }

  /**
   * Get payroll settings for an employee (US-18 AC1)
   */
  public async getPayrollSettings(employeeId: number) {
    return await this.settingsRepo.findByEmployeeId(employeeId);
  }

  /**
   * Save or update payroll settings (US-18 AC3, AC4)
   */
  public async savePayrollSettings(employeeId: number, settings: any) {
    const exists = await this.settingsRepo.existsForEmployee(employeeId);

    if (exists) {
      const record = await this.settingsRepo.findByEmployeeId(employeeId);
      if (record) {
        await this.settingsRepo.update(record.id, settings);
      }
    } else {
      await this.settingsRepo.create({
        employee_id: employeeId,
        ...settings,
      });
    }
  }

  /**
   * Run payroll for all employees for a specific month (US-19)
   * Calculates: gross pay, deductions, net pay
   */
  public async calculatePayrollForMonth(
    month: number,
    year: number,
  ): Promise<PayrollSummary> {
    // Check if payroll already exists for this period (US-19 AC5)
    const periodStart = `${year}-${String(month).padStart(2, "0")}-01`;
    const periodEnd = new Date(year, month, 0).toISOString().split("T")[0];

    const existingPayroll = await this.db.query<RowDataPacket[]>(
      `SELECT id FROM payroll 
       WHERE pay_period_start = ? AND pay_period_end = ? 
       LIMIT 1`,
      [periodStart, periodEnd],
    );

    if (existingPayroll.length > 0) {
      throw new Error(
        `Payroll already exists for ${month}/${year}. Delete existing payroll to run again.`,
      );
    }

    // Get all active employees
    const employees = await this.db.query<RowDataPacket[]>(
      `SELECT id, first_name, last_name, salary FROM employees WHERE status = 'active'`,
    );

    const calculations: PayrollCalculation[] = [];
    let totalGross = 0;
    let totalDeductions = 0;
    let totalNet = 0;

    for (const employee of employees) {
      const calculation = await this.calculateEmployeePayroll(
        employee.id,
        month,
        year,
      );

      if (calculation) {
        calculations.push({
          employee_id: employee.id,
          employee_name: `${employee.first_name} ${employee.last_name}`,
          ...calculation,
        });

        totalGross += calculation.gross_salary;
        totalDeductions += calculation.deductions;
        totalNet += calculation.net_salary;
      }
    }

    return {
      month: new Date(year, month - 1).toLocaleString("default", {
        month: "long",
      }),
      year,
      total_employees: calculations.length,
      calculations,
      total_gross: Math.round(totalGross * 100) / 100,
      total_deductions: Math.round(totalDeductions * 100) / 100,
      total_net: Math.round(totalNet * 100) / 100,
    };
  }

  /**
   * Calculate payroll for a single employee
   */
  private async calculateEmployeePayroll(
    employeeId: number,
    month: number,
    year: number,
  ): Promise<EmployeePayrollAmounts | null> {
    // Get payroll settings
    const settings = await this.settingsRepo.findByEmployeeId(employeeId);
    if (!settings) {
      throw new Error(
        `Payroll settings not found for employee ${employeeId}`,
      );
    }

    const baseSalary = settings.base_salary;

    // Calculate allowances
    const allowances =
      settings.housing_allowance +
      settings.transport_allowance +
      settings.other_allowances;

    // Get attendance deductions
    const monthStart = new Date(year, month - 1, 1);
    const monthEnd = new Date(year, month, 0);
    const startStr = monthStart.toISOString().split("T")[0];
    const endStr = monthEnd.toISOString().split("T")[0];

    const attendance = await this.db.query<RowDataPacket[]>(
      `SELECT status, COUNT(*) as count
       FROM attendance
       WHERE employee_id = ? AND attendance_date BETWEEN ? AND ?
       GROUP BY status`,
      [employeeId, startStr, endStr],
    );

    let deductions = 0;
    for (const record of attendance) {
      if (record.status === "absent") {
        deductions += record.count * settings.deduction_per_absent_day;
      } else if (record.status === "late") {
        deductions += record.count * settings.deduction_per_late_day;
      } else if (record.status === "half-day") {
        deductions += record.count * settings.deduction_per_half_day;
      }
    }

    // Calculate gross and net
    const grossSalary = baseSalary + allowances;
    const netSalary = Math.max(0, grossSalary - deductions);

    return {
      base_salary: Math.round(baseSalary * 100) / 100,
      allowances: Math.round(allowances * 100) / 100,
      deductions: Math.round(deductions * 100) / 100,
      gross_salary: Math.round(grossSalary * 100) / 100,
      net_salary: Math.round(netSalary * 100) / 100,
    };
  }

  /**
   * Save payroll records to database (after confirmation)
   */
  public async savePayrollCalculations(
    month: number,
    year: number,
    calculations: PayrollCalculation[],
  ): Promise<void> {
    const periodStart = `${year}-${String(month).padStart(2, "0")}-01`;
    const periodEnd = new Date(year, month, 0).toISOString().split("T")[0];

    for (const calc of calculations) {
      await this.db.query(
        `INSERT INTO payroll 
         (employee_id, pay_period_start, pay_period_end, basic_salary, 
          allowances, deductions, gross_salary, net_salary, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          calc.employee_id,
          periodStart,
          periodEnd,
          calc.base_salary,
          calc.allowances,
          calc.deductions,
          calc.gross_salary,
          calc.net_salary,
          "pending",
        ],
      );
    }
  }

  /**
   * Get payroll for a specific period
   */
  public async getPayrollListByPeriod(month: number, year: number) {
    return await this.db.query<RowDataPacket[]>(
      `SELECT p.*, e.first_name, e.last_name, e.employee_id
       FROM payroll p
       JOIN employees e ON p.employee_id = e.id
       WHERE YEAR(p.pay_period_start) = ? AND MONTH(p.pay_period_start) = ?
       ORDER BY e.employee_id ASC`,
      [year, month],
    );
  }

  /**
   * Delete payroll for a period (US-19 AC5 - allow deletion to rerun)
   */
  public async deletePayrollByPeriod(month: number, year: number): Promise<void> {
    const periodStart = `${year}-${String(month).padStart(2, "0")}-01`;
    const periodEnd = new Date(year, month, 0).toISOString().split("T")[0];

    // Delete associated payslips first
    await this.db.query(
      `DELETE ps FROM payslips ps
       JOIN payroll p ON ps.payroll_id = p.id
       WHERE p.pay_period_start = ? AND p.pay_period_end = ?`,
      [periodStart, periodEnd],
    );

    // Delete payroll records
    await this.db.query(
      `DELETE FROM payroll 
       WHERE pay_period_start = ? AND pay_period_end = ?`,
      [periodStart, periodEnd],
    );
  }

  /**
   * Get all payroll records for employee
   */
  public async listEmployeePayroll(
    employeeId: number,
    filters?: {
      status?: string;
      limit?: number;
      offset?: number;
    },
  ): Promise<{ records: PayrollResponse[]; total: number }> {
    // Verify employee exists
    const employee = await this.employeeRepository.findById(employeeId);
    if (!employee) {
      throw new Error("Employee not found");
    }

    const limit = filters?.limit || 50;
    const offset = filters?.offset || 0;

    const records = await this.payrollRepository.findByEmployee(
      employeeId,
      filters?.status,
      limit,
      offset,
    );

    return {
      records: records.map((r) => new Payroll(r).toResponse()),
      total: records.length,
    };
  }

  /**
   * Get all payroll records with filters
   */
  public async listPayroll(
    filters?: {
      status?: string;
      limit?: number;
      offset?: number;
    },
  ): Promise<{ records: PayrollResponse[]; total: number }> {
    const limit = filters?.limit || 50;
    const offset = filters?.offset || 0;

    const records = await this.payrollRepository.findAll(filters?.status, limit, offset);

    return {
      records: records.map((r) => new Payroll(r).toResponse()),
      total: records.length,
    };
  }

  /**
   * Create payroll record
   */
  public async createPayroll(data: CreatePayrollRequest): Promise<PayrollResponse> {
    // Verify employee exists
    const employee = await this.employeeRepository.findById(data.employee_id);
    if (!employee) {
      throw new Error("Employee not found");
    }

    // Check if payroll already exists for this period
    const existing = await this.payrollRepository.findByEmployeeAndPeriod(
      data.employee_id,
      data.pay_period_start,
      data.pay_period_end,
    );
    if (existing) {
      throw new Error("Payroll already exists for this period");
    }

    // Create payroll
    const payrollId = await this.payrollRepository.create(data);

    // Fetch and return created record
    const record = await this.payrollRepository.findById(payrollId);
    if (!record) {
      throw new Error("Failed to create payroll record");
    }

    return new Payroll(record).toResponse();
  }

  /**
   * Update payroll record
   */
  public async updatePayroll(
    id: number,
    data: UpdatePayrollRequest,
  ): Promise<PayrollResponse> {
    // Verify record exists
    const record = await this.payrollRepository.findById(id);
    if (!record) {
      throw new Error("Payroll record not found");
    }

    // Update record
    const updated = await this.payrollRepository.update(id, data);
    if (!updated) {
      throw new Error("Failed to update payroll record");
    }

    // Fetch and return updated record
    const updatedRecord = await this.payrollRepository.findById(id);
    if (!updatedRecord) {
      throw new Error("Failed to fetch updated record");
    }

    return new Payroll(updatedRecord).toResponse();
  }

  /**
   * Approve payroll
   */
  public async approvePayroll(id: number): Promise<PayrollResponse> {
    return this.updatePayroll(id, { status: "approved" });
  }

  /**
   * Process payroll (for payment)
   */
  public async processPayroll(id: number, paymentDate: Date): Promise<PayrollResponse> {
    return this.updatePayroll(id, {
      status: "processed",
      payment_date: paymentDate,
    });
  }

  /**
   * Mark payroll as paid
   */
  public async markAsPaid(id: number): Promise<PayrollResponse> {
    return this.updatePayroll(id, { status: "paid" });
  }

  /**
   * Delete payroll record
   */
  public async deletePayroll(id: number): Promise<void> {
    const record = await this.payrollRepository.findById(id);
    if (!record) {
      throw new Error("Payroll record not found");
    }

    const deleted = await this.payrollRepository.delete(id);
    if (!deleted) {
      throw new Error("Failed to delete payroll record");
    }
  }

  /**
   * Get pending payroll count
   */
  public async getPendingPayrollCount(): Promise<number> {
    return this.payrollRepository.countByStatus("pending");
  }
}
