type DashboardRole = "admin" | "staff";
type AttendanceStatus = "present" | "absent" | "late" | "on_leave";

interface DashboardUser {
  id: number;
  name: string;
  role: DashboardRole;
}

interface AttendanceEmployee {
  id: number;
  name: string;
  email: string;
  role: DashboardRole;
  department: string;
}

interface AttendanceRecord {
  id: number;
  userId: number;
  employeeName: string;
  employeeEmail: string;
  department: string;
  attendanceDate: string;
  status: AttendanceStatus;
  note: string | null;
  updatedAt: string;
}

interface AttendanceSummaryRow {
  userId: number;
  employeeName: string;
  employeeEmail: string;
  department: string;
  present: number;
  absent: number;
  late: number;
  onLeave: number;
  totalMarked: number;
  attendanceRate: number;
}

interface AttendanceDashboard {
  date: string;
  month: number;
  year: number;
  employees: AttendanceEmployee[];
  dayRecords: AttendanceRecord[];
  summary: AttendanceSummaryRow[];
  departments: string[];
  totals: {
    present: number;
    absent: number;
    late: number;
    onLeave: number;
    attendanceRate: number;
  };
}

interface StaffHistory {
  month: number;
  year: number;
  records: AttendanceRecord[];
  totals: {
    present: number;
    absent: number;
    late: number;
    onLeave: number;
    attendanceRate: number;
  };
}

class DashboardPage {
  private readonly role = document.body.dataset.role as DashboardRole;
  private readonly page = document.body.dataset.page || "attendance";
  private readonly token = this.getStoredToken();
  private readonly user = this.getStoredUser();

  public init(): void {
    if (!this.user || !this.token || this.user.role !== this.role) {
      window.location.href = "/login.html";
      return;
    }

    this.setText("userName", this.user.name);
    this.setText("userRole", this.user.role);
    this.setText("userInitial", this.initials(this.user.name));
    this.getOptional<HTMLButtonElement>("logoutButton")?.addEventListener("click", () => this.logout());

    if (this.page === "home") {
      return;
    }

    if (this.role === "admin") {
      void this.initializeAdminAttendance();
    } else {
      void this.initializeStaffAttendance();
    }
  }

  private async initializeAdminAttendance(): Promise<void> {
    const dateInput = this.getElement<HTMLInputElement>("attendanceDate");
    const monthInput = this.getElement<HTMLInputElement>("summaryMonth");
    const departmentFilter = this.getElement<HTMLSelectElement>("departmentFilter");
    const saveButton = this.getElement<HTMLButtonElement>("saveAttendance");
    const exportButton = this.getElement<HTMLButtonElement>("exportAttendance");

    const today = new Date();
    dateInput.value = this.toDateInput(today);
    monthInput.value = this.toMonthInput(today);

    dateInput.addEventListener("change", () => void this.loadAdminAttendance());
    monthInput.addEventListener("change", () => void this.loadAdminAttendance());
    departmentFilter.addEventListener("change", () => void this.loadAdminAttendance());
    saveButton.addEventListener("click", () => void this.saveAttendance());
    exportButton.addEventListener("click", () => this.exportSummary());

    await this.loadAdminAttendance();
  }

  private async loadAdminAttendance(): Promise<void> {
    const dateInput = this.getElement<HTMLInputElement>("attendanceDate");
    const monthInput = this.getElement<HTMLInputElement>("summaryMonth");
    const departmentFilter = this.getElement<HTMLSelectElement>("departmentFilter");
    const [year, month] = monthInput.value.split("-").map(Number);
    const params = new URLSearchParams({
      date: dateInput.value,
      month: String(month),
      year: String(year),
    });
    if (departmentFilter.value) {
      params.set("department", departmentFilter.value);
    }

    try {
      const dashboard = await this.fetchJson<AttendanceDashboard>(`/api/attendance/admin/dashboard?${params}`);
      this.renderDepartmentFilter(dashboard.departments, departmentFilter.value);
      this.renderMarkList(dashboard);
      this.renderAdminTotals(dashboard);
      this.renderSummary(dashboard.summary);
      this.setText("calendarTitle", `${this.monthName(month)} ${year} - Daily Attendance`);
      this.setText("todayTitle", `${this.formatReadableDate(dateInput.value)}`);
      this.setText("summaryTitle", `All Employee Attendance - ${this.monthName(month)} ${year}`);
      this.setAlert("", "");
    } catch (err) {
      this.setAlert(err instanceof Error ? err.message : "Unable to load attendance.", "error");
    }
  }

  private renderDepartmentFilter(departments: string[], selected: string): void {
    const departmentFilter = this.getElement<HTMLSelectElement>("departmentFilter");
    const current = selected || departmentFilter.value;
    departmentFilter.innerHTML = '<option value="">All departments</option>';
    for (const department of departments) {
      const option = document.createElement("option");
      option.value = department;
      option.textContent = department;
      option.selected = department === current;
      departmentFilter.appendChild(option);
    }
  }

  private renderMarkList(dashboard: AttendanceDashboard): void {
    const markList = this.getElement<HTMLElement>("markList");
    const statusByUser = new Map(dashboard.dayRecords.map((record) => [record.userId, record.status]));
    const noteByUser = new Map(dashboard.dayRecords.map((record) => [record.userId, record.note || ""]));

    if (dashboard.employees.length === 0) {
      markList.innerHTML = '<p class="empty">No employees found.</p>';
      return;
    }

    markList.innerHTML = "";
    for (const employee of dashboard.employees) {
      const row = document.createElement("div");
      row.className = "mark-row";
      row.innerHTML = `
        <div class="employee">
          <div class="mini">${this.initials(employee.name)}</div>
          <div>
            <strong>${this.escapeHtml(employee.name)}</strong>
            <p class="muted">${this.escapeHtml(employee.department)} · ${this.escapeHtml(employee.email)}</p>
          </div>
        </div>
        <select class="select attendance-status" data-user-id="${employee.id}">
          ${this.statusOption("present", statusByUser.get(employee.id))}
          ${this.statusOption("absent", statusByUser.get(employee.id))}
          ${this.statusOption("late", statusByUser.get(employee.id))}
          ${this.statusOption("on_leave", statusByUser.get(employee.id))}
        </select>
      `;
      const select = row.querySelector<HTMLSelectElement>("select");
      if (select && !statusByUser.has(employee.id)) {
        select.value = "present";
      }
      select?.setAttribute("data-note", noteByUser.get(employee.id) || "");
      markList.appendChild(row);
    }
  }

  private renderAdminTotals(dashboard: AttendanceDashboard): void {
    this.setText("presentCount", String(dashboard.totals.present));
    this.setText("absentCount", String(dashboard.totals.absent));
    this.setText("lateCount", String(dashboard.totals.late));
    this.setText("leaveCount", String(dashboard.totals.onLeave));
    this.setText("attendanceRate", `${dashboard.totals.attendanceRate}%`);
    this.getElement<HTMLElement>("attendanceBar").style.width = `${dashboard.totals.attendanceRate}%`;
  }

  private renderSummary(summary: AttendanceSummaryRow[]): void {
    const body = this.getElement<HTMLTableSectionElement>("summaryBody");
    if (summary.length === 0) {
      body.innerHTML = '<tr><td colspan="7" class="empty">No attendance records for this filter.</td></tr>';
      return;
    }

    body.innerHTML = summary.map((row) => `
      <tr>
        <td>
          <div class="employee">
            <div class="mini">${this.initials(row.employeeName)}</div>
            <span>${this.escapeHtml(row.employeeName)}</span>
          </div>
        </td>
        <td>${this.escapeHtml(row.department)}</td>
        <td><span class="pill">${row.present}</span></td>
        <td>${row.absent}</td>
        <td>${row.late}</td>
        <td>${row.onLeave}</td>
        <td class="${row.attendanceRate >= 90 ? "rate-good" : "rate-warn"}">${row.attendanceRate}%</td>
      </tr>
    `).join("");
  }

  private async saveAttendance(): Promise<void> {
    const saveButton = this.getElement<HTMLButtonElement>("saveAttendance");
    const date = this.getElement<HTMLInputElement>("attendanceDate").value;
    const records = Array.from(document.querySelectorAll<HTMLSelectElement>(".attendance-status")).map((select) => ({
      userId: Number(select.dataset.userId),
      status: select.value as AttendanceStatus,
      note: select.dataset.note || "",
    }));

    saveButton.disabled = true;
    saveButton.textContent = "Saving...";

    try {
      await this.fetchJson<{ message: string }>("/api/attendance/admin/mark", {
        method: "POST",
        body: JSON.stringify({ date, records }),
      });
      this.setAlert("Attendance saved.", "success");
      await this.loadAdminAttendance();
    } catch (err) {
      this.setAlert(err instanceof Error ? err.message : "Unable to save attendance.", "error");
    } finally {
      saveButton.disabled = false;
      saveButton.textContent = "Save Attendance";
    }
  }

  private exportSummary(): void {
    const rows = Array.from(document.querySelectorAll<HTMLTableRowElement>("#summaryBody tr"));
    const lines = [["Employee", "Department", "Days Present", "Absent", "Late", "On Leave", "Rate"]];
    for (const row of rows) {
      const cells = Array.from(row.cells).map((cell) => `"${cell.textContent?.trim().replace(/"/g, '""') || ""}"`);
      if (cells.length === 7) {
        lines.push(cells);
      }
    }

    const blob = new Blob([lines.map((line) => line.join(",")).join("\n")], { type: "text/csv" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `attendance-report-${this.getElement<HTMLInputElement>("summaryMonth").value}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  private async initializeStaffAttendance(): Promise<void> {
    const monthInput = this.getElement<HTMLInputElement>("staffMonth");
    monthInput.value = this.toMonthInput(new Date());
    monthInput.addEventListener("change", () => void this.loadStaffAttendance());
    await this.loadStaffAttendance();
  }

  private async loadStaffAttendance(): Promise<void> {
    const monthInput = this.getElement<HTMLInputElement>("staffMonth");
    const [year, month] = monthInput.value.split("-").map(Number);
    try {
      const history = await this.fetchJson<StaffHistory>(`/api/attendance/staff/history?month=${month}&year=${year}`);
      this.setText("staffSummaryTitle", `Monthly Summary - ${this.monthName(month)} ${year}`);
      this.setText("staffPresentCount", String(history.totals.present));
      this.setText("staffAbsentCount", String(history.totals.absent));
      this.setText("staffLateCount", String(history.totals.late));
      this.setText("staffLeaveCount", String(history.totals.onLeave));
      this.setText("staffAttendanceRate", `${history.totals.attendanceRate}%`);
      this.getElement<HTMLElement>("staffAttendanceBar").style.width = `${history.totals.attendanceRate}%`;
      this.renderStaffHistory(history.records);
    } catch {
      this.renderStaffHistory([]);
    }
  }

  private renderStaffHistory(records: AttendanceRecord[]): void {
    const body = this.getElement<HTMLTableSectionElement>("staffHistoryBody");
    if (records.length === 0) {
      body.innerHTML = '<tr><td colspan="4" class="empty">No attendance records for this month yet.</td></tr>';
      return;
    }

    body.innerHTML = records.map((record) => `
      <tr>
        <td>${this.formatReadableDate(record.attendanceDate)}</td>
        <td><span class="status ${record.status}">${record.status.replace("_", " ")}</span></td>
        <td>${this.escapeHtml(record.note || "-")}</td>
        <td>${this.formatDateTime(record.updatedAt)}</td>
      </tr>
    `).join("");
  }

  private statusOption(status: AttendanceStatus, selected?: AttendanceStatus): string {
    const label = status.replace("_", " ");
    return `<option value="${status}" ${selected === status ? "selected" : ""}>${label}</option>`;
  }

  private async fetchJson<T>(url: string, init: RequestInit = {}): Promise<T> {
    const response = await fetch(url, {
      ...init,
      headers: {
        "Authorization": `Bearer ${this.token}`,
        "Content-Type": "application/json",
        ...(init.headers || {}),
      },
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || "Request failed");
    }
    return data as T;
  }

  private getStoredUser(): DashboardUser | null {
    const userJson = localStorage.getItem("user") || sessionStorage.getItem("user");
    if (!userJson) {
      return null;
    }
    try {
      return JSON.parse(userJson) as DashboardUser;
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

  private setAlert(message: string, type: "" | "error" | "success"): void {
    const alert = this.getOptional<HTMLElement>("attendanceAlert");
    if (!alert) {
      return;
    }
    alert.textContent = message;
    alert.className = type ? `alert ${type}` : "alert";
  }

  private setText(id: string, value: string): void {
    const element = this.getOptional<HTMLElement>(id);
    if (element) {
      element.textContent = value;
    }
  }

  private getElement<T extends HTMLElement>(id: string): T {
    const element = document.getElementById(id);
    if (!element) {
      throw new Error(`Missing required element: ${id}`);
    }
    return element as T;
  }

  private getOptional<T extends HTMLElement>(id: string): T | null {
    return document.getElementById(id) as T | null;
  }

  private initials(name: string): string {
    return name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || "")
      .join("") || "U";
  }

  private toDateInput(date: Date): string {
    return date.toISOString().slice(0, 10);
  }

  private toMonthInput(date: Date): string {
    return date.toISOString().slice(0, 7);
  }

  private monthName(month: number): string {
    return new Date(2026, month - 1, 1).toLocaleString("en", { month: "long" });
  }

  private formatReadableDate(date: string): string {
    return new Date(`${date}T00:00:00`).toLocaleDateString("en", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  }

  private formatDateTime(value: string): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }
    return date.toLocaleString("en", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  }

  private escapeHtml(value: string): string {
    return value.replace(/[&<>"']/g, (char) => {
      const entities: Record<string, string> = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
      };
      return entities[char];
    });
  }
}

new DashboardPage().init();
