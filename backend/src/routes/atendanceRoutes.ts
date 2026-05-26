/**
 * Attendance Routes
 * Defines all API endpoints for Attendance entity
 */

import { Router } from "express";
import { AttendanceController } from "../controllers/atendanceController";
import { AuthMiddleware } from "../middlewares/AuthMiddleware";

export class AttendanceRoutes {
  public readonly router = Router();
  private readonly attendanceController = new AttendanceController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    // Get all attendance records (admin only)
    // GET /api/attendance?limit=50&offset=0&employee_id=1&status=present
    this.router.get(
      "/",
      AuthMiddleware.verifyToken,
      AuthMiddleware.requireRole("admin"),
      this.attendanceController.listAttendance.bind(this.attendanceController),
    );

    // Get attendance by ID
    // GET /api/attendance/:id
    this.router.get("/:id", AuthMiddleware.verifyToken, this.attendanceController.getAttendance.bind(this.attendanceController));

    // Get attendance for employee in date range
    // GET /api/attendance/employee/:employeeId/date-range?start_date=2024-01-01&end_date=2024-01-31
    this.router.get(
      "/employee/:employeeId/date-range",
      AuthMiddleware.verifyToken,
      this.attendanceController.getByDateRange.bind(this.attendanceController),
    );

    // Mark attendance for employee (admin only)
    // POST /api/attendance
    this.router.post(
      "/",
      AuthMiddleware.verifyToken,
      AuthMiddleware.requireRole("admin"),
      this.attendanceController.markAttendance.bind(this.attendanceController),
    );

    // Update attendance (admin only)
    // PUT /api/attendance/:id
    this.router.put(
      "/:id",
      AuthMiddleware.verifyToken,
      AuthMiddleware.requireRole("admin"),
      this.attendanceController.updateAttendance.bind(this.attendanceController),
    );

    // Delete attendance (admin only)
    // DELETE /api/attendance/:id
    this.router.delete(
      "/:id",
      AuthMiddleware.verifyToken,
      AuthMiddleware.requireRole("admin"),
      this.attendanceController.deleteAttendance.bind(this.attendanceController),
    );
  }
}
