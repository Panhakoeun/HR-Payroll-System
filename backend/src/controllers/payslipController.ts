/**
 * Payslip Controller
 * Handles HTTP requests for Payslip entity
 */

import { Request, Response } from "express";
import { PayslipService } from "../services/payslipService";
import { UpdatePayslipRequest } from "../models/Payslip";
import { EmployeeRepository } from "../repositories/employeeRepositories";
import { HttpResponse } from "../utils/HttpResponse";

export class PayslipController {
  constructor(
    private readonly payslipService = new PayslipService(),
    private readonly employeeRepository = new EmployeeRepository(),
  ) {}

  /**
   * GET /api/payslips/me
   * Get payslips for the logged-in user (staff)
   */
  public async listMyPayslips(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        HttpResponse.error(res, 401, "Unauthorized");
        return;
      }

      const employee = await this.employeeRepository.findByUserId(userId);
      if (!employee) {
        HttpResponse.error(res, 404, "Employee record not found for this user");
        return;
      }

      const limit = Number(req.query.limit) || 50;
      const offset = Number(req.query.offset) || 0;
      const status = req.query.status as string | undefined;

      const result = await this.payslipService.listEmployeePayslips(employee.id, {
        status,
        limit,
        offset,
      });

      res.json({
        payslips: result.payslips,
        pagination: {
          total: result.total,
          limit,
          offset,
          pages: Math.ceil(result.total / limit),
        },
      });
    } catch (err) {
      console.error("List my payslips error:", err);
      HttpResponse.error(res, 500, "Server error");
    }
  }

  /**
   * GET /api/payslips/me/unviewed
   * Get unviewed payslips for the logged-in user (staff)
   */
  public async getMyUnviewedPayslips(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        HttpResponse.error(res, 401, "Unauthorized");
        return;
      }

      const employee = await this.employeeRepository.findByUserId(userId);
      if (!employee) {
        HttpResponse.error(res, 404, "Employee record not found for this user");
        return;
      }

      const payslips = await this.payslipService.getUnviewedPayslips(employee.id);
      res.json({ payslips, count: payslips.length });
    } catch (err) {
      console.error("Get my unviewed payslips error:", err);
      HttpResponse.error(res, 500, "Server error");
    }
  }

  /**
   * GET /api/payslips/:id
   * Get payslip by ID
   */
  public async getPayslip(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);

      if (!id || isNaN(id)) {
        HttpResponse.error(res, 400, "Invalid payslip ID");
        return;
      }

      const payslip = await this.payslipService.getPayslipById(id);

      if (!payslip) {
        HttpResponse.error(res, 404, "Payslip not found");
        return;
      }

      res.json({ payslip });
    } catch (err) {
      console.error("Get payslip error:", err);
      HttpResponse.error(res, 500, "Server error");
    }
  }

  /**
   * GET /api/payslips
   * List all payslips with filters
   */
  public async listPayslips(req: Request, res: Response): Promise<void> {
    try {
      const limit = Number(req.query.limit) || 50;
      const offset = Number(req.query.offset) || 0;
      const status = req.query.status as string | undefined;

      const result = await this.payslipService.listPayslips({
        status,
        limit,
        offset,
      });

      res.json({
        payslips: result.payslips,
        pagination: {
          total: result.total,
          limit,
          offset,
          pages: Math.ceil(result.total / limit),
        },
      });
    } catch (err) {
      console.error("List payslips error:", err);
      HttpResponse.error(res, 500, "Server error");
    }
  }

  /**
   * GET /api/payslips/employee/:employeeId
   * Get payslips for specific employee
   */
  public async listEmployeePayslips(req: Request, res: Response): Promise<void> {
    try {
      const employeeId = Number(req.params.employeeId);
      const limit = Number(req.query.limit) || 50;
      const offset = Number(req.query.offset) || 0;
      const status = req.query.status as string | undefined;

      if (!employeeId || isNaN(employeeId)) {
        HttpResponse.error(res, 400, "Invalid employee ID");
        return;
      }

      const result = await this.payslipService.listEmployeePayslips(employeeId, {
        status,
        limit,
        offset,
      });

      res.json({
        payslips: result.payslips,
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
      console.error("List employee payslips error:", err);
      HttpResponse.error(res, 500, "Server error");
    }
  }

  /**
   * GET /api/payslips/employee/:employeeId/unviewed
   * Get unviewed payslips for employee
   */
  public async getUnviewedPayslips(req: Request, res: Response): Promise<void> {
    try {
      const employeeId = Number(req.params.employeeId);

      if (!employeeId || isNaN(employeeId)) {
        HttpResponse.error(res, 400, "Invalid employee ID");
        return;
      }

      const payslips = await this.payslipService.getUnviewedPayslips(employeeId);
      res.json({ payslips, count: payslips.length });
    } catch (err) {
      console.error("Get unviewed payslips error:", err);
      HttpResponse.error(res, 500, "Server error");
    }
  }

  /**
   * POST /api/payslips/generate/:payrollId
   * Generate payslip from payroll
   */
  public async generatePayslip(req: Request, res: Response): Promise<void> {
    try {
      const payrollId = Number(req.params.payrollId);

      if (!payrollId || isNaN(payrollId)) {
        HttpResponse.error(res, 400, "Invalid payroll ID");
        return;
      }

      const payslip = await this.payslipService.generatePayslip(payrollId);
      res.status(201).json({ payslip });
    } catch (err) {
      if (err instanceof Error && err.message === "Payroll record not found") {
        HttpResponse.error(res, 404, "Payroll record not found");
        return;
      }
      if (err instanceof Error && err.message.includes("already generated")) {
        HttpResponse.error(res, 409, err.message);
        return;
      }
      console.error("Generate payslip error:", err);
      HttpResponse.error(res, 500, "Server error");
    }
  }

  /**
   * PUT /api/payslips/:id
   * Update payslip status
   */
  public async updatePayslip(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);

      if (!id || isNaN(id)) {
        HttpResponse.error(res, 400, "Invalid payslip ID");
        return;
      }

      const data = req.body as UpdatePayslipRequest;

      const payslip = await this.payslipService.updatePayslip(id, data);
      res.json({ payslip });
    } catch (err) {
      if (err instanceof Error && err.message === "Payslip not found") {
        HttpResponse.error(res, 404, "Payslip not found");
        return;
      }
      console.error("Update payslip error:", err);
      HttpResponse.error(res, 500, "Server error");
    }
  }

  /**
   * POST /api/payslips/:id/send
   * Mark payslip as sent
   */
  public async sendPayslip(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);

      if (!id || isNaN(id)) {
        HttpResponse.error(res, 400, "Invalid payslip ID");
        return;
      }

      const payslip = await this.payslipService.sendPayslip(id);
      res.json({ payslip, message: "Payslip sent successfully" });
    } catch (err) {
      if (err instanceof Error && err.message === "Payslip not found") {
        HttpResponse.error(res, 404, "Payslip not found");
        return;
      }
      console.error("Send payslip error:", err);
      HttpResponse.error(res, 500, "Server error");
    }
  }

  /**
   * POST /api/payslips/:id/mark-viewed
   * Mark payslip as viewed
   */
  public async markAsViewed(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);

      if (!id || isNaN(id)) {
        HttpResponse.error(res, 400, "Invalid payslip ID");
        return;
      }

      const payslip = await this.payslipService.markAsViewed(id);
      res.json({ payslip, message: "Payslip marked as viewed" });
    } catch (err) {
      if (err instanceof Error && err.message === "Payslip not found") {
        HttpResponse.error(res, 404, "Payslip not found");
        return;
      }
      console.error("Mark as viewed error:", err);
      HttpResponse.error(res, 500, "Server error");
    }
  }

  /**
   * DELETE /api/payslips/:id
   * Delete payslip
   */
  public async deletePayslip(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);

      if (!id || isNaN(id)) {
        HttpResponse.error(res, 400, "Invalid payslip ID");
        return;
      }

      await this.payslipService.deletePayslip(id);
      res.json({ message: "Payslip deleted successfully" });
    } catch (err) {
      if (err instanceof Error && err.message === "Payslip not found") {
        HttpResponse.error(res, 404, "Payslip not found");
        return;
      }
      console.error("Delete payslip error:", err);
      HttpResponse.error(res, 500, "Server error");
    }
  }
}
