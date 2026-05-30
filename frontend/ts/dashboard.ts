/**
 * Dashboard TypeScript Module
 * Handles both Admin/HR and Staff dashboard displays
 * Requirements: US-22 (Admin Dashboard) and US-23 (Staff Dashboard)
 */

type DashboardRole = "admin" | "staff";

interface DashboardUser {
  id: number;
  name: string;
  email: string;
  role: DashboardRole;
}

interface AdminDashboardData {
  totalEmployees: number;
  presentToday: number;
  absentToday: number;
  onLeaveToday: number;
  pendingLeaveRequests: number;
  totalPayrollThisMonth: number;
}

interface StaffDashboardData {
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

class DashboardPage {
  private readonly userName = this.getElement<HTMLElement>("userName");
  private readonly userRole = this.getElement<HTMLElement>("userRole");
  private readonly logoutButton = this.getElement<HTMLButtonElement>("logoutButton");
  private readonly dashboardContent = this.getElement<HTMLElement>("dashboardContent");

  public init(): void {
    const expectedRole = document.body.dataset.role as DashboardRole;
    const user = this.getStoredUser();

    if (!user || user.role !== expectedRole) {
      window.location.href = "/login.html";
      return;
    }

    this.userName.textContent = user.name;
    this.userRole.textContent = user.role;
    this.logoutButton.addEventListener("click", () => this.logout());

    if (expectedRole === "admin") {
      void this.loadAdminDashboard();
    } else if (expectedRole === "staff") {
      void this.loadStaffDashboard();
    }
  }

  private async loadAdminDashboard(): Promise<void> {
    try {
      const token = this.getStoredToken();
      if (!token) {
        window.location.href = "/login.html";
        return;
      }

      const response = await fetch("/api/dashboard/admin", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          window.location.href = "/login.html";
          return;
        }
        throw new Error(`Failed to fetch dashboard data: ${response.statusText}`);
      }

      const data = (await response.json()) as { data: AdminDashboardData };
      this.renderAdminDashboard(data.data);
    } catch (error) {
      console.error("Error loading admin dashboard:", error);
      this.dashboardContent.innerHTML =
        `<p style="color: #dc2626; text-align: center;">Failed to load dashboard. Please refresh the page.</p>`;
    }
  }

  private renderAdminDashboard(data: AdminDashboardData): void {
    const dashboardHTML = `
      <div class="dashboard-grid">
        <div class="summary-card" onclick="window.location.href='/admin/employees.html'">
          <div class="card-header">
            <h3>Total Employees</h3>
            <span class="card-icon">👥</span>
          </div>
          <div class="card-value">${data.totalEmployees}</div>
          <p class="card-footer">Click to view employees</p>
        </div>

        <div class="summary-card" onclick="window.location.href='/admin/attendance.html'">
          <div class="card-header">
            <h3>Present Today</h3>
            <span class="card-icon">✓</span>
          </div>
          <div class="card-value" style="color: #16a34a;">${data.presentToday}</div>
          <p class="card-footer">Click to view attendance</p>
        </div>

        <div class="summary-card" onclick="window.location.href='/admin/attendance.html'">
          <div class="card-header">
            <h3>Absent Today</h3>
            <span class="card-icon">✕</span>
          </div>
          <div class="card-value" style="color: #dc2626;">${data.absentToday}</div>
          <p class="card-footer">Click to view attendance</p>
        </div>

        <div class="summary-card" onclick="window.location.href='/admin/leaves.html'">
          <div class="card-header">
            <h3>On Leave</h3>
            <span class="card-icon">📋</span>
          </div>
          <div class="card-value" style="color: #ea580c;">${data.onLeaveToday}</div>
          <p class="card-footer">Click to view leaves</p>
        </div>

        <div class="summary-card" onclick="window.location.href='/admin/leaves.html'">
          <div class="card-header">
            <h3>Pending Leave Requests</h3>
            <span class="card-icon">⏳</span>
          </div>
          <div class="card-value" style="color: #f59e0b;">${data.pendingLeaveRequests}</div>
          <p class="card-footer">Click to approve/reject</p>
        </div>

        <div class="summary-card" onclick="window.location.href='/admin/payroll.html'">
          <div class="card-header">
            <h3>Total Payroll (This Month)</h3>
            <span class="card-icon">💰</span>
          </div>
          <div class="card-value" style="color: #2563eb;">$${data.totalPayrollThisMonth.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}</div>
          <p class="card-footer">Click to view payroll</p>
        </div>
      </div>
    `;

    this.dashboardContent.innerHTML = dashboardHTML;
  }

  private async loadStaffDashboard(): Promise<void> {
    try {
      const token = this.getStoredToken();
      if (!token) {
        window.location.href = "/login.html";
        return;
      }

      const response = await fetch("/api/dashboard/staff", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          window.location.href = "/login.html";
          return;
        }
        throw new Error(`Failed to fetch dashboard data: ${response.statusText}`);
      }

      const data = (await response.json()) as { data: StaffDashboardData };
      this.renderStaffDashboard(data.data);
    } catch (error) {
      console.error("Error loading staff dashboard:", error);
      this.dashboardContent.innerHTML =
        `<p style="color: #dc2626; text-align: center;">Failed to load dashboard. Please refresh the page.</p>`;
    }
  }

  private renderStaffDashboard(data: StaffDashboardData): void {
    const payslipInfo = data.latestPayslip
      ? `<span class="payslip-badge ${data.latestPayslip.status}">${data.latestPayslip.status}</span>
         <p class="payslip-period">${data.latestPayslip.payPeriodStart} to ${data.latestPayslip.payPeriodEnd}</p>
         <p class="payslip-amount">Amount: $${data.latestPayslip.netSalary.toLocaleString(undefined, {
           minimumFractionDigits: 2,
           maximumFractionDigits: 2,
         })}</p>`
      : `<p style="color: #64748b;">No payslips available yet</p>`;

    const dashboardHTML = `
      <div class="dashboard-grid">
        <div class="summary-card" onclick="window.location.href='/staff/attendance.html'">
          <div class="card-header">
            <h3>Attendance (This Month)</h3>
            <span class="card-icon">🗓</span>
          </div>
          <div class="attendance-summary">
            <div class="attendance-item">
              <div class="attendance-value" style="color: #16a34a;">${data.attendanceSummary.daysPresent}</div>
              <div class="attendance-label">Present</div>
            </div>
            <div class="attendance-item">
              <div class="attendance-value" style="color: #dc2626;">${data.attendanceSummary.daysAbsent}</div>
              <div class="attendance-label">Absent</div>
            </div>
            <div class="attendance-item">
              <div class="attendance-value" style="color: #f59e0b;">${data.attendanceSummary.daysLate}</div>
              <div class="attendance-label">Late</div>
            </div>
          </div>
          <p class="card-footer">Click to view details</p>
        </div>

        <div class="summary-card" onclick="window.location.href='/staff/leaves.html'">
          <div class="card-header">
            <h3>Leave Balance (This Year)</h3>
            <span class="card-icon">🌴</span>
          </div>
          <div class="card-value">${data.remainingLeaveDays} days</div>
          <p class="card-footer">Click to request leave</p>
        </div>

        <div class="summary-card" onclick="window.location.href='/staff/payslip.html'">
          <div class="card-header">
            <h3>Latest Payslip</h3>
            <span class="card-icon">📄</span>
          </div>
          ${payslipInfo}
          <p class="card-footer">Click to view all payslips</p>
        </div>

        <div class="summary-card" onclick="window.location.href='/staff/leaves.html'">
          <div class="card-header">
            <h3>Pending Leave Requests</h3>
            <span class="card-icon">⏳</span>
          </div>
          <div class="card-value" style="color: #f59e0b;">${data.pendingLeaveRequests}</div>
          <p class="card-footer">Waiting for approval</p>
        </div>
      </div>
    `;

    this.dashboardContent.innerHTML = dashboardHTML;
  }

  private getStoredUser(): DashboardUser | null {
    const userStr = localStorage.getItem("user") || sessionStorage.getItem("user");
    if (!userStr) return null;
    try {
      return JSON.parse(userStr) as DashboardUser;
    } catch {
      return null;
    }
  }

  private getStoredToken(): string | null {
    return localStorage.getItem("token") || sessionStorage.getItem("token");
  }

  private logout(): void {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");
    window.location.href = "/login.html";
  }

  private getElement<T extends HTMLElement>(id: string): T {
    const element = document.getElementById(id);
    if (!element) {
      throw new Error(`Element with id '${id}' not found`);
    }
    return element as T;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const dashboard = new DashboardPage();
  dashboard.init();
});

