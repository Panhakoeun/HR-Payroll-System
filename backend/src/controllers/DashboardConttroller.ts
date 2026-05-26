/**
 * Dashboard Controller
 * Handles HTTP requests for dashboard operations
 */

import { Request, Response } from "express";
import { DashboardService, AdminDashboardData, StaffDashboardData } from "../services/DashboardService";
import { EmployeeRepository } from "../repositories/employeeRepositories";
import { HttpResponse } from "../utils/HttpResponse";

export class DashboardController {
  private readonly dashboardService = new DashboardService();
  private readonly employeeRepository = new EmployeeRepository();

  /**
   * Get Admin/HR Dashboard Data
   * Route: GET /api/dashboard/admin
   * Access: Admin/HR only
   */
  public async getAdminDashboard(req: Request, res: Response): Promise<void> {
    try {
      const data: AdminDashboardData = await this.dashboardService.getAdminDashboard();
      HttpResponse.success(res, data, "Admin dashboard data retrieved successfully");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to retrieve admin dashboard";
      HttpResponse.error(res, 500, message);
    }
  }

  /**
   * Get Staff Dashboard Data
   * Route: GET /api/dashboard/staff
   * Access: Staff members (their own data) and Admin (any staff member's data)
   */
  public async getStaffDashboard(req: Request, res: Response): Promise<void> {
    try {
      // Get employee ID from query param or use the logged-in user's employee ID
      const employeeIdParam = req.query.employee_id as string | undefined;
      let employeeId: number;

      if (employeeIdParam) {
        employeeId = parseInt(employeeIdParam, 10);
        if (isNaN(employeeId)) {
          HttpResponse.error(res, 400, "Invalid employee ID provided");
          return;
        }
      } else if (req.user?.id) {
        // Resolve employee id via linked user_id
        const employee = await this.employeeRepository.findByUserId(req.user.id);
        if (!employee) {
          HttpResponse.error(res, 404, "Employee record not found for this user");
          return;
        }
        employeeId = employee.id;
      } else {
        HttpResponse.error(res, 401, "Unauthorized: No employee ID provided");
        return;
      }

      const data: StaffDashboardData = await this.dashboardService.getStaffDashboard(employeeId);
      HttpResponse.success(res, data, "Staff dashboard data retrieved successfully");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to retrieve staff dashboard";
      HttpResponse.error(res, 500, message);
    }
  }

  /**
   * Get Summary Data (for sidebar or quick overview)
   * Route: GET /api/dashboard/summary
   * Access: All authenticated users
   */
  public async getSummary(req: Request, res: Response): Promise<void> {
    try {
      const userRole = req.user?.role;

      if (!userRole) {
        HttpResponse.error(res, 401, "Unauthorized: User role not found");
        return;
      }

      let data;

      if (userRole === "admin") {
        data = await this.dashboardService.getAdminDashboard();
      } else if (userRole === "staff") {
        const employeeId = req.user?.id;
        if (!employeeId) {
          HttpResponse.error(res, 401, "Unauthorized: Employee ID not found");
          return;
        }
        data = await this.dashboardService.getStaffDashboard(employeeId);
      } else {
        HttpResponse.error(res, 403, "Forbidden: Unknown user role");
        return;
      }

      HttpResponse.success(res, data, "Summary data retrieved successfully");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to retrieve summary data";
      HttpResponse.error(res, 500, message);
    }
  }
}
