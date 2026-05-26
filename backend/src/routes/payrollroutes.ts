/**
 * Payroll Routes\n * Defines all API endpoints for Payroll entity
 */

import { Router } from "express";
import { PayrollController } from "../controllers/payrollController";
import { AuthMiddleware } from "../middlewares/AuthMiddleware";

export class PayrollRoutes {
  public readonly router = Router();
  private readonly payrollController = new PayrollController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    // Get all payroll records (admin only)
    // GET /api/payroll?limit=50&offset=0&status=pending
    this.router.get(
      "/",
      AuthMiddleware.verifyToken,
      AuthMiddleware.requireRole("admin"),
      this.payrollController.listPayroll.bind(this.payrollController),
    );

    // Get payroll for specific employee
    // GET /api/payroll/employee/:employeeId?limit=50&offset=0&status=paid
    this.router.get(
      "/employee/:employeeId",
      AuthMiddleware.verifyToken,
      this.payrollController.listEmployeePayroll.bind(this.payrollController),
    );

    // Payroll settings (admin only)
    // GET /api/payroll/settings/:employeeId
    this.router.get(
      "/settings/:employeeId",
      AuthMiddleware.verifyToken,
      AuthMiddleware.requireRole("admin"),
      this.payrollController.getPayrollSettings.bind(this.payrollController),
    );

    // PUT /api/payroll/settings/:employeeId
    this.router.put(
      "/settings/:employeeId",
      AuthMiddleware.verifyToken,
      AuthMiddleware.requireRole("admin"),
      this.payrollController.savePayrollSettings.bind(this.payrollController),
    );

    // Calculate monthly payroll (admin only)
    // POST /api/payroll/calculate
    this.router.post(
      "/calculate",
      AuthMiddleware.verifyToken,
      AuthMiddleware.requireRole("admin"),
      this.payrollController.calculateMonthlyPayroll.bind(this.payrollController),
    );

    // Calculate + save monthly payroll (admin only)
    // POST /api/payroll/calculate/save
    this.router.post(
      "/calculate/save",
      AuthMiddleware.verifyToken,
      AuthMiddleware.requireRole("admin"),
      this.payrollController.saveMonthlyPayroll.bind(this.payrollController),
    );

    // List payroll by period (admin only)
    // GET /api/payroll/period?month=5&year=2026
    this.router.get(
      "/period",
      AuthMiddleware.verifyToken,
      AuthMiddleware.requireRole("admin"),
      this.payrollController.listPayrollByPeriod.bind(this.payrollController),
    );

    // Delete payroll by period (admin only)
    // DELETE /api/payroll/period?month=5&year=2026
    this.router.delete(
      "/period",
      AuthMiddleware.verifyToken,
      AuthMiddleware.requireRole("admin"),
      this.payrollController.deletePayrollPeriod.bind(this.payrollController),
    );

    // Get payroll by ID
    // GET /api/payroll/:id
    this.router.get(
      "/:id",
      AuthMiddleware.verifyToken,
      this.payrollController.getPayroll.bind(this.payrollController),
    );

    // Create payroll (admin only)
    // POST /api/payroll
    this.router.post(
      "/",
      AuthMiddleware.verifyToken,
      AuthMiddleware.requireRole("admin"),
      this.payrollController.createPayroll.bind(this.payrollController),
    );

    // Update payroll (admin only)
    // PUT /api/payroll/:id
    this.router.put(
      "/:id",
      AuthMiddleware.verifyToken,
      AuthMiddleware.requireRole("admin"),
      this.payrollController.updatePayroll.bind(this.payrollController),
    );

    // Approve payroll (admin only)
    // POST /api/payroll/:id/approve
    this.router.post(
      "/:id/approve",
      AuthMiddleware.verifyToken,
      AuthMiddleware.requireRole("admin"),
      this.payrollController.approvePayroll.bind(this.payrollController),
    );

    // Process payroll (admin only)
    // POST /api/payroll/:id/process
    this.router.post(
      "/:id/process",
      AuthMiddleware.verifyToken,
      AuthMiddleware.requireRole("admin"),
      this.payrollController.processPayroll.bind(this.payrollController),
    );

    // Mark payroll as paid (admin only)
    // POST /api/payroll/:id/mark-paid
    this.router.post(
      "/:id/mark-paid",
      AuthMiddleware.verifyToken,
      AuthMiddleware.requireRole("admin"),
      this.payrollController.markAsPaid.bind(this.payrollController),
    );

    // Delete payroll (admin only)
    // DELETE /api/payroll/:id
    this.router.delete(
      "/:id",
      AuthMiddleware.verifyToken,
      AuthMiddleware.requireRole("admin"),
      this.payrollController.deletePayroll.bind(this.payrollController),
    );
  }
}
