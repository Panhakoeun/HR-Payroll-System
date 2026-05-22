import { RowDataPacket } from "mysql2";
import { BaseRepository } from "./BaseRepository";
import {
  AttendanceEmployee,
  AttendanceRecord,
  AttendanceStatus,
  AttendanceSummaryRow,
} from "../models/Attendance";

interface AttendanceRecordRow extends RowDataPacket {
  id: number;
  user_id: number;
  employee_name: string;
  employee_email: string;
  department: string | null;
  attendance_date: Date | string;
  status: AttendanceStatus;
  note: string | null;
  updated_by: number | null;
  updated_at: Date | string;
}

interface AttendanceSummaryRowPacket extends RowDataPacket {
  user_id: number;
  employee_name: string;
  employee_email: string;
  department: string | null;
  present: number | string;
  absent: number | string;
  late: number | string;
  on_leave: number | string;
  total_marked: number | string;
}

interface EmployeeRow extends RowDataPacket {
  id: number;
  name: string;
  email: string;
  role: "admin" | "staff";
  department: string | null;
}

export class AttendanceRepository extends BaseRepository {
  public async findEmployees(): Promise<AttendanceEmployee[]> {
    await this.ensureSchema();
    const rows = await this.db.query<EmployeeRow[]>(
      "SELECT id, name, email, role, COALESCE(department, 'General') AS department FROM users ORDER BY name ASC",
    );
    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      role: row.role,
      department: row.department || "General",
    }));
  }

  public async findRecordsByDate(date: string): Promise<AttendanceRecord[]> {
    await this.ensureSchema();
    const rows = await this.db.query<AttendanceRecordRow[]>(
      `SELECT ar.id, ar.user_id, u.name AS employee_name, u.email AS employee_email,
              COALESCE(u.department, 'General') AS department, ar.attendance_date,
              ar.status, ar.note, ar.updated_by, ar.updated_at
       FROM attendance_records ar
       INNER JOIN users u ON u.id = ar.user_id
       WHERE ar.attendance_date = ?
       ORDER BY u.name ASC`,
      [date],
    );
    return rows.map((row) => this.toAttendanceRecord(row));
  }

  public async findRecordsForUser(
    userId: number,
    month: number,
    year: number,
  ): Promise<AttendanceRecord[]> {
    await this.ensureSchema();
    const rows = await this.db.query<AttendanceRecordRow[]>(
      `SELECT ar.id, ar.user_id, u.name AS employee_name, u.email AS employee_email,
              COALESCE(u.department, 'General') AS department, ar.attendance_date,
              ar.status, ar.note, ar.updated_by, ar.updated_at
       FROM attendance_records ar
       INNER JOIN users u ON u.id = ar.user_id
       WHERE ar.user_id = ? AND MONTH(ar.attendance_date) = ? AND YEAR(ar.attendance_date) = ?
       ORDER BY ar.attendance_date DESC`,
      [userId, month, year],
    );
    return rows.map((row) => this.toAttendanceRecord(row));
  }

  public async upsertRecord(
    userId: number,
    attendanceDate: string,
    status: AttendanceStatus,
    note: string | null,
    updatedBy: number,
  ): Promise<void> {
    await this.ensureSchema();
    await this.db.execute(
      `INSERT INTO attendance_records (user_id, attendance_date, status, note, updated_by)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         status = VALUES(status),
         note = VALUES(note),
         updated_by = VALUES(updated_by),
         updated_at = CURRENT_TIMESTAMP`,
      [userId, attendanceDate, status, note, updatedBy],
    );
  }

  public async getMonthlySummary(
    month: number,
    year: number,
    department?: string,
  ): Promise<AttendanceSummaryRow[]> {
    await this.ensureSchema();
    const params: unknown[] = [month, year];
    const departmentFilter = department ? "WHERE COALESCE(u.department, 'General') = ?" : "";
    if (department) {
      params.push(department);
    }

    const rows = await this.db.query<AttendanceSummaryRowPacket[]>(
      `SELECT u.id AS user_id, u.name AS employee_name, u.email AS employee_email,
              COALESCE(u.department, 'General') AS department,
              SUM(CASE WHEN ar.status = 'present' THEN 1 ELSE 0 END) AS present,
              SUM(CASE WHEN ar.status = 'absent' THEN 1 ELSE 0 END) AS absent,
              SUM(CASE WHEN ar.status = 'late' THEN 1 ELSE 0 END) AS late,
              SUM(CASE WHEN ar.status = 'on_leave' THEN 1 ELSE 0 END) AS on_leave,
              COUNT(ar.id) AS total_marked
       FROM users u
       LEFT JOIN attendance_records ar
         ON ar.user_id = u.id
        AND MONTH(ar.attendance_date) = ?
        AND YEAR(ar.attendance_date) = ?
       ${departmentFilter}
       GROUP BY u.id, u.name, u.email, u.department
       ORDER BY u.name ASC`,
      params,
    );

    return rows.map((row) => {
      const present = Number(row.present || 0);
      const late = Number(row.late || 0);
      const totalMarked = Number(row.total_marked || 0);
      return {
        userId: row.user_id,
        employeeName: row.employee_name,
        employeeEmail: row.employee_email,
        department: row.department || "General",
        present,
        absent: Number(row.absent || 0),
        late,
        onLeave: Number(row.on_leave || 0),
        totalMarked,
        attendanceRate: totalMarked > 0 ? Math.round(((present + late) / totalMarked) * 100) : 0,
      };
    });
  }

  protected async createSchema(): Promise<void> {
    try {
      await this.db.execute("ALTER TABLE users ADD COLUMN department VARCHAR(100) NOT NULL DEFAULT 'General'");
    } catch (err) {
      const error = err as { code?: string };
      if (error.code !== "ER_DUP_FIELDNAME") {
        throw err;
      }
    }

    await this.db.execute(
      `CREATE TABLE IF NOT EXISTS attendance_records (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        attendance_date DATE NOT NULL,
        status ENUM('present','absent','late','on_leave') NOT NULL,
        note VARCHAR(255) NULL,
        updated_by INT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_user_attendance_date (user_id, attendance_date),
        INDEX idx_attendance_date (attendance_date),
        CONSTRAINT fk_attendance_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        CONSTRAINT fk_attendance_updated_by FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
      )`,
    );
  }

  private toAttendanceRecord(row: AttendanceRecordRow): AttendanceRecord {
    return {
      id: row.id,
      userId: row.user_id,
      employeeName: row.employee_name,
      employeeEmail: row.employee_email,
      department: row.department || "General",
      attendanceDate: this.formatDate(row.attendance_date),
      status: row.status,
      note: row.note,
      updatedBy: row.updated_by,
      updatedAt: this.formatDateTime(row.updated_at),
    };
  }

}
