import { RowDataPacket } from "mysql2";
import { BaseRepository } from "./BaseRepository";
import {
  CreateLeaveRequest,
  LeaveRequestRecord,
  LeaveStatus,
  LeaveType,
} from "../models/LeaveRequest";

interface LeaveRequestRow extends RowDataPacket {
  id: number;
  user_id: number;
  employee_name: string;
  employee_email: string;
  leave_type: LeaveType;
  start_date: Date | string;
  end_date: Date | string;
  total_days: number | string;
  reason: string;
  status: LeaveStatus;
  reviewer_id: number | null;
  reviewer_name: string | null;
  reviewer_note: string | null;
  created_at: Date | string;
  updated_at: Date | string;
}

export class LeaveRequestRepository extends BaseRepository {
  public async create(userId: number, data: CreateLeaveRequest, totalDays: number): Promise<LeaveRequestRecord> {
    await this.ensureSchema();
    const result = await this.db.execute(
      `INSERT INTO leave_requests (user_id, leave_type, start_date, end_date, total_days, reason)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, data.leaveType, data.startDate, data.endDate, totalDays, data.reason],
    );

    const request = await this.findById(result.insertId);
    if (!request) {
      throw new Error("Leave request was not created");
    }
    return request;
  }

  public async findById(id: number): Promise<LeaveRequestRecord | null> {
    await this.ensureSchema();
    const rows = await this.db.query<LeaveRequestRow[]>(
      `${this.baseSelect()} WHERE lr.id = ? LIMIT 1`,
      [id],
    );
    return rows.length > 0 ? this.toRecord(rows[0]) : null;
  }

  public async findForUser(userId: number): Promise<LeaveRequestRecord[]> {
    await this.ensureSchema();
    const rows = await this.db.query<LeaveRequestRow[]>(
      `${this.baseSelect()} WHERE lr.user_id = ? ORDER BY lr.created_at DESC, lr.id DESC`,
      [userId],
    );
    return rows.map((row) => this.toRecord(row));
  }

  public async findAll(status?: LeaveStatus): Promise<LeaveRequestRecord[]> {
    await this.ensureSchema();
    const filter = status ? "WHERE lr.status = ?" : "";
    const params = status ? [status] : [];
    const rows = await this.db.query<LeaveRequestRow[]>(
      `${this.baseSelect()} ${filter} ORDER BY lr.created_at DESC, lr.id DESC`,
      params,
    );
    return rows.map((row) => this.toRecord(row));
  }

  public async cancelPending(id: number, userId: number): Promise<boolean> {
    await this.ensureSchema();
    const result = await this.db.execute(
      `UPDATE leave_requests
       SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND user_id = ? AND status = 'pending'`,
      [id, userId],
    );
    return result.affectedRows === 1;
  }

  public async reviewPending(
    id: number,
    reviewerId: number,
    status: Extract<LeaveStatus, "approved" | "rejected">,
    reviewerNote: string | null,
  ): Promise<boolean> {
    await this.ensureSchema();
    const result = await this.db.execute(
      `UPDATE leave_requests
       SET status = ?, reviewer_id = ?, reviewer_note = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND status = 'pending'`,
      [status, reviewerId, reviewerNote, id],
    );
    return result.affectedRows === 1;
  }

  protected async createSchema(): Promise<void> {
    await this.db.execute(
      `CREATE TABLE IF NOT EXISTS leave_requests (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        leave_type ENUM('annual','sick','personal','unpaid','maternity','paternity') NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        total_days INT NOT NULL,
        reason VARCHAR(500) NOT NULL,
        status ENUM('pending','approved','rejected','cancelled') NOT NULL DEFAULT 'pending',
        reviewer_id INT NULL,
        reviewer_note VARCHAR(500) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_leave_user_created (user_id, created_at),
        INDEX idx_leave_status_created (status, created_at),
        CONSTRAINT fk_leave_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        CONSTRAINT fk_leave_reviewer FOREIGN KEY (reviewer_id) REFERENCES users(id) ON DELETE SET NULL,
        CONSTRAINT chk_leave_date_range CHECK (end_date >= start_date),
        CONSTRAINT chk_leave_total_days CHECK (total_days > 0)
      )`,
    );
  }

  private baseSelect(): string {
    return `SELECT lr.id, lr.user_id, u.name AS employee_name, u.email AS employee_email,
                   lr.leave_type, lr.start_date, lr.end_date, lr.total_days, lr.reason,
                   lr.status, lr.reviewer_id, reviewer.name AS reviewer_name,
                   lr.reviewer_note, lr.created_at, lr.updated_at
            FROM leave_requests lr
            INNER JOIN users u ON u.id = lr.user_id
            LEFT JOIN users reviewer ON reviewer.id = lr.reviewer_id`;
  }

  private toRecord(row: LeaveRequestRow): LeaveRequestRecord {
    return {
      id: row.id,
      userId: row.user_id,
      employeeName: row.employee_name,
      employeeEmail: row.employee_email,
      leaveType: row.leave_type,
      startDate: this.formatDate(row.start_date),
      endDate: this.formatDate(row.end_date),
      totalDays: Number(row.total_days),
      reason: row.reason,
      status: row.status,
      reviewerId: row.reviewer_id,
      reviewerName: row.reviewer_name,
      reviewerNote: row.reviewer_note,
      createdAt: this.formatDateTime(row.created_at),
      updatedAt: this.formatDateTime(row.updated_at),
    };
  }

}
