/**
 * Attendance Service
 * Business logic layer for Attendance operations
 */

import { AttendanceRepository } from "../repositories/atendanceRepositories";
import { EmployeeRepository } from "../repositories/employeeRepositories";
import {
  CreateAttendanceRequest,
  UpdateAttendanceRequest,
  AttendanceResponse,
  Attendance,
} from "../models/Attendance";

export class AttendanceService {
  constructor(
    private readonly attendanceRepository = new AttendanceRepository(),
    private readonly employeeRepository = new EmployeeRepository(),
  ) {}

  /**
   * Get attendance record by ID
   */
  public async getAttendanceById(id: number): Promise<AttendanceResponse | null> {
    const record = await this.attendanceRepository.findById(id);
    if (!record) return null;
    return new Attendance(record).toResponse();
  }

  /**
   * Get attendance for employee on specific date
   */
  public async getAttendanceByDate(
    employeeId: number,
    date: Date,
  ): Promise<AttendanceResponse | null> {
    // Verify employee exists
    const employee = await this.employeeRepository.findById(employeeId);
    if (!employee) {
      throw new Error("Employee not found");
    }

    const record = await this.attendanceRepository.findByEmployeeAndDate(employeeId, date);
    if (!record) return null;
    return new Attendance(record).toResponse();
  }

  /**
   * Get attendance records for employee in date range
   */
  public async getAttendanceByDateRange(
    employeeId: number,
    startDate: Date,
    endDate: Date,
    limit: number = 50,
    offset: number = 0,
  ): Promise<{ records: AttendanceResponse[]; total: number }> {
    // Verify employee exists
    const employee = await this.employeeRepository.findById(employeeId);
    if (!employee) {
      throw new Error("Employee not found");
    }

    const [records, total] = await Promise.all([
      this.attendanceRepository.findByEmployeeAndDateRange(
        employeeId,
        startDate,
        endDate,
        limit,
        offset,
      ),
      this.attendanceRepository.countByDateRange(employeeId, startDate, endDate),
    ]);

    return {
      records: records.map((r) => new Attendance(r).toResponse()),
      total,
    };
  }

  /**
   * Get all attendance records with filters
   */
  public async listAttendance(
    filters?: {
      employeeId?: number;
      status?: string;
      limit?: number;
      offset?: number;
    },
  ): Promise<{ records: AttendanceResponse[]; total: number }> {
    const limit = filters?.limit || 50;
    const offset = filters?.offset || 0;

    // If filtering by employee, verify exists
    if (filters?.employeeId) {
      const employee = await this.employeeRepository.findById(filters.employeeId);
      if (!employee) {
        throw new Error("Employee not found");
      }
    }

    const records = await this.attendanceRepository.findAll(
      filters?.employeeId,
      filters?.status,
      limit,
      offset,
    );

    return {
      records: records.map((r) => new Attendance(r).toResponse()),
      total: records.length, // Note: should implement total count in repository
    };
  }

  /**
   * Mark attendance for employee
   */
  public async markAttendance(data: CreateAttendanceRequest): Promise<AttendanceResponse> {
    // Verify employee exists
    const employee = await this.employeeRepository.findById(data.employee_id);
    if (!employee) {
      throw new Error("Employee not found");
    }

    // Check if attendance already exists for this date
    const existing = await this.attendanceRepository.findByEmployeeAndDate(
      data.employee_id,
      data.attendance_date,
    );
    if (existing) {
      throw new Error("Attendance already marked for this date");
    }

    // Create attendance
    const attendanceId = await this.attendanceRepository.create(data);

    // Fetch and return created record
    const record = await this.attendanceRepository.findById(attendanceId);
    if (!record) {
      throw new Error("Failed to create attendance record");
    }

    return new Attendance(record).toResponse();
  }

  /**
   * Update attendance record
   */
  public async updateAttendance(
    id: number,
    data: UpdateAttendanceRequest,
  ): Promise<AttendanceResponse> {
    // Verify record exists
    const record = await this.attendanceRepository.findById(id);
    if (!record) {
      throw new Error("Attendance record not found");
    }

    // Update record
    const updated = await this.attendanceRepository.update(id, data);
    if (!updated) {
      throw new Error("Failed to update attendance record");
    }

    // Fetch and return updated record
    const updatedRecord = await this.attendanceRepository.findById(id);
    if (!updatedRecord) {
      throw new Error("Failed to fetch updated record");
    }

    return new Attendance(updatedRecord).toResponse();
  }

  /**
   * Delete attendance record
   */
  public async deleteAttendance(id: number): Promise<void> {
    const record = await this.attendanceRepository.findById(id);
    if (!record) {
      throw new Error("Attendance record not found");
    }

    const deleted = await this.attendanceRepository.delete(id);
    if (!deleted) {
      throw new Error("Failed to delete attendance record");
    }
  }
}
