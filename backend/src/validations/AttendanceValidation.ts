/**
 * Attendance Validation
 * Input validation rules for Attendance operations
 */

import { CreateAttendanceRequest, UpdateAttendanceRequest } from "../models/Attendance";

export class AttendanceValidation {
  /**
   * Validate mark attendance request
   */
  public static validateMarkAttendance(body: Partial<CreateAttendanceRequest>): string | null {
    if (!body.employee_id) {
      return "Employee ID is required";
    }

    if (!body.attendance_date) {
      return "Attendance date is required";
    }

    if (!body.status) {
      return "Attendance status is required";
    }

    if (!this.isValidStatus(body.status)) {
      return "Invalid attendance status";
    }

    if (body.check_in_time && !this.isValidTimeFormat(body.check_in_time)) {
      return "Invalid check-in time format (use HH:mm or HH:mm:ss)";
    }

    if (body.check_out_time && !this.isValidTimeFormat(body.check_out_time)) {
      return "Invalid check-out time format (use HH:mm or HH:mm:ss)";
    }

    return null;
  }

  /**
   * Validate update attendance request
   */
  public static validateUpdateAttendance(body: Partial<UpdateAttendanceRequest>): string | null {
    if (body.status && !this.isValidStatus(body.status)) {
      return "Invalid attendance status";
    }

    if (body.check_in_time && !this.isValidTimeFormat(body.check_in_time)) {
      return "Invalid check-in time format (use HH:mm or HH:mm:ss)";
    }

    if (body.check_out_time && !this.isValidTimeFormat(body.check_out_time)) {
      return "Invalid check-out time format (use HH:mm or HH:mm:ss)";
    }

    return null;
  }

  private static isValidStatus(status: string): boolean {
    return ["present", "absent", "late", "half-day"].includes(status);
  }

  private static isValidTimeFormat(time: string): boolean {
    return /^([0-1]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/.test(time);
  }
}
