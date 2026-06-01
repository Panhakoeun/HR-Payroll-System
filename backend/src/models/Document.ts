/**
 * Document Module - Models and Interfaces
 * Defines all types and interfaces for the Document entity
 */

export type DocumentType = "contract" | "certificate" | "policy" | "report" | "other";
export type DocumentStatus = "active" | "archived" | "expired";

// ========== Database Record Interface ==========
export interface DocumentRecord {
  id: number;
  employee_id: number;
  title: string;
  description: string | null;
  document_type: DocumentType;
  file_path: string;
  file_name: string;
  file_size: number;
  status: DocumentStatus;
  uploaded_by: number;
  created_at: Date;
  updated_at: Date;
}

// ========== Request DTOs (Data Transfer Objects) ==========
export interface CreateDocumentRequest {
  employee_id: number;
  title: string;
  description?: string;
  document_type: DocumentType;
  file_path: string;
  file_name: string;
  file_size: number;
}

export interface UpdateDocumentRequest {
  title?: string;
  description?: string;
  document_type?: DocumentType;
  status?: DocumentStatus;
}

// ========== Response DTOs ==========
export interface DocumentResponse {
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
}

export interface DocumentDetailResponse extends DocumentResponse {
  employee_name: string;
}

// ========== Model Class ==========
export class Document {
  constructor(private record: DocumentRecord) {}

  public toResponse(): DocumentResponse {
    return {
      id: this.record.id,
      employee_id: this.record.employee_id,
      title: this.record.title,
      description: this.record.description,
      document_type: this.record.document_type,
      file_name: this.record.file_name,
      file_size: this.record.file_size,
      status: this.record.status,
      uploaded_by: this.record.uploaded_by,
      created_at: this.record.created_at.toISOString(),
      updated_at: this.record.updated_at.toISOString(),
    };
  }

  public toDetailResponse(employeeName: string): DocumentDetailResponse {
    return {
      ...this.toResponse(),
      employee_name: employeeName,
    };
  }
}
