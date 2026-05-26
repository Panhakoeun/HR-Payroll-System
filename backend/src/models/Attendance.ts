/**
 * Attendance Module - Models and Interfaces
 * Defines all types and interfaces for the Attendance entity
 */

export type AttendanceStatus = "present" | "absent" | "late" | "half-day";

// ========== Database Record Interface ==========
export interface AttendanceRecord {
  id: number;
  employee_id: number;
  attendance_date: Date;
  check_in_time: string | null; // TIME format (HH:mm:ss)
  check_out_time: string | null; // TIME format (HH:mm:ss)
  status: AttendanceStatus;
  remarks: string | null;
  created_at: Date;
  updated_at: Date;
}

// ========== Request DTOs ==========
export interface CreateAttendanceRequest {
  employee_id: number;
  attendance_date: Date;
  check_in_time?: string;
  check_out_time?: string;
  status: AttendanceStatus;
  remarks?: string;
}

export interface UpdateAttendanceRequest {
  check_in_time?: string;
  check_out_time?: string;
  status?: AttendanceStatus;
  remarks?: string;
}

export interface AttendanceFilterRequest {
  employee_id?: number;
  start_date?: Date;
  end_date?: Date;
  status?: AttendanceStatus;
  limit?: number;
  offset?: number;
}

// ========== Response DTOs ==========
export interface AttendanceResponse {
  id: number;
  employee_id: number;
  attendance_date: Date;
  check_in_time: string | null;
  check_out_time: string | null;
  status: AttendanceStatus;
  remarks: string | null;
}

// ========== Class Definition ==========
export class Attendance {
  constructor(private readonly record: AttendanceRecord) {}

  public toResponse(): AttendanceResponse {
    return {
      id: this.record.id,
      employee_id: this.record.employee_id,
      attendance_date: this.record.attendance_date,
      check_in_time: this.record.check_in_time,
      check_out_time: this.record.check_out_time,
      status: this.record.status,
      remarks: this.record.remarks,
    };
  }

  /**
   * Check if attendance is marked as present
   */
  public isPresent(): boolean {
    return this.record.status === "present";
  }

  /**
   * Calculate hours worked (requires check_in and check_out times)
   */
  public getHoursWorked(): number | null {
    if (!this.record.check_in_time || !this.record.check_out_time) {
      return null;
    }

    const [inH, inM] = this.record.check_in_time.split(":").map(Number);
    const [outH, outM] = this.record.check_out_time.split(":").map(Number);

    const inMinutes = inH * 60 + inM;
    const outMinutes = outH * 60 + outM;

    return (outMinutes - inMinutes) / 60;
  }
}
