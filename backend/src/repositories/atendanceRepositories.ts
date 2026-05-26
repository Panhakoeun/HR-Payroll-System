/**
 * Attendance Repository
 * Handles all database operations for the Attendance entity
 */

import { RowDataPacket } from "mysql2";
import { Database } from "../database/Database";
import { AttendanceRecord, CreateAttendanceRequest, UpdateAttendanceRequest } from "../models/Attendance";

export class AttendanceRepository {
  private readonly db = Database.getInstance();

  /**
   * Find attendance by ID
   */
  public async findById(id: number): Promise<AttendanceRecord | null> {
    const rows = await this.db.query<RowDataPacket[]>(
      `SELECT id, employee_id, attendance_date, check_in_time, check_out_time,
              status, remarks, created_at, updated_at
       FROM attendance WHERE id = ?`,
      [id],
    );
    return rows.length > 0 ? (rows[0] as AttendanceRecord) : null;
  }

  /**
   * Find attendance by employee and date
   */
  public async findByEmployeeAndDate(employeeId: number, date: Date): Promise<AttendanceRecord | null> {
    const rows = await this.db.query<RowDataPacket[]>(
      `SELECT id, employee_id, attendance_date, check_in_time, check_out_time,
              status, remarks, created_at, updated_at
       FROM attendance WHERE employee_id = ? AND attendance_date = ?`,
      [employeeId, date],
    );
    return rows.length > 0 ? (rows[0] as AttendanceRecord) : null;
  }

  /**
   * Get attendance records for employee in date range
   */
  public async findByEmployeeAndDateRange(
    employeeId: number,
    startDate: Date,
    endDate: Date,
    limit: number = 50,
    offset: number = 0,
  ): Promise<AttendanceRecord[]> {
    return await this.db.query<RowDataPacket[]>(
      `SELECT id, employee_id, attendance_date, check_in_time, check_out_time,
              status, remarks, created_at, updated_at
       FROM attendance
       WHERE employee_id = ? AND attendance_date BETWEEN ? AND ?
       ORDER BY attendance_date DESC
       LIMIT ? OFFSET ?`,
      [employeeId, startDate, endDate, limit, offset],
    ) as AttendanceRecord[];
  }

  /**
   * Get all attendance records with optional filters
   */
  public async findAll(
    employeeId?: number,
    status?: string,
    limit: number = 50,
    offset: number = 0,
  ): Promise<AttendanceRecord[]> {
    let query = `SELECT id, employee_id, attendance_date, check_in_time, check_out_time,
                        status, remarks, created_at, updated_at
                 FROM attendance WHERE 1=1`;
    const params: any[] = [];

    if (employeeId) {
      query += ` AND employee_id = ?`;
      params.push(employeeId);
    }

    if (status) {
      query += ` AND status = ?`;
      params.push(status);
    }

    query += ` ORDER BY attendance_date DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    return await this.db.query<RowDataPacket[]>(query, params) as AttendanceRecord[];
  }

  /**
   * Create attendance record
   */
  public async create(data: CreateAttendanceRequest): Promise<number> {
    const result = await this.db.execute(
      `INSERT INTO attendance 
       (employee_id, attendance_date, check_in_time, check_out_time, status, remarks)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        data.employee_id,
        data.attendance_date,
        data.check_in_time || null,
        data.check_out_time || null,
        data.status,
        data.remarks || null,
      ],
    );

    return result.insertId;
  }

  /**
   * Update attendance record
   */
  public async update(id: number, data: UpdateAttendanceRequest): Promise<boolean> {
    const fields: string[] = [];
    const params: any[] = [];

    if (data.check_in_time !== undefined) {
      fields.push("check_in_time = ?");
      params.push(data.check_in_time || null);
    }
    if (data.check_out_time !== undefined) {
      fields.push("check_out_time = ?");
      params.push(data.check_out_time || null);
    }
    if (data.status !== undefined) {
      fields.push("status = ?");
      params.push(data.status);
    }
    if (data.remarks !== undefined) {
      fields.push("remarks = ?");
      params.push(data.remarks || null);
    }

    if (fields.length === 0) return false;

    params.push(id);
    const result = await this.db.execute(
      `UPDATE attendance SET ${fields.join(", ")} WHERE id = ?`,
      params,
    );

    return result.affectedRows > 0;
  }

  /**
   * Delete attendance record
   */
  public async delete(id: number): Promise<boolean> {
    const result = await this.db.execute("DELETE FROM attendance WHERE id = ?", [id]);
    return result.affectedRows > 0;
  }

  /**
   * Get attendance count for employee in date range
   */
  public async countByDateRange(employeeId: number, startDate: Date, endDate: Date, status?: string): Promise<number> {
    let query = "SELECT COUNT(*) as count FROM attendance WHERE employee_id = ? AND attendance_date BETWEEN ? AND ?";
    const params: any[] = [employeeId, startDate, endDate];

    if (status) {
      query += " AND status = ?";
      params.push(status);
    }

    const rows = await this.db.query<RowDataPacket[]>(query, params);
    return (rows[0] as any).count || 0;
  }
}
