/**
 * Document Service
 * Business logic layer for Document operations
 */

import { DocumentRepository } from "../repositories/DocumentRepository";
import { EmployeeRepository } from "../repositories/employeeRepositories";
import {
  CreateDocumentRequest,
  UpdateDocumentRequest,
  DocumentResponse,
  DocumentDetailResponse,
  Document,
} from "../models/Document";

export class DocumentService {
  constructor(
    private readonly documentRepository = new DocumentRepository(),
    private readonly employeeRepository = new EmployeeRepository(),
  ) {}

  /**
   * Get document by ID with employee details
   */
  public async getDocumentById(id: number): Promise<DocumentDetailResponse | null> {
    const record = await this.documentRepository.findById(id);
    if (!record) return null;

    const employee = await this.employeeRepository.findById(record.employee_id);
    const employeeName = employee ? `${employee.first_name} ${employee.last_name}` : "Unknown";

    return new Document(record).toDetailResponse(employeeName);
  }

  /**
   * Get all documents for an employee
   */
  public async getEmployeeDocuments(employeeId: number): Promise<DocumentResponse[]> {
    const records = await this.documentRepository.findByEmployeeId(employeeId);
    return records.map((record) => new Document(record).toResponse());
  }

  /**
   * List all documents with pagination and filters
   */
  public async listDocuments(
    limit: number = 50,
    offset: number = 0,
    type?: string,
    status?: string,
  ): Promise<{
    documents: DocumentResponse[];
    total: number;
    limit: number;
    offset: number;
  }> {
    let records;

    if (type) {
      records = await this.documentRepository.findByType(type, limit, offset);
    } else if (status) {
      records = await this.documentRepository.findByStatus(status, limit, offset);
    } else {
      records = await this.documentRepository.findAll(limit, offset);
    }

    const total = await this.documentRepository.count();

    return {
      documents: records.map((record) => new Document(record).toResponse()),
      total,
      limit,
      offset,
    };
  }

  /**
   * Create new document
   */
  public async createDocument(data: CreateDocumentRequest, uploadedBy: number): Promise<DocumentResponse> {
    const employee = await this.employeeRepository.findById(data.employee_id);
    if (!employee) {
      throw new Error("Employee not found");
    }

    const record = await this.documentRepository.create(data, uploadedBy);
    return new Document(record).toResponse();
  }

  /**
   * Update document
   */
  public async updateDocument(id: number, data: UpdateDocumentRequest): Promise<DocumentResponse | null> {
    const record = await this.documentRepository.update(id, data);
    if (!record) return null;
    return new Document(record).toResponse();
  }

  /**
   * Delete document
   */
  public async deleteDocument(id: number): Promise<boolean> {
    return this.documentRepository.delete(id);
  }
}
