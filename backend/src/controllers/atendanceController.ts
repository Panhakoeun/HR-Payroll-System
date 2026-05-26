/**
 * Attendance Controller
 * Handles HTTP requests for Attendance entity
 */

import { Request, Response } from "express";
import { AttendanceService } from "../services/atendanceService";
import { CreateAttendanceRequest, UpdateAttendanceRequest } from "../models/Attendance";
import { HttpResponse } from "../utils/HttpResponse";

export class AttendanceController {
  constructor(private readonly attendanceService = new AttendanceService()) {}

  /**
   * GET /api/attendance/:id
   * Get attendance record by ID
   */
  public async getAttendance(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);

      if (!id || isNaN(id)) {
        HttpResponse.error(res, 400, "Invalid attendance ID");
        return;
      }

      const record = await this.attendanceService.getAttendanceById(id);

      if (!record) {
        HttpResponse.error(res, 404, "Attendance record not found");
        return;
      }

      res.json({ attendance: record });
    } catch (err) {
      console.error("Get attendance error:", err);
      HttpResponse.error(res, 500, "Server error");
    }
  }

  /**
   * GET /api/attendance
   * List all attendance records with filters
   */
  public async listAttendance(req: Request, res: Response): Promise<void> {
    try {
      const limit = Number(req.query.limit) || 50;
      const offset = Number(req.query.offset) || 0;
      const employeeId = req.query.employee_id ? Number(req.query.employee_id) : undefined;
      const status = req.query.status as string | undefined;

      const result = await this.attendanceService.listAttendance({
        employeeId,
        status,
        limit,
        offset,
      });

      res.json({
        attendance: result.records,
        pagination: {
          total: result.total,
          limit,
          offset,
        },
      });
    } catch (err) {
      if (err instanceof Error && err.message === "Employee not found") {
        HttpResponse.error(res, 404, "Employee not found");
        return;
      }
      console.error("List attendance error:", err);
      HttpResponse.error(res, 500, "Server error");
    }
  }

  /**
   * GET /api/attendance/employee/:employeeId/date-range
   * Get attendance for employee in date range
   */
  public async getByDateRange(req: Request, res: Response): Promise<void> {
    try {
      const employeeId = Number(req.params.employeeId);
      const startDate = new Date(req.query.start_date as string);
      const endDate = new Date(req.query.end_date as string);
      const limit = Number(req.query.limit) || 50;
      const offset = Number(req.query.offset) || 0;

      if (!employeeId || isNaN(employeeId)) {
        HttpResponse.error(res, 400, "Invalid employee ID");
        return;
      }

      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        HttpResponse.error(res, 400, "Invalid date format");
        return;
      }

      const result = await this.attendanceService.getAttendanceByDateRange(
        employeeId,
        startDate,
        endDate,
        limit,
        offset,
      );

      res.json({
        attendance: result.records,
        pagination: {
          total: result.total,
          limit,
          offset,
        },
      });
    } catch (err) {
      if (err instanceof Error && err.message === "Employee not found") {
        HttpResponse.error(res, 404, "Employee not found");
        return;
      }
      console.error("Get by date range error:", err);
      HttpResponse.error(res, 500, "Server error");
    }
  }

  /**
   * POST /api/attendance
   * Mark attendance for employee
   */
  public async markAttendance(req: Request, res: Response): Promise<void> {
    try {
      const data = req.body as CreateAttendanceRequest;

      // Validate required fields
      if (!data.employee_id || !data.attendance_date || !data.status) {
        HttpResponse.error(res, 400, "Missing required fields");
        return;
      }

      // Validate time format if provided
      if (data.check_in_time && !this.isValidTimeFormat(data.check_in_time)) {
        HttpResponse.error(res, 400, "Invalid check-in time format");
        return;
      }

      if (data.check_out_time && !this.isValidTimeFormat(data.check_out_time)) {
        HttpResponse.error(res, 400, "Invalid check-out time format");
        return;
      }

      const attendance = await this.attendanceService.markAttendance(data);
      res.status(201).json({ attendance });
    } catch (err) {
      if (err instanceof Error && err.message === "Employee not found") {
        HttpResponse.error(res, 404, "Employee not found");
        return;
      }
      if (err instanceof Error && err.message.includes("already marked")) {
        HttpResponse.error(res, 409, err.message);
        return;
      }
      console.error("Mark attendance error:", err);
      HttpResponse.error(res, 500, "Server error");
    }
  }

  /**
   * PUT /api/attendance/:id
   * Update attendance record
   */
  public async updateAttendance(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);

      if (!id || isNaN(id)) {
        HttpResponse.error(res, 400, "Invalid attendance ID");
        return;
      }

      const data = req.body as UpdateAttendanceRequest;

      // Validate time format if provided
      if (data.check_in_time && !this.isValidTimeFormat(data.check_in_time)) {
        HttpResponse.error(res, 400, "Invalid check-in time format");
        return;
      }

      if (data.check_out_time && !this.isValidTimeFormat(data.check_out_time)) {
        HttpResponse.error(res, 400, "Invalid check-out time format");
        return;
      }

      const attendance = await this.attendanceService.updateAttendance(id, data);
      res.json({ attendance });
    } catch (err) {
      if (err instanceof Error && err.message === "Attendance record not found") {
        HttpResponse.error(res, 404, "Attendance record not found");
        return;
      }
      console.error("Update attendance error:", err);
      HttpResponse.error(res, 500, "Server error");
    }
  }

  /**
   * DELETE /api/attendance/:id
   * Delete attendance record
   */
  public async deleteAttendance(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);

      if (!id || isNaN(id)) {
        HttpResponse.error(res, 400, "Invalid attendance ID");
        return;
      }

      await this.attendanceService.deleteAttendance(id);
      res.json({ message: "Attendance record deleted successfully" });
    } catch (err) {
      if (err instanceof Error && err.message === "Attendance record not found") {
        HttpResponse.error(res, 404, "Attendance record not found");
        return;
      }
      console.error("Delete attendance error:", err);
      HttpResponse.error(res, 500, "Server error");
    }
  }

  /**
   * Validate time format (HH:mm or HH:mm:ss)
   */
  private isValidTimeFormat(time: string): boolean {
    return /^([0-1]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/.test(time);
  }
}
