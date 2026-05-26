/**
 * Dashboard Routes
 * Defines all dashboard-related endpoints
 */

import { Router, Request, Response, NextFunction } from "express";
import { DashboardController } from "../controllers/DashboardConttroller";
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
      (req: Request, res: Response, next: NextFunction) =>
        AuthMiddleware.verifyToken(req, res, next),
      (req: Request, res: Response) =>
        this.dashboardController.getAdminDashboard(req, res),
    );

    /**
     * @route GET /api/dashboard/staff
     * @description Get staff member dashboard with personal statistics
     * @access Staff (own data) / Admin (any staff member's data)
     */
    this.router.get(
      "/staff",
      (req: Request, res: Response, next: NextFunction) =>
        AuthMiddleware.verifyToken(req, res, next),
      (req: Request, res: Response) =>
        this.dashboardController.getStaffDashboard(req, res),
    );

    /**
     * @route GET /api/dashboard/summary
     * @description Get summary data based on user role
     * @access All authenticated users
     */
    this.router.get(
      "/summary",
      (req: Request, res: Response, next: NextFunction) =>
        AuthMiddleware.verifyToken(req, res, next),
      (req: Request, res: Response) =>
        this.dashboardController.getSummary(req, res),
    );
  }
}
