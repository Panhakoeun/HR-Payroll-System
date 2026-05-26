/**
 * Payslip Routes
 * Defines all API endpoints for Payslip entity
 */

import { Router } from "express";
import { PayslipController } from "../controllers/payslipController";
import { AuthMiddleware } from "../middlewares/AuthMiddleware";

export class PayslipRoutes {
  public readonly router = Router();
  private readonly payslipController = new PayslipController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    // Get payslips for logged-in user (staff)
    // GET /api/payslips/me?limit=50&offset=0&status=viewed
    this.router.get(
      "/me",
      AuthMiddleware.verifyToken,
      this.payslipController.listMyPayslips.bind(this.payslipController),
    );

    // Get unviewed payslips for logged-in user (staff)
    // GET /api/payslips/me/unviewed
    this.router.get(
      "/me/unviewed",
      AuthMiddleware.verifyToken,
      this.payslipController.getMyUnviewedPayslips.bind(this.payslipController),
    );

    // Get all payslips (admin only)
    // GET /api/payslips?limit=50&offset=0&status=sent
    this.router.get(
      "/",
      AuthMiddleware.verifyToken,
      AuthMiddleware.requireRole("admin"),
      this.payslipController.listPayslips.bind(this.payslipController),
    );

    // Get payslips for specific employee
    // GET /api/payslips/employee/:employeeId?limit=50&offset=0&status=sent
    this.router.get(
      "/employee/:employeeId",
      AuthMiddleware.verifyToken,
      this.payslipController.listEmployeePayslips.bind(this.payslipController),
    );

    // Get unviewed payslips for employee (staff can view own)
    // GET /api/payslips/employee/:employeeId/unviewed
    this.router.get(
      "/employee/:employeeId/unviewed",
      AuthMiddleware.verifyToken,
      this.payslipController.getUnviewedPayslips.bind(this.payslipController),
    );

    // Get payslip by ID
    // GET /api/payslips/:id
    this.router.get(
      "/:id",
      AuthMiddleware.verifyToken,
      this.payslipController.getPayslip.bind(this.payslipController),
    );

    // Generate payslip from payroll (admin only)
    // POST /api/payslips/generate/:payrollId
    this.router.post(
      "/generate/:payrollId",
      AuthMiddleware.verifyToken,
      AuthMiddleware.requireRole("admin"),
      this.payslipController.generatePayslip.bind(this.payslipController),
    );

    // Update payslip status (admin only)
    // PUT /api/payslips/:id
    this.router.put(
      "/:id",
      AuthMiddleware.verifyToken,
      AuthMiddleware.requireRole("admin"),
      this.payslipController.updatePayslip.bind(this.payslipController),
    );

    // Mark payslip as sent (admin only)
    // POST /api/payslips/:id/send
    this.router.post(
      "/:id/send",
      AuthMiddleware.verifyToken,
      AuthMiddleware.requireRole("admin"),
      this.payslipController.sendPayslip.bind(this.payslipController),
    );

    // Mark payslip as viewed (staff can mark own)
    // POST /api/payslips/:id/mark-viewed
    this.router.post(
      "/:id/mark-viewed",
      AuthMiddleware.verifyToken,
      this.payslipController.markAsViewed.bind(this.payslipController),
    );

    // Delete payslip (admin only)
    // DELETE /api/payslips/:id
    this.router.delete(
      "/:id",
      AuthMiddleware.verifyToken,
      AuthMiddleware.requireRole("admin"),
      this.payslipController.deletePayslip.bind(this.payslipController),
    );
  }
}
