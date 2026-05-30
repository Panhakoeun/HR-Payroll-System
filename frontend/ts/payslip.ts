type PayslipUserRole = "admin" | "staff";

interface StoredUser {
  id: number;
  name: string;
  email: string;
  role: PayslipUserRole;
}

interface PayslipResponse {
  id: number;
  payroll_id: number;
  employee_id: number;
  pay_period_start: string;
  pay_period_end: string;
  basic_salary: number;
  allowances: number;
  deductions: number;
  gross_salary: number;
  net_salary: number;
  status: "draft" | "generated" | "sent" | "viewed";
  generated_at: string;
}

class StaffPayslipPage {
  private readonly backBtn = this.getEl<HTMLButtonElement>("backBtn");
  private readonly logoutBtn = this.getEl<HTMLButtonElement>("logoutBtn");
  private readonly refreshBtn = this.getEl<HTMLButtonElement>("refreshBtn");
  private readonly msg = this.getEl<HTMLElement>("msg");
  private readonly tableWrap = this.getEl<HTMLElement>("tableWrap");

  public init(): void {
    const user = this.getStoredUser();
    if (!user || user.role !== "staff") {
      window.location.href = "/login.html";
      return;
    }

    this.backBtn.addEventListener("click", () => (window.location.href = "/staff/dashboard.html"));
    this.logoutBtn.addEventListener("click", () => this.logout());
    this.refreshBtn.addEventListener("click", () => void this.loadPayslips());

    void this.loadPayslips();
  }

  private async loadPayslips(): Promise<void> {
    this.msg.className = "muted";
    this.msg.textContent = "Loading payslips...";
    this.tableWrap.innerHTML = `<p class="muted">Loading...</p>`;

    try {
      const res = await this.fetchJson<{ payslips: PayslipResponse[] }>("/api/payslips/me?limit=100&offset=0", {
        method: "GET",
      });
      const rows = res.payslips || [];
      this.msg.textContent = rows.length === 0 ? "No payslips found." : `Loaded ${rows.length} payslips.`;
      this.render(rows);
    } catch (e: any) {
      const msg = typeof e?.message === "string" ? e.message : "";
      this.msg.className = "error";
      this.msg.textContent = msg || "Failed to load payslips.";
      this.tableWrap.innerHTML = `<p class="muted">No data.</p>`;
    }
  }

  private render(rows: PayslipResponse[]): void {
    if (!rows || rows.length === 0) {
      this.tableWrap.innerHTML = `<p class="muted">No payslips available yet.</p>`;
      return;
    }

    const html = `
      <table>
        <thead>
          <tr>
            <th>Period</th>
            <th>Status</th>
            <th class="right">Net</th>
            <th class="right">Gross</th>
            <th class="right">Deductions</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          ${rows
            .map((p) => {
              const canMarkViewed = p.status !== "viewed";
              return `
                <tr data-id="${p.id}">
                  <td>${this.date(p.pay_period_start)} to ${this.date(p.pay_period_end)}</td>
                  <td><span class="pill ${this.escape(p.status)}">${this.escape(p.status)}</span></td>
                  <td class="right"><strong>$${this.money(p.net_salary)}</strong></td>
                  <td class="right">$${this.money(p.gross_salary)}</td>
                  <td class="right">$${this.money(p.deductions)}</td>
                  <td>${canMarkViewed ? `<span class="link" data-action="viewed">Mark viewed</span>` : ""}</td>
                </tr>
              `;
            })
            .join("")}
        </tbody>
      </table>
    `;

    this.tableWrap.innerHTML = html;

    this.tableWrap.querySelectorAll<HTMLElement>("[data-action='viewed']").forEach((el) => {
      el.addEventListener("click", async (ev) => {
        ev.preventDefault();
        const tr = (el.closest("tr") as HTMLElement | null) ?? null;
        const id = tr ? Number(tr.dataset.id) : 0;
        if (!id) return;
        await this.markViewed(id);
      });
    });
  }

  private async markViewed(id: number): Promise<void> {
    this.msg.className = "muted";
    this.msg.textContent = "Marking payslip as viewed...";

    try {
      await this.fetchJson(`/api/payslips/${id}/mark-viewed`, { method: "POST" });
      this.msg.className = "success";
      this.msg.textContent = "Payslip marked as viewed.";
      await this.loadPayslips();
    } catch (e: any) {
      const msg = typeof e?.message === "string" ? e.message : "";
      this.msg.className = "error";
      this.msg.textContent = msg || "Failed to mark as viewed.";
    }
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

  private date(d: string): string {
    const dt = new Date(d);
    return Number.isNaN(dt.getTime()) ? d : dt.toLocaleDateString();
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
  const page = new StaffPayslipPage();
  page.init();
});
