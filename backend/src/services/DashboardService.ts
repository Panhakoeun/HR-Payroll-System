/**
 * Dashboard Service
 * Business logic layer for Dashboard operations
 * Handles data aggregation for Admin/HR and Staff dashboards
 */

import { Database } from "../database/Database";
import { RowDataPacket } from "mysql2";

export interface AdminDashboardData {
  totalEmployees: number;
  presentToday: number;
  absentToday: number;
  onLeaveToday: number;
  pendingLeaveRequests: number;
  totalPayrollThisMonth: number;
}

export interface StaffDashboardData {
  attendanceSummary: {
    daysPresent: number;
    daysAbsent: number;
    daysLate: number;
  };
  remainingLeaveDays: number;
  latestPayslip: {
    id: number;
    payPeriodStart: string;
    payPeriodEnd: string;
    status: string;
    netSalary: number;
  } | null;
  pendingLeaveRequests: number;
}

export class DashboardService {
  private readonly db = Database.getInstance();

  /**
   * Get Admin/HR Dashboard Data
   * Returns aggregated data for the admin dashboard
   */
  public async getAdminDashboard(): Promise<AdminDashboardData> {
    const today = new Date().toISOString().split("T")[0];

    // Get total employees
    const totalEmployeesResult = await this.db.query<RowDataPacket[]>(
      `SELECT COUNT(*) as count FROM employees WHERE status = 'active'`,
    );
    const totalEmployees = totalEmployeesResult[0]?.count || 0;

    // Get attendance for today
    const attendanceTodayResult = await this.db.query<RowDataPacket[]>(
      `SELECT status, COUNT(*) as count 
       FROM attendance 
       WHERE DATE(attendance_date) = ?
       GROUP BY status`,
      [today],
    );

    let presentToday = 0;
    let absentToday = 0;
    let onLeaveToday = 0;

    attendanceTodayResult.forEach((row) => {
      if (row.status === "present") presentToday = row.count;
      else if (row.status === "absent") absentToday = row.count;
    });

    // Get pending leave requests
    const pendingLeaveResult = await this.db.query<RowDataPacket[]>(
      `SELECT COUNT(*) as count FROM leave_requests WHERE status = 'pending'`,
    );
    const pendingLeaveRequests = pendingLeaveResult[0]?.count || 0;

    // Get total payroll for current month
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    const payrollResult = await this.db.query<RowDataPacket[]>(
      `SELECT SUM(net_salary) as total FROM payroll 
       WHERE YEAR(pay_period_start) = ? AND MONTH(pay_period_start) = ?`,
      [currentYear, currentMonth],
    );
    const totalPayrollThisMonth = payrollResult[0]?.total || 0;

    return {
      totalEmployees,
      presentToday,
      absentToday,
      onLeaveToday,
      pendingLeaveRequests,
      totalPayrollThisMonth,
    };
  }

  /**
   * Get Staff Dashboard Data
   * Returns personalized data for the staff member dashboard
   */
  public async getStaffDashboard(employeeId: number): Promise<StaffDashboardData> {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    const monthStart = `${currentYear}-${String(currentMonth).padStart(2, "0")}-01`;
    const monthEnd = new Date(currentYear, currentMonth, 0)
      .toISOString()
      .split("T")[0];

    // Get attendance summary for current month
    const attendanceSummaryResult = await this.db.query<RowDataPacket[]>(
      `SELECT status, COUNT(*) as count 
       FROM attendance 
       WHERE employee_id = ? AND DATE(attendance_date) BETWEEN ? AND ?
       GROUP BY status`,
      [employeeId, monthStart, monthEnd],
    );

    let daysPresent = 0;
    let daysAbsent = 0;
    let daysLate = 0;

    attendanceSummaryResult.forEach((row) => {
      if (row.status === "present") daysPresent = row.count;
      else if (row.status === "absent") daysAbsent = row.count;
      else if (row.status === "late") daysLate = row.count;
    });

    // Get remaining leave days
    // Assuming 20 total leave days per year
    const totalLeaveDays = 20;
    const usedLeaveDaysResult = await this.db.query<RowDataPacket[]>(
      `SELECT SUM(DATEDIFF(end_date, start_date) + 1) as total_used 
       FROM leave_requests 
       WHERE employee_id = ? AND YEAR(start_date) = ? AND status = 'approved'`,
      [employeeId, currentYear],
    );
    const usedLeaveDays = usedLeaveDaysResult[0]?.total_used || 0;
    const remainingLeaveDays = Math.max(0, totalLeaveDays - usedLeaveDays);

    // Get latest payslip
    const latestPayslipResult = await this.db.query<RowDataPacket[]>(
      `SELECT id, pay_period_start, pay_period_end, status, net_salary 
       FROM payslips 
       WHERE employee_id = ? 
       ORDER BY pay_period_end DESC 
       LIMIT 1`,
      [employeeId],
    );

    const latestPayslip =
      latestPayslipResult.length > 0
        ? {
            id: latestPayslipResult[0].id,
            payPeriodStart: new Date(
              latestPayslipResult[0].pay_period_start,
            ).toLocaleDateString(),
            payPeriodEnd: new Date(
              latestPayslipResult[0].pay_period_end,
            ).toLocaleDateString(),
            status: latestPayslipResult[0].status,
            netSalary: latestPayslipResult[0].net_salary,
          }
        : null;

    // Get pending leave requests for this employee
    const pendingLeaveResult = await this.db.query<RowDataPacket[]>(
      `SELECT COUNT(*) as count FROM leave_requests 
       WHERE employee_id = ? AND status = 'pending'`,
      [employeeId],
    );
    const pendingLeaveRequests = pendingLeaveResult[0]?.count || 0;

    return {
      attendanceSummary: {
        daysPresent,
        daysAbsent,
        daysLate,
      },
      remainingLeaveDays,
      latestPayslip,
      pendingLeaveRequests,
    };
  }
}
