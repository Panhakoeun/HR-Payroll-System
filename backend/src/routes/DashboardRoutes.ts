/**
 * Dashboard Routes
 * Defines all dashboard-related endpoints
 */

import { Router } from "express";
import { DashboardController } from "../controllers/DashboardController";
import { AuthMiddleware } from "../middlewares/AuthMiddleware";

export class DashboardRoutes {
  public readonly router: Router = Router();
  private readonly dashboardController = new DashboardController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    /**
     * @route GET /api/dashboard/admin
     * @description Get admin/HR dashboard with company-wide statistics
     * @access Admin/HR
     */
    this.router.get(
      "/admin",
      AuthMiddleware.verifyToken,
      AuthMiddleware.requireRole("admin"),
      this.dashboardController.getAdminDashboard.bind(this.dashboardController),
    );

    /**
     * @route GET /api/dashboard/staff
     * @description Get staff member dashboard with personal statistics
     * @access Staff (own data) / Admin (any staff member's data)
     */
    this.router.get(
      "/staff",
      AuthMiddleware.verifyToken,
      this.dashboardController.getStaffDashboard.bind(this.dashboardController),
    );

    /**
     * @route GET /api/dashboard/summary
     * @description Get summary data based on user role
     * @access All authenticated users
     */
    this.router.get(
      "/summary",
      AuthMiddleware.verifyToken,
      this.dashboardController.getSummary.bind(this.dashboardController),
    );
  }
}
