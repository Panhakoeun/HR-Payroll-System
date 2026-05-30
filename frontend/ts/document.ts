/**
 * Document Management Page
 * Frontend logic for document management system
 */

type DocumentType = "contract" | "certificate" | "policy" | "report" | "other";
type DocumentStatus = "active" | "archived" | "expired";

interface StoredUser {
  name: string;
  role: "admin" | "staff";
}

interface Employee {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
}

interface Document {
  id: number;
  employee_id: number;
  title: string;
  description: string | null;
  document_type: DocumentType;
  file_name: string;
  file_size: number;
  status: DocumentStatus;
  uploaded_by: number;
  created_at: string;
  updated_at: string;
  employee_name?: string;
}

interface DocumentsListResponse {
  documents?: Document[];
  pagination?: {
    total: number;
    limit: number;
    offset: number;
  };
  message?: string;
}

interface DocumentResponse {
  document?: Document;
  message?: string;
}

class DocumentsPage {
  private documents: Document[] = [];
  private employees: Employee[] = [];
  private filteredDocuments: Document[] = [];
  private currentPage = 0;
  private pageSize = 50;
  private editingDocumentId: number | null = null;

  // DOM Elements
  private readonly userName = this.getElement<HTMLElement>("userName");
  private readonly userRole = this.getElement<HTMLElement>("userRole");
  private readonly logoutButton = this.getElement<HTMLButtonElement>("logoutButton");
  private readonly avatarInitial = this.getElement<HTMLElement>("avatarInitial");
  private readonly openModalButton = this.getElement<HTMLButtonElement>("openAddDocumentModal");
  private readonly closeModalButton = this.getElement<HTMLButtonElement>("closeDocumentModal");
  private readonly cancelButton = this.getElement<HTMLButtonElement>("cancelAddDocument");
  private readonly emptyStateAddBtn = this.getElement<HTMLButtonElement>("emptyStateAddBtn");
  private readonly modal = this.getElement<HTMLElement>("documentModal");
  private readonly form = this.getElement<HTMLFormElement>("documentForm");
  private readonly submitButton = this.getElement<HTMLButtonElement>("addDocumentButton");
  private readonly alert = this.getElement<HTMLElement>("documentAlert");
  private readonly modalAlert = this.getElement<HTMLElement>("modalAlert");
  private readonly tableBody = this.getElement<HTMLTableSectionElement>("documentTableBody");
  private readonly documentCount = this.getElement<HTMLElement>("documentCount");
  private readonly documentSearch = this.getElement<HTMLInputElement>("documentSearch");
  private readonly documentFilterSearch = this.getElement<HTMLInputElement>("documentFilterSearch");
  private readonly typeFilter = this.getElement<HTMLSelectElement>("typeFilter");
  private readonly statusFilter = this.getElement<HTMLSelectElement>("statusFilter");
  private readonly modalTitle = this.getElement<HTMLElement>("documentModalTitle");
  private readonly employeeSelect = this.getElement<HTMLSelectElement>("employeeSelect");
  private readonly documentTitle = this.getElement<HTMLInputElement>("documentTitle");
  private readonly documentType = this.getElement<HTMLSelectElement>("documentType");
  private readonly documentFile = this.getElement<HTMLInputElement>("documentFile");
  private readonly documentDescription = this.getElement<HTMLTextAreaElement>("documentDescription");
  private readonly documentStatus = this.getElement<HTMLSelectElement>("documentStatus");
  private readonly emptyState = this.getElement<HTMLElement>("emptyState");

  /**
   * Initialize the page
   */
  public init(): void {
    const user = this.getStoredUser();
    if (!user || user.role !== "admin") {
      window.location.href = "/login.html";
      return;
    }

    this.userName.textContent = user.name;
    this.userRole.textContent = user.role.charAt(0).toUpperCase() + user.role.slice(1);
    this.avatarInitial.textContent = user.name.charAt(0).toUpperCase();

    this.setupEventListeners();
    this.loadEmployees();
    this.loadDocuments();
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    // Modal controls
    this.openModalButton.addEventListener("click", () => this.openModal());
    this.emptyStateAddBtn.addEventListener("click", () => this.openModal());
    this.closeModalButton.addEventListener("click", () => this.closeModal());
    this.cancelButton.addEventListener("click", () => this.closeModal());
    this.modal.addEventListener("click", (e) => {
      if (e.target === this.modal) this.closeModal();
    });

    // Form submission
    this.submitButton.addEventListener("click", () => this.handleSubmit());

    // Logout
    this.logoutButton.addEventListener("click", () => this.logout());

    // Search and filters
    this.documentSearch.addEventListener("input", () => this.applyFilters());
    this.documentFilterSearch.addEventListener("input", () => this.applyFilters());
    this.typeFilter.addEventListener("change", () => this.applyFilters());
    this.statusFilter.addEventListener("change", () => this.applyFilters());
  }

  /**
   * Load employees for dropdown
   */
  private async loadEmployees(): Promise<void> {
    try {
      const response = await fetch("/api/employees?limit=1000", {
        headers: { Authorization: `Bearer ${this.getToken()}` },
      });

      if (!response.ok) throw new Error("Failed to load employees");

      const data = await response.json();
      this.employees = data.employees || [];
      this.populateEmployeeSelect();
    } catch (err) {
      console.error("Load employees error:", err);
      this.showAlert("Failed to load employees", "error");
    }
  }

  /**
   * Populate employee dropdown
   */
  private populateEmployeeSelect(): void {
    this.employeeSelect.innerHTML = "<option value=''>Select an employee...</option>";
    this.employees.forEach((emp) => {
      const option = document.createElement("option");
      option.value = emp.id.toString();
      option.textContent = `${emp.first_name} ${emp.last_name}`;
      this.employeeSelect.appendChild(option);
    });
  }

  /**
   * Load documents from API
   */
  private async loadDocuments(): Promise<void> {
    try {
      const response = await fetch(
        `/api/documents?limit=${this.pageSize}&offset=${this.currentPage * this.pageSize}`,
        {
          headers: { Authorization: `Bearer ${this.getToken()}` },
        }
      );

      if (!response.ok) throw new Error("Failed to load documents");

      const data: DocumentsListResponse = await response.json();
      this.documents = data.documents || [];
      this.filteredDocuments = [...this.documents];
      this.updateUI();
    } catch (err) {
      console.error("Load documents error:", err);
      this.showAlert("Failed to load documents", "error");
    }
  }

  /**
   * Apply filters and search
   */
  private applyFilters(): void {
    const searchTerm = this.documentSearch.value.toLowerCase();
    const filterSearch = this.documentFilterSearch.value.toLowerCase();
    const typeValue = this.typeFilter.value;
    const statusValue = this.statusFilter.value;

    this.filteredDocuments = this.documents.filter((doc) => {
      const matchesSearch =
        searchTerm === "" ||
        doc.title.toLowerCase().includes(searchTerm) ||
        doc.file_name.toLowerCase().includes(searchTerm);

      const matchesFilterSearch =
        filterSearch === "" ||
        doc.title.toLowerCase().includes(filterSearch) ||
        doc.file_name.toLowerCase().includes(filterSearch);

      const matchesType = typeValue === "" || doc.document_type === typeValue;
      const matchesStatus = statusValue === "" || doc.status === statusValue;

      return matchesSearch && matchesFilterSearch && matchesType && matchesStatus;
    });

    this.renderDocuments();
  }

  /**
   * Render documents table
   */
  private renderDocuments(): void {
    if (this.filteredDocuments.length === 0) {
      this.tableBody.innerHTML = "";
      this.emptyState.style.display = "block";
      return;
    }

    this.emptyState.style.display = "none";
    this.tableBody.innerHTML = this.filteredDocuments
      .map(
        (doc) => `
      <tr>
        <td><strong>${this.escapeHtml(doc.title)}</strong></td>
        <td>${doc.employee_name || "Unknown"}</td>
        <td><span class="document-type">${this.formatDocumentType(doc.document_type)}</span></td>
        <td>${this.escapeHtml(doc.file_name)}</td>
        <td><span class="file-size">${this.formatFileSize(doc.file_size)}</span></td>
        <td><span class="status ${doc.status}">${this.formatStatus(doc.status)}</span></td>
        <td>${new Date(doc.created_at).toLocaleDateString()}</td>
        <td>
          <div class="actions-cell">
            <button class="icon-btn" onclick="documentsPage.editDocument(${doc.id})" title="Edit">✏️</button>
            <button class="icon-btn danger" onclick="documentsPage.deleteDocument(${doc.id})" title="Delete">🗑️</button>
          </div>
        </td>
      </tr>
    `
      )
      .join("");
  }

  /**
   * Handle form submission
   */
  private async handleSubmit(): Promise<void> {
    const employeeId = Number(this.employeeSelect.value);
    const title = this.documentTitle.value.trim();
    const type = this.documentType.value as DocumentType;
    const file = this.documentFile.files?.[0];
    const description = this.documentDescription.value.trim();
    const status = this.documentStatus.value as DocumentStatus;

    // Validation
    if (!employeeId || !title || !type) {
      this.showModalAlert("Please fill in all required fields", "error");
      return;
    }

    if (!file && !this.editingDocumentId) {
      this.showModalAlert("Please select a file", "error");
      return;
    }

    try {
      this.submitButton.disabled = true;

      if (this.editingDocumentId) {
        // Update existing document
        await this.updateDocument(this.editingDocumentId, {
          title,
          description,
          document_type: type,
          status,
        });
      } else {
        // Create new document
        if (!file) {
          this.showModalAlert("Please select a file", "error");
          return;
        }

        const formData = new FormData();
        formData.append("employee_id", employeeId.toString());
        formData.append("title", title);
        formData.append("description", description);
        formData.append("document_type", type);
        formData.append("file", file);
        formData.append("status", status);

        const response = await fetch("/api/documents", {
          method: "POST",
          headers: { Authorization: `Bearer ${this.getToken()}` },
          body: formData,
        });

        if (!response.ok) throw new Error("Failed to create document");

        const data: DocumentResponse = await response.json();
        this.showAlert(`✓ ${data.message || "Document created successfully"}`, "success");
        this.resetForm();
        this.closeModal();
        this.loadDocuments();
      }
    } catch (err) {
      console.error("Submit error:", err);
      this.showModalAlert("Failed to process document", "error");
    } finally {
      this.submitButton.disabled = false;
    }
  }

  /**
   * Edit document
   */
  public async editDocument(id: number): Promise<void> {
    const doc = this.documents.find((d) => d.id === id);
    if (!doc) return;

    this.editingDocumentId = id;
    this.modalTitle.textContent = "Edit Document";
    this.submitButton.textContent = "Update Document";
    this.documentFile.required = false;

    this.employeeSelect.value = doc.employee_id.toString();
    this.documentTitle.value = doc.title;
    this.documentType.value = doc.document_type;
    this.documentDescription.value = doc.description || "";
    this.documentStatus.value = doc.status;

    this.modal.classList.add("show");
  }

  /**
   * Update document
   */
  private async updateDocument(id: number, data: any): Promise<void> {
    try {
      const response = await fetch(`/api/documents/${id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${this.getToken()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error("Failed to update document");

      const result: DocumentResponse = await response.json();
      this.showAlert(`✓ ${result.message || "Document updated successfully"}`, "success");
      this.resetForm();
      this.closeModal();
      this.loadDocuments();
    } catch (err) {
      console.error("Update error:", err);
      this.showModalAlert("Failed to update document", "error");
    }
  }

  /**
   * Delete document
   */
  public async deleteDocument(id: number): Promise<void> {
    if (!confirm("Are you sure you want to delete this document?")) return;

    try {
      const response = await fetch(`/api/documents/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${this.getToken()}` },
      });

      if (!response.ok) throw new Error("Failed to delete document");

      this.showAlert("✓ Document deleted successfully", "success");
      this.loadDocuments();
    } catch (err) {
      console.error("Delete error:", err);
      this.showAlert("Failed to delete document", "error");
    }
  }

  /**
   * Update UI with document count
   */
  private updateUI(): void {
    this.documentCount.textContent =
      this.documents.length === 1 ? "1 document" : `${this.documents.length} documents`;
    this.renderDocuments();
  }

  /**
   * Open modal
   */
  private openModal(): void {
    this.editingDocumentId = null;
    this.modalTitle.textContent = "Add Document";
    this.submitButton.textContent = "Add Document";
    this.documentFile.required = true;
    this.resetForm();
    this.modal.classList.add("show");
  }

  /**
   * Close modal
   */
  private closeModal(): void {
    this.modal.classList.remove("show");
    this.resetForm();
  }

  /**
   * Reset form
   */
  private resetForm(): void {
    this.form.reset();
    this.documentStatus.value = "active";
    this.modalAlert.textContent = "";
    this.modalAlert.classList.remove("show", "success", "error");
  }

  /**
   * Show alert message
   */
  private showAlert(message: string, type: "success" | "error" | "warning"): void {
    this.alert.textContent = message;
    this.alert.className = `alert show ${type}`;
    setTimeout(() => {
      this.alert.classList.remove("show");
    }, 5000);
  }

  /**
   * Show modal alert message
   */
  private showModalAlert(message: string, type: "success" | "error" | "warning"): void {
    this.modalAlert.textContent = message;
    this.modalAlert.className = `alert show ${type}`;
  }

  /**
   * Format document type
   */
  private formatDocumentType(type: DocumentType): string {
    const map: Record<DocumentType, string> = {
      contract: "Contract",
      certificate: "Certificate",
      policy: "Policy",
      report: "Report",
      other: "Other",
    };
    return map[type] || type;
  }

  /**
   * Format status
   */
  private formatStatus(status: DocumentStatus): string {
    return status.charAt(0).toUpperCase() + status.slice(1);
  }

  /**
   * Format file size
   */
  private formatFileSize(bytes: number): string {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  }

  /**
   * HTML escape utility
   */
  private escapeHtml(text: string): string {
    const map: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    };
    return text.replace(/[&<>"']/g, (m) => map[m]);
  }

  /**
   * Get stored user
   */
  private getStoredUser(): StoredUser | null {
    const user = localStorage.getItem("user");
    return user ? JSON.parse(user) : null;
  }

  /**
   * Get authentication token
   */
  private getToken(): string {
    return localStorage.getItem("token") || "";
  }

  /**
   * Logout
   */
  private logout(): void {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login.html";
  }

  /**
   * Get DOM element with type safety
   */
  private getElement<T extends HTMLElement>(id: string): T {
    const element = document.getElementById(id) as T | null;
    if (!element) throw new Error(`Element with id "${id}" not found`);
    return element;
  }
}

// Make documentsPage accessible globally for inline onclick handlers
const documentsPage = new DocumentsPage();

// Initialize when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  documentsPage.init();
});
