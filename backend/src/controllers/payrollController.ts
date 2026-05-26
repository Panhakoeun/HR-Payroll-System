/**
 * Payroll Controller
 * Handles HTTP requests for Payroll entity
 */

import { Request, Response } from "express";
import { PayrollService } from "../services/payrollService";
import { CreatePayrollRequest, UpdatePayrollRequest } from "../models/Payroll";
import { HttpResponse } from "../utils/HttpResponse";

export class PayrollController {
  constructor(private readonly payrollService = new PayrollService()) {}

  /**
   * GET /api/payroll/:id
   * Get payroll by ID
   */
  public async getPayroll(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);

      if (!id || isNaN(id)) {
        HttpResponse.error(res, 400, "Invalid payroll ID");
        return;
      }

      const payroll = await this.payrollService.getPayrollById(id);

      if (!payroll) {
        HttpResponse.error(res, 404, "Payroll record not found");
        return;
      }

      res.json({ payroll });
    } catch (err) {
      console.error("Get payroll error:", err);
      HttpResponse.error(res, 500, "Server error");
    }
  }

  /**
   * GET /api/payroll
   * List all payroll records with filters
   */
  public async listPayroll(req: Request, res: Response): Promise<void> {
    try {
      const limit = Number(req.query.limit) || 50;
      const offset = Number(req.query.offset) || 0;
      const status = req.query.status as string | undefined;

      const result = await this.payrollService.listPayroll({
        status,
        limit,
        offset,
      });

      res.json({
        payroll: result.records,
        pagination: {
          total: result.total,
          limit,
          offset,
          pages: Math.ceil(result.total / limit),
        },
      });
    } catch (err) {
      console.error("List payroll error:", err);
      HttpResponse.error(res, 500, "Server error");
    }
  }

  /**
   * GET /api/payroll/employee/:employeeId
   * Get payroll records for specific employee
   */
  public async listEmployeePayroll(req: Request, res: Response): Promise<void> {
    try {
      const employeeId = Number(req.params.employeeId);
      const limit = Number(req.query.limit) || 50;
      const offset = Number(req.query.offset) || 0;
      const status = req.query.status as string | undefined;

      if (!employeeId || isNaN(employeeId)) {
        HttpResponse.error(res, 400, "Invalid employee ID");
        return;
      }

      const result = await this.payrollService.listEmployeePayroll(employeeId, {
        status,
        limit,
        offset,
      });

      res.json({
        payroll: result.records,
        pagination: {
          total: result.total,
          limit,
          offset,
          pages: Math.ceil(result.total / limit),
        },
      });
    } catch (err) {
      if (err instanceof Error && err.message === "Employee not found") {
        HttpResponse.error(res, 404, "Employee not found");
        return;
      }
      console.error("List employee payroll error:", err);
      HttpResponse.error(res, 500, "Server error");
    }
  }

  /**
   * POST /api/payroll
   * Create payroll record
   */
  public async createPayroll(req: Request, res: Response): Promise<void> {
    try {
      const data = req.body as CreatePayrollRequest;

      // Validate required fields
      if (
        !data.employee_id ||
        !data.pay_period_start ||
        !data.pay_period_end ||
        !data.basic_salary
      ) {
        HttpResponse.error(res, 400, "Missing required fields");
        return;
      }

      if (data.basic_salary <= 0) {
        HttpResponse.error(res, 400, "Invalid basic salary");
        return;
      }

      const payroll = await this.payrollService.createPayroll(data);
      res.status(201).json({ payroll });
    } catch (err) {
      if (err instanceof Error && err.message === "Employee not found") {
        HttpResponse.error(res, 404, "Employee not found");
        return;
      }
      if (err instanceof Error && err.message.includes("already exists")) {
        HttpResponse.error(res, 409, err.message);
        return;
      }
      console.error("Create payroll error:", err);
      HttpResponse.error(res, 500, "Server error");
    }
  }

  /**
   * PUT /api/payroll/:id
   * Update payroll record
   */
  public async updatePayroll(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);

      if (!id || isNaN(id)) {
        HttpResponse.error(res, 400, "Invalid payroll ID");
        return;
      }

      const data = req.body as UpdatePayrollRequest;

      const payroll = await this.payrollService.updatePayroll(id, data);
      res.json({ payroll });
    } catch (err) {
      if (err instanceof Error && err.message === "Payroll record not found") {
        HttpResponse.error(res, 404, "Payroll record not found");
        return;
      }
      console.error("Update payroll error:", err);
      HttpResponse.error(res, 500, "Server error");
    }
  }

  /**
   * POST /api/payroll/:id/approve
   * Approve payroll
   */
  public async approvePayroll(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);

      if (!id || isNaN(id)) {
        HttpResponse.error(res, 400, "Invalid payroll ID");
        return;
      }

      const payroll = await this.payrollService.approvePayroll(id);
      res.json({ payroll, message: "Payroll approved successfully" });
    } catch (err) {
      if (err instanceof Error && err.message === "Payroll record not found") {
        HttpResponse.error(res, 404, "Payroll record not found");
        return;
      }
      console.error("Approve payroll error:", err);
      HttpResponse.error(res, 500, "Server error");
    }
  }

  /**
   * POST /api/payroll/:id/process
   * Process payroll for payment
   */
  public async processPayroll(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      const paymentDate = req.body.payment_date ? new Date(req.body.payment_date) : new Date();

      if (!id || isNaN(id)) {
        HttpResponse.error(res, 400, "Invalid payroll ID");
        return;
      }

      const payroll = await this.payrollService.processPayroll(id, paymentDate);
      res.json({ payroll, message: "Payroll processed successfully" });
    } catch (err) {
      if (err instanceof Error && err.message === "Payroll record not found") {
        HttpResponse.error(res, 404, "Payroll record not found");
        return;
      }
      console.error("Process payroll error:", err);
      HttpResponse.error(res, 500, "Server error");
    }
  }

  /**
   * POST /api/payroll/:id/mark-paid
   * Mark payroll as paid
   */
  public async markAsPaid(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);

      if (!id || isNaN(id)) {
        HttpResponse.error(res, 400, "Invalid payroll ID");
        return;
      }

      const payroll = await this.payrollService.markAsPaid(id);
      res.json({ payroll, message: "Payroll marked as paid" });
    } catch (err) {
      if (err instanceof Error && err.message === "Payroll record not found") {
        HttpResponse.error(res, 404, "Payroll record not found");
        return;
      }
      console.error("Mark as paid error:", err);
      HttpResponse.error(res, 500, "Server error");
    }
  }

  /**
   * DELETE /api/payroll/:id
   * Delete payroll record
   */
  public async deletePayroll(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);

      if (!id || isNaN(id)) {
        HttpResponse.error(res, 400, "Invalid payroll ID");
        return;
      }

      await this.payrollService.deletePayroll(id);
      res.json({ message: "Payroll record deleted successfully" });
    } catch (err) {
      if (err instanceof Error && err.message === "Payroll record not found") {
        HttpResponse.error(res, 404, "Payroll record not found");
        return;
      }
      console.error("Delete payroll error:", err);
      HttpResponse.error(res, 500, "Server error");
    }
  }

  /**
   * GET /api/payroll/settings/:employeeId
   * Get payroll settings for employee
   */
  public async getPayrollSettings(req: Request, res: Response): Promise<void> {
    try {
      const employeeId = Number(req.params.employeeId);

      if (!employeeId || isNaN(employeeId)) {
        HttpResponse.error(res, 400, "Invalid employee ID");
        return;
      }

      const settings = await this.payrollService.getPayrollSettings(employeeId);
      if (!settings) {
        HttpResponse.error(res, 404, "Payroll settings not found");
        return;
      }

      res.json({ settings });
    } catch (err) {
      console.error("Get payroll settings error:", err);
      HttpResponse.error(res, 500, "Server error");
    }
  }

  /**
   * PUT /api/payroll/settings/:employeeId
   * Create/update payroll settings for employee
   */
  public async savePayrollSettings(req: Request, res: Response): Promise<void> {
    try {
      const employeeId = Number(req.params.employeeId);
      if (!employeeId || isNaN(employeeId)) {
        HttpResponse.error(res, 400, "Invalid employee ID");
        return;
      }

      const { base_salary } = req.body as { base_salary?: number };
      if (base_salary === undefined || Number(base_salary) <= 0) {
        HttpResponse.error(res, 400, "base_salary is required and must be > 0");
        return;
      }

      await this.payrollService.savePayrollSettings(employeeId, req.body);
      res.json({ message: "Payroll settings saved successfully" });
    } catch (err) {
      console.error("Save payroll settings error:", err);
      HttpResponse.error(res, 500, "Server error");
    }
  }

  /**
   * POST /api/payroll/calculate
   * Calculate payroll for a month (preview)
   */
  public async calculateMonthlyPayroll(req: Request, res: Response): Promise<void> {
    try {
      const month = Number(req.body.month);
      const year = Number(req.body.year);

      if (!month || isNaN(month) || month < 1 || month > 12) {
        HttpResponse.error(res, 400, "Invalid month (1-12)");
        return;
      }
      if (!year || isNaN(year) || year < 2000) {
        HttpResponse.error(res, 400, "Invalid year");
        return;
      }

      const summary = await this.payrollService.calculatePayrollForMonth(month, year);
      res.json({ summary });
    } catch (err) {
      if (err instanceof Error && err.message.includes("Payroll already exists")) {
        HttpResponse.error(res, 409, err.message);
        return;
      }
      console.error("Calculate payroll error:", err);
      HttpResponse.error(res, 500, "Server error");
    }
  }

  /**
   * POST /api/payroll/calculate/save
   * Calculate + persist payroll for a month
   */
  public async saveMonthlyPayroll(req: Request, res: Response): Promise<void> {
    try {
      const month = Number(req.body.month);
      const year = Number(req.body.year);

      if (!month || isNaN(month) || month < 1 || month > 12) {
        HttpResponse.error(res, 400, "Invalid month (1-12)");
        return;
      }
      if (!year || isNaN(year) || year < 2000) {
        HttpResponse.error(res, 400, "Invalid year");
        return;
      }

      const summary = await this.payrollService.calculatePayrollForMonth(month, year);
      await this.payrollService.savePayrollCalculations(month, year, summary.calculations);

      res.status(201).json({
        message: "Payroll saved successfully",
        total_employees: summary.total_employees,
        total_net: summary.total_net,
      });
    } catch (err) {
      if (err instanceof Error && err.message.includes("Payroll already exists")) {
        HttpResponse.error(res, 409, err.message);
        return;
      }
      console.error("Save monthly payroll error:", err);
      HttpResponse.error(res, 500, "Server error");
    }
  }

  /**
   * GET /api/payroll/period?month=5&year=2026
   * List payroll records for a specific month/year
   */
  public async listPayrollByPeriod(req: Request, res: Response): Promise<void> {
    try {
      const month = Number(req.query.month);
      const year = Number(req.query.year);

      if (!month || isNaN(month) || month < 1 || month > 12) {
        HttpResponse.error(res, 400, "Invalid month (1-12)");
        return;
      }
      if (!year || isNaN(year) || year < 2000) {
        HttpResponse.error(res, 400, "Invalid year");
        return;
      }

      const payroll = await this.payrollService.getPayrollListByPeriod(month, year);
      res.json({ payroll, month, year, total: payroll.length });
    } catch (err) {
      console.error("List payroll by period error:", err);
      HttpResponse.error(res, 500, "Server error");
    }
  }

  /**
   * DELETE /api/payroll/period?month=5&year=2026
   * Delete payroll (and associated payslips) for a specific month/year
   */
  public async deletePayrollPeriod(req: Request, res: Response): Promise<void> {
    try {
      const month = Number(req.query.month);
      const year = Number(req.query.year);

      if (!month || isNaN(month) || month < 1 || month > 12) {
        HttpResponse.error(res, 400, "Invalid month (1-12)");
        return;
      }
      if (!year || isNaN(year) || year < 2000) {
        HttpResponse.error(res, 400, "Invalid year");
        return;
      }

      await this.payrollService.deletePayrollByPeriod(month, year);
      res.json({ message: "Payroll period deleted successfully" });
    } catch (err) {
      console.error("Delete payroll period error:", err);
      HttpResponse.error(res, 500, "Server error");
    }
  }
}
