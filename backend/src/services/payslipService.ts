/**
 * Payslip Service
 * Business logic layer for Payslip operations
 */

import { PayslipRepository } from "../repositories/payslipRepositories";
import { PayrollRepository } from "../repositories/payrollRepositories";
import { EmployeeRepository } from "../repositories/employeeRepositories";
import {
  CreatePayslipRequest,
  UpdatePayslipRequest,
  PayslipResponse,
  Payslip,
} from "../models/Payslip";

export class PayslipService {
  constructor(
    private readonly payslipRepository = new PayslipRepository(),
    private readonly payrollRepository = new PayrollRepository(),
    private readonly employeeRepository = new EmployeeRepository(),
  ) {}

  /**
   * Get payslip by ID
   */
  public async getPayslipById(id: number): Promise<PayslipResponse | null> {
    const record = await this.payslipRepository.findById(id);
    if (!record) return null;
    return new Payslip(record).toResponse();
  }

  /**
   * Get payslips for employee
   */
  public async listEmployeePayslips(
    employeeId: number,
    filters?: {
      status?: string;
      limit?: number;
      offset?: number;
    },
  ): Promise<{ payslips: PayslipResponse[]; total: number }> {
    // Verify employee exists
    const employee = await this.employeeRepository.findById(employeeId);
    if (!employee) {
      throw new Error("Employee not found");
    }

    const limit = filters?.limit || 50;
    const offset = filters?.offset || 0;

    const records = await this.payslipRepository.findByEmployee(
      employeeId,
      filters?.status,
      limit,
      offset,
    );

    return {
      payslips: records.map((r) => new Payslip(r).toResponse()),
      total: records.length,
    };
  }

  /**
   * Get all payslips with filters
   */
  public async listPayslips(
    filters?: {
      status?: string;
      limit?: number;
      offset?: number;
    },
  ): Promise<{ payslips: PayslipResponse[]; total: number }> {
    const limit = filters?.limit || 50;
    const offset = filters?.offset || 0;

    const records = await this.payslipRepository.findAll(filters?.status, limit, offset);

    return {
      payslips: records.map((r) => new Payslip(r).toResponse()),
      total: records.length,
    };
  }

  /**
   * Generate payslip from payroll
   */
  public async generatePayslip(payrollId: number): Promise<PayslipResponse> {
    // Verify payroll exists
    const payroll = await this.payrollRepository.findById(payrollId);
    if (!payroll) {
      throw new Error("Payroll record not found");
    }

    // Check if payslip already exists
    const existing = await this.payslipRepository.findByPayrollId(payrollId);
    if (existing) {
      throw new Error("Payslip already generated for this payroll");
    }

    // Create payslip from payroll data
    const payslipData: CreatePayslipRequest = {
      payroll_id: payroll.id,
      employee_id: payroll.employee_id,
      pay_period_start: payroll.pay_period_start,
      pay_period_end: payroll.pay_period_end,
      basic_salary: payroll.basic_salary,
      allowances: payroll.allowances,
      deductions: payroll.deductions,
      gross_salary: payroll.gross_salary,
      net_salary: payroll.net_salary,
    };

    const payslipId = await this.payslipRepository.create(payslipData);

    // Fetch and return created payslip
    const record = await this.payslipRepository.findById(payslipId);
    if (!record) {
      throw new Error("Failed to generate payslip");
    }

    return new Payslip(record).toResponse();
  }

  /**
   * Update payslip status
   */
  public async updatePayslip(
    id: number,
    data: UpdatePayslipRequest,
  ): Promise<PayslipResponse> {
    // Verify record exists
    const record = await this.payslipRepository.findById(id);
    if (!record) {
      throw new Error("Payslip not found");
    }

    // Update record
    const updated = await this.payslipRepository.update(id, data);
    if (!updated) {
      throw new Error("Failed to update payslip");
    }

    // Fetch and return updated record
    const updatedRecord = await this.payslipRepository.findById(id);
    if (!updatedRecord) {
      throw new Error("Failed to fetch updated payslip");
    }

    return new Payslip(updatedRecord).toResponse();
  }

  /**
   * Mark payslip as sent
   */
  public async sendPayslip(id: number): Promise<PayslipResponse> {
    return this.updatePayslip(id, { status: "sent" });
  }

  /**
   * Mark payslip as viewed by employee
   */
  public async markAsViewed(id: number): Promise<PayslipResponse> {
    return this.updatePayslip(id, { status: "viewed" });
  }

  /**
   * Delete payslip
   */
  public async deletePayslip(id: number): Promise<void> {
    const record = await this.payslipRepository.findById(id);
    if (!record) {
      throw new Error("Payslip not found");
    }

    const deleted = await this.payslipRepository.delete(id);
    if (!deleted) {
      throw new Error("Failed to delete payslip");
    }
  }

  /**
   * Get unviewed payslips for employee
   */
  public async getUnviewedPayslips(employeeId: number): Promise<PayslipResponse[]> {
    const records = await this.payslipRepository.findUnviewedByEmployee(employeeId);
    return records.map((r) => new Payslip(r).toResponse());
  }
}
