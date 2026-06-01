/**
 * Document Repository
 * Handles all database operations for Document entity
 */

import { Database } from "../database/Database";
import { DocumentRecord, CreateDocumentRequest, UpdateDocumentRequest } from "../models/Document";

export class DocumentRepository {
  private db = Database.getInstance();

  /**
   * Create a new document record
   */
  public async create(data: CreateDocumentRequest, uploadedBy: number): Promise<DocumentRecord> {
    const query = `
      INSERT INTO documents (employee_id, title, description, document_type, file_path, file_name, file_size, uploaded_by, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;

    const result = await this.db.execute(query, [
      data.employee_id,
      data.title,
      data.description || null,
      data.document_type,
      data.file_path,
      data.file_name,
      data.file_size,
      uploadedBy,
    ]);

    return this.findById((result as any).insertId);
  }

  /**
   * Find document by ID
   */
  public async findById(id: number): Promise<DocumentRecord | null> {
    const query = "SELECT * FROM documents WHERE id = ?";
    const results = await this.db.query<DocumentRecord[]>(query, [id]);
    return results.length > 0 ? results[0] : null;
  }

  /**
   * Find all documents for an employee
   */
  public async findByEmployeeId(employeeId: number): Promise<DocumentRecord[]> {
    const query = "SELECT * FROM documents WHERE employee_id = ? ORDER BY created_at DESC";
    return this.db.query<DocumentRecord[]>(query, [employeeId]);
  }

  /**
   * Get all documents with pagination
   */
  public async findAll(limit: number = 50, offset: number = 0): Promise<DocumentRecord[]> {
    const query = "SELECT * FROM documents ORDER BY created_at DESC LIMIT ? OFFSET ?";
    return this.db.query<DocumentRecord[]>(query, [limit, offset]);
  }

  /**
   * Get count of all documents
   */
  public async count(): Promise<number> {
    const query = "SELECT COUNT(*) as total FROM documents";
    const results = await this.db.query<{ total: number }[]>(query, []);
    return results[0].total;
  }

  /**
   * Find documents by type
   */
  public async findByType(documentType: string, limit: number = 50, offset: number = 0): Promise<DocumentRecord[]> {
    const query = "SELECT * FROM documents WHERE document_type = ? ORDER BY created_at DESC LIMIT ? OFFSET ?";
    return this.db.query<DocumentRecord[]>(query, [documentType, limit, offset]);
  }

  /**
   * Find documents by status
   */
  public async findByStatus(status: string, limit: number = 50, offset: number = 0): Promise<DocumentRecord[]> {
    const query = "SELECT * FROM documents WHERE status = ? ORDER BY created_at DESC LIMIT ? OFFSET ?";
    return this.db.query<DocumentRecord[]>(query, [status, limit, offset]);
  }

  /**
   * Update document
   */
  public async update(id: number, data: UpdateDocumentRequest): Promise<DocumentRecord | null> {
    const updates: string[] = [];
    const values: any[] = [];

    if (data.title !== undefined) {
      updates.push("title = ?");
      values.push(data.title);
    }
    if (data.description !== undefined) {
      updates.push("description = ?");
      values.push(data.description);
    }
    if (data.document_type !== undefined) {
      updates.push("document_type = ?");
      values.push(data.document_type);
    }
    if (data.status !== undefined) {
      updates.push("status = ?");
      values.push(data.status);
    }

    if (updates.length === 0) return this.findById(id);

    updates.push("updated_at = NOW()");
    values.push(id);

    const query = `UPDATE documents SET ${updates.join(", ")} WHERE id = ?`;
    await this.db.execute(query, values);

    return this.findById(id);
  }

  /**
   * Delete document
   */
  public async delete(id: number): Promise<boolean> {
    const query = "DELETE FROM documents WHERE id = ?";
    const result = await this.db.execute(query, [id]);
    return (result as any).affectedRows > 0;
  }
}
