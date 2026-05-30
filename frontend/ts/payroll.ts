type PayrollUserRole = "admin" | "staff";

interface StoredUser {
  id: number;
  name: string;
  email: string;
  role: PayrollUserRole;
}

interface EmployeeRecord {
  id: number;
  employee_id: string;
  first_name: string;
  last_name: string;
  salary: number;
  status: string;
}

interface PayrollSettingsRecord {
  id: number;
  employee_id: number;
  base_salary: number;
  housing_allowance: number;
  transport_allowance: number;
  other_allowances: number;
  deduction_per_absent_day: number;
  deduction_per_late_day: number;
  deduction_per_half_day: number;
}

interface PayrollCalculation {
  employee_id: number;
  employee_name: string;
  base_salary: number;
  allowances: number;
  deductions: number;
  gross_salary: number;
  net_salary: number;
}

interface PayrollSummary {
  month: string;
  year: number;
  total_employees: number;
  calculations: PayrollCalculation[];
  total_gross: number;
  total_deductions: number;
  total_net: number;
}

class AdminPayrollPage {
  private readonly backBtn = this.getEl<HTMLButtonElement>("backBtn");
  private readonly logoutBtn = this.getEl<HTMLButtonElement>("logoutBtn");

  private readonly employeeSelect = this.getEl<HTMLSelectElement>("employeeSelect");
  private readonly baseSalary = this.getEl<HTMLInputElement>("baseSalary");
  private readonly housingAllowance = this.getEl<HTMLInputElement>("housingAllowance");
  private readonly transportAllowance = this.getEl<HTMLInputElement>("transportAllowance");
  private readonly otherAllowances = this.getEl<HTMLInputElement>("otherAllowances");
  private readonly dedAbsent = this.getEl<HTMLInputElement>("dedAbsent");
  private readonly dedLate = this.getEl<HTMLInputElement>("dedLate");
  private readonly dedHalfDay = this.getEl<HTMLInputElement>("dedHalfDay");
  private readonly saveSettingsBtn = this.getEl<HTMLButtonElement>("saveSettingsBtn");
  private readonly settingsMsg = this.getEl<HTMLElement>("settingsMsg");

  private readonly monthSelect = this.getEl<HTMLSelectElement>("monthSelect");
  private readonly yearInput = this.getEl<HTMLInputElement>("yearInput");
  private readonly previewPayrollBtn = this.getEl<HTMLButtonElement>("previewPayrollBtn");
  private readonly savePayrollBtn = this.getEl<HTMLButtonElement>("savePayrollBtn");
  private readonly payrollSummaryMsg = this.getEl<HTMLElement>("payrollSummaryMsg");
  private readonly payrollTableWrap = this.getEl<HTMLElement>("payrollTableWrap");

  private readonly periodMonthSelect = this.getEl<HTMLSelectElement>("periodMonthSelect");
  private readonly periodYearInput = this.getEl<HTMLInputElement>("periodYearInput");
  private readonly loadPeriodBtn = this.getEl<HTMLButtonElement>("loadPeriodBtn");
  private readonly deletePeriodBtn = this.getEl<HTMLButtonElement>("deletePeriodBtn");
  private readonly periodMsg = this.getEl<HTMLElement>("periodMsg");
  private readonly periodTableWrap = this.getEl<HTMLElement>("periodTableWrap");

  private employees: EmployeeRecord[] = [];
  private lastPreview: { month: number; year: number; summary: PayrollSummary } | null = null;

  public init(): void {
    const user = this.getStoredUser();
    if (!user || user.role !== "admin") {
      window.location.href = "/login.html";
      return;
    }

    this.backBtn.addEventListener("click", () => (window.location.href = "/admin/dashboard.html"));
    this.logoutBtn.addEventListener("click", () => this.logout());

    this.populateMonthSelect(this.monthSelect);
    this.populateMonthSelect(this.periodMonthSelect);

    const now = new Date();
    this.monthSelect.value = String(now.getMonth() + 1);
    this.periodMonthSelect.value = String(now.getMonth() + 1);
    this.yearInput.value = String(now.getFullYear());
    this.periodYearInput.value = String(now.getFullYear());

    this.employeeSelect.addEventListener("change", () => this.loadEmployeeSettings());
    this.saveSettingsBtn.addEventListener("click", () => this.saveEmployeeSettings());

    this.previewPayrollBtn.addEventListener("click", () => this.previewPayroll());
    this.savePayrollBtn.addEventListener("click", () => this.savePayroll());

    this.loadPeriodBtn.addEventListener("click", () => this.loadPeriod());
    this.deletePeriodBtn.addEventListener("click", () => this.deletePeriod());

    void this.loadEmployees();
  }

  private async loadEmployees(): Promise<void> {
    try {
      const result = await this.fetchJson<{ employees: EmployeeRecord[] }>(
        "/api/employees?limit=200&offset=0&status=active",
        { method: "GET" },
      );
      this.employees = result.employees || [];

      if (this.employees.length === 0) {
        this.employeeSelect.innerHTML = `<option value="">No employees found</option>`;
        this.settingsMsg.textContent = "No active employees available.";
        return;
      }

      this.employeeSelect.innerHTML = this.employees
        .map((e) => `<option value="${e.id}">${e.employee_id} - ${e.first_name} ${e.last_name}</option>`)
        .join("");

      await this.loadEmployeeSettings();
    } catch (e) {
      console.error(e);
      this.employeeSelect.innerHTML = `<option value="">Failed to load employees</option>`;
      this.settingsMsg.textContent = "Failed to load employees.";
    }
  }

  private async loadEmployeeSettings(): Promise<void> {
    const employeeId = Number(this.employeeSelect.value);
    if (!employeeId) return;

    this.settingsMsg.className = "muted";
    this.settingsMsg.textContent = "Loading settings...";

    const employee = this.employees.find((e) => e.id === employeeId) || null;

    try {
      const res = await this.fetchJson<{ settings: PayrollSettingsRecord }>(
        `/api/payroll/settings/${employeeId}`,
        { method: "GET" },
      );

      this.fillSettingsForm(res.settings);
      this.settingsMsg.textContent = "Settings loaded.";
    } catch (err: any) {
      const message = typeof err?.message === "string" ? err.message : "";
      if (message.includes("404")) {
        this.fillSettingsForm({
          id: 0,
          employee_id: employeeId,
          base_salary: employee?.salary ?? 0,
          housing_allowance: 0,
          transport_allowance: 0,
          other_allowances: 0,
          deduction_per_absent_day: 0,
          deduction_per_late_day: 0,
          deduction_per_half_day: 0,
        });
        this.settingsMsg.textContent = "No settings yet. Fill and save.";
      } else {
        this.settingsMsg.className = "error";
        this.settingsMsg.textContent = "Failed to load settings.";
      }
    }
  }

  private fillSettingsForm(s: PayrollSettingsRecord): void {
    this.baseSalary.value = String(s.base_salary ?? 0);
    this.housingAllowance.value = String(s.housing_allowance ?? 0);
    this.transportAllowance.value = String(s.transport_allowance ?? 0);
    this.otherAllowances.value = String(s.other_allowances ?? 0);
    this.dedAbsent.value = String(s.deduction_per_absent_day ?? 0);
    this.dedLate.value = String(s.deduction_per_late_day ?? 0);
    this.dedHalfDay.value = String(s.deduction_per_half_day ?? 0);
  }

  private async saveEmployeeSettings(): Promise<void> {
    const employeeId = Number(this.employeeSelect.value);
    if (!employeeId) return;

    const payload = {
      base_salary: this.num(this.baseSalary.value),
      housing_allowance: this.num(this.housingAllowance.value),
      transport_allowance: this.num(this.transportAllowance.value),
      other_allowances: this.num(this.otherAllowances.value),
      deduction_per_absent_day: this.num(this.dedAbsent.value),
      deduction_per_late_day: this.num(this.dedLate.value),
      deduction_per_half_day: this.num(this.dedHalfDay.value),
    };

    if (!payload.base_salary || payload.base_salary <= 0) {
      this.settingsMsg.className = "error";
      this.settingsMsg.textContent = "Base salary must be > 0.";
      return;
    }

    this.saveSettingsBtn.disabled = true;
    this.settingsMsg.className = "muted";
    this.settingsMsg.textContent = "Saving...";

    try {
      await this.fetchJson(`/api/payroll/settings/${employeeId}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      this.settingsMsg.className = "success";
      this.settingsMsg.textContent = "Settings saved.";
    } catch (e) {
      console.error(e);
      this.settingsMsg.className = "error";
      this.settingsMsg.textContent = "Failed to save settings.";
    } finally {
      this.saveSettingsBtn.disabled = false;
    }
  }

  private async previewPayroll(): Promise<void> {
    const month = Number(this.monthSelect.value);
    const year = Number(this.yearInput.value);
    this.savePayrollBtn.disabled = true;
    this.lastPreview = null;

    this.payrollSummaryMsg.className = "muted";
    this.payrollSummaryMsg.textContent = "Calculating...";
    this.payrollTableWrap.innerHTML = `<p class="muted">Loading...</p>`;

    try {
      const res = await this.fetchJson<{ summary: PayrollSummary }>("/api/payroll/calculate", {
        method: "POST",
        body: JSON.stringify({ month, year }),
      });

      this.lastPreview = { month, year, summary: res.summary };
      this.savePayrollBtn.disabled = false;

      this.payrollSummaryMsg.textContent = `${res.summary.month} ${res.summary.year}: ${res.summary.total_employees} employees — Net total $${this.money(
        res.summary.total_net,
      )}`;

      this.renderPayrollPreview(res.summary.calculations);
    } catch (e: any) {
      const msg = typeof e?.message === "string" ? e.message : "";
      this.payrollSummaryMsg.className = "error";
      this.payrollSummaryMsg.textContent = msg || "Failed to calculate payroll.";
      this.payrollTableWrap.innerHTML = `<p class="muted">No data.</p>`;
    }
  }

  private renderPayrollPreview(rows: PayrollCalculation[]): void {
    if (!rows || rows.length === 0) {
      this.payrollTableWrap.innerHTML = `<p class="muted">No employees calculated.</p>`;
      return;
    }

    const html = `
      <table>
        <thead>
          <tr>
            <th>Employee</th>
            <th class="right">Base</th>
            <th class="right">Allowances</th>
            <th class="right">Deductions</th>
            <th class="right">Gross</th>
            <th class="right">Net</th>
          </tr>
        </thead>
        <tbody>
          ${rows
            .map(
              (r) => `
              <tr>
                <td>${this.escape(r.employee_name)} (#${r.employee_id})</td>
                <td class="right">$${this.money(r.base_salary)}</td>
                <td class="right">$${this.money(r.allowances)}</td>
                <td class="right">$${this.money(r.deductions)}</td>
                <td class="right">$${this.money(r.gross_salary)}</td>
                <td class="right"><strong>$${this.money(r.net_salary)}</strong></td>
              </tr>`,
            )
            .join("")}
        </tbody>
      </table>
    `;

    this.payrollTableWrap.innerHTML = html;
  }

  private async savePayroll(): Promise<void> {
    if (!this.lastPreview) return;

    const { month, year } = this.lastPreview;
    this.savePayrollBtn.disabled = true;
    this.payrollSummaryMsg.className = "muted";
    this.payrollSummaryMsg.textContent = "Saving payroll...";

    try {
      const res = await this.fetchJson<{ message: string; total_employees: number; total_net: number }>(
        "/api/payroll/calculate/save",
        {
          method: "POST",
          body: JSON.stringify({ month, year }),
        },
      );
      this.payrollSummaryMsg.className = "success";
      this.payrollSummaryMsg.textContent = `${res.message} — ${res.total_employees} employees, net total $${this.money(
        res.total_net,
      )}`;
    } catch (e: any) {
      const msg = typeof e?.message === "string" ? e.message : "";
      this.payrollSummaryMsg.className = "error";
      this.payrollSummaryMsg.textContent = msg || "Failed to save payroll.";
      this.savePayrollBtn.disabled = false;
    }
  }

  private async loadPeriod(): Promise<void> {
    const month = Number(this.periodMonthSelect.value);
    const year = Number(this.periodYearInput.value);

    this.periodMsg.className = "muted";
    this.periodMsg.textContent = "Loading period...";
    this.periodTableWrap.innerHTML = `<p class="muted">Loading...</p>`;

    try {
      const res = await this.fetchJson<{ payroll: any[]; total: number; month: number; year: number }>(
        `/api/payroll/period?month=${encodeURIComponent(String(month))}&year=${encodeURIComponent(String(year))}`,
        { method: "GET" },
      );

      this.periodMsg.textContent = `Loaded ${res.total} payroll records for ${month}/${year}.`;
      this.renderPeriod(res.payroll || []);
    } catch (e: any) {
      const msg = typeof e?.message === "string" ? e.message : "";
      this.periodMsg.className = "error";
      this.periodMsg.textContent = msg || "Failed to load period.";
      this.periodTableWrap.innerHTML = `<p class="muted">No data.</p>`;
    }
  }

  private renderPeriod(rows: any[]): void {
    if (!rows || rows.length === 0) {
      this.periodTableWrap.innerHTML = `<p class="muted">No payroll found for this period.</p>`;
      return;
    }

    const html = `
      <table>
        <thead>
          <tr>
            <th>Employee</th>
            <th>Status</th>
            <th class="right">Net</th>
            <th class="right">Gross</th>
            <th class="right">Deductions</th>
          </tr>
        </thead>
        <tbody>
          ${rows
            .map(
              (r) => `
              <tr>
                <td>${this.escape(`${r.employee_id ?? ""}`)} - ${this.escape(`${r.first_name ?? ""} ${r.last_name ?? ""}`)}</td>
                <td><span class="pill ${this.escape(r.status)}">${this.escape(r.status)}</span></td>
                <td class="right"><strong>$${this.money(Number(r.net_salary))}</strong></td>
                <td class="right">$${this.money(Number(r.gross_salary))}</td>
                <td class="right">$${this.money(Number(r.deductions))}</td>
              </tr>`,
            )
            .join("")}
        </tbody>
      </table>
    `;

    this.periodTableWrap.innerHTML = html;
  }

  private async deletePeriod(): Promise<void> {
    const month = Number(this.periodMonthSelect.value);
    const year = Number(this.periodYearInput.value);

    const ok = window.confirm(`Delete payroll (and payslips) for ${month}/${year}?`);
    if (!ok) return;

    this.periodMsg.className = "muted";
    this.periodMsg.textContent = "Deleting period...";

    try {
      const res = await this.fetchJson<{ message: string }>(
        `/api/payroll/period?month=${encodeURIComponent(String(month))}&year=${encodeURIComponent(String(year))}`,
        { method: "DELETE" },
      );
      this.periodMsg.className = "success";
      this.periodMsg.textContent = res.message || "Deleted.";
      this.periodTableWrap.innerHTML = `<p class="muted">No period loaded.</p>`;
    } catch (e: any) {
      const msg = typeof e?.message === "string" ? e.message : "";
      this.periodMsg.className = "error";
      this.periodMsg.textContent = msg || "Failed to delete period.";
    }
  }

  private populateMonthSelect(sel: HTMLSelectElement): void {
    const months = Array.from({ length: 12 }, (_, i) => i + 1).map((m) => {
      const name = new Date(2000, m - 1, 1).toLocaleString(undefined, { month: "long" });
      return `<option value="${m}">${name}</option>`;
    });
    sel.innerHTML = months.join("");
  }

  private async fetchJson<T = any>(url: string, init: RequestInit): Promise<T> {
    const token = this.getStoredToken();
    if (!token) {
      window.location.href = "/login.html";
      throw new Error("401");
    }

    const res = await fetch(url, {
      ...init,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        ...(init.headers || {}),
      },
    });

    if (!res.ok) {
      let bodyText = "";
      try {
        bodyText = await res.text();
      } catch {}
      if (res.status === 401) {
        window.location.href = "/login.html";
      }
      throw new Error(`${res.status} ${res.statusText}${bodyText ? ` - ${bodyText}` : ""}`);
    }

    return (await res.json()) as T;
  }

  private getStoredUser(): StoredUser | null {
    const s = localStorage.getItem("user") || sessionStorage.getItem("user");
    if (!s) return null;
    try {
      return JSON.parse(s) as StoredUser;
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

  private num(v: string): number {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  }

  private money(v: number): string {
    return Number(v || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  private escape(s: string): string {
    return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));
  }

  private getEl<T extends HTMLElement>(id: string): T {
    const el = document.getElementById(id);
    if (!el) throw new Error(`Missing element: ${id}`);
    return el as T;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const page = new AdminPayrollPage();
  page.init();
});
