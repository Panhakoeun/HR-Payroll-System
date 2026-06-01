/**
 * Document Controller
 * Handles HTTP requests for Document entity
 */

import { Request, Response } from "express";
import { DocumentService } from "../services/DocumentService";
import { HttpResponse } from "../utils/HttpResponse";

export class DocumentController {
  constructor(private readonly documentService = new DocumentService()) {}

  /**
   * GET /api/documents/:id
   * Get document by ID
   */
  public async getDocument(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);

      if (!id || isNaN(id)) {
        HttpResponse.error(res, 400, "Invalid document ID");
        return;
      }

      const document = await this.documentService.getDocumentById(id);

      if (!document) {
        HttpResponse.error(res, 404, "Document not found");
        return;
      }

      res.json({ document });
    } catch (err) {
      console.error("Get document error:", err);
      HttpResponse.error(res, 500, "Server error");
    }
  }

  /**
   * GET /api/documents
   * List all documents with pagination and filters
   */
  public async listDocuments(req: Request, res: Response): Promise<void> {
    try {
      const limit = Number(req.query.limit) || 50;
      const offset = Number(req.query.offset) || 0;
      const type = req.query.type as string | undefined;
      const status = req.query.status as string | undefined;

      const result = await this.documentService.listDocuments(limit, offset, type, status);

      res.json({
        documents: result.documents,
        pagination: {
          total: result.total,
          limit: result.limit,
          offset: result.offset,
        },
      });
    } catch (err) {
      console.error("List documents error:", err);
      HttpResponse.error(res, 500, "Server error");
    }
  }

  /**
   * GET /api/employees/:employeeId/documents
   * Get all documents for an employee
   */
  public async getEmployeeDocuments(req: Request, res: Response): Promise<void> {
    try {
      const employeeId = Number(req.params.employeeId);

      if (!employeeId || isNaN(employeeId)) {
        HttpResponse.error(res, 400, "Invalid employee ID");
        return;
      }

      const documents = await this.documentService.getEmployeeDocuments(employeeId);

      res.json({ documents });
    } catch (err) {
      console.error("Get employee documents error:", err);
      HttpResponse.error(res, 500, "Server error");
    }
  }

  /**
   * POST /api/documents
   * Create new document
   */
  public async createDocument(req: Request, res: Response): Promise<void> {
    try {
      const { employee_id, title, description, document_type, file_path, file_name, file_size } = req.body;

      // Validation
      if (!employee_id || !title || !document_type || !file_path || !file_name) {
        HttpResponse.error(res, 400, "Missing required fields");
        return;
      }

      const userId = (req as any).user?.id;
      if (!userId) {
        HttpResponse.error(res, 401, "Unauthorized");
        return;
      }

      const document = await this.documentService.createDocument(
        {
          employee_id,
          title,
          description,
          document_type,
          file_path,
          file_name,
          file_size,
        },
        userId,
      );

      res.status(201).json({ document, message: "Document created successfully" });
    } catch (err: any) {
      console.error("Create document error:", err);
      HttpResponse.error(res, err.message === "Employee not found" ? 404 : 500, err.message || "Server error");
    }
  }

  /**
   * PUT /api/documents/:id
   * Update document
   */
  public async updateDocument(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);

      if (!id || isNaN(id)) {
        HttpResponse.error(res, 400, "Invalid document ID");
        return;
      }

      const document = await this.documentService.updateDocument(id, req.body);

      if (!document) {
        HttpResponse.error(res, 404, "Document not found");
        return;
      }

      res.json({ document, message: "Document updated successfully" });
    } catch (err) {
      console.error("Update document error:", err);
      HttpResponse.error(res, 500, "Server error");
    }
  }

  /**
   * DELETE /api/documents/:id
   * Delete document
   */
  public async deleteDocument(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);

      if (!id || isNaN(id)) {
        HttpResponse.error(res, 400, "Invalid document ID");
        return;
      }

      const success = await this.documentService.deleteDocument(id);

      if (!success) {
        HttpResponse.error(res, 404, "Document not found");
        return;
      }

      res.json({ message: "Document deleted successfully" });
    } catch (err) {
      console.error("Delete document error:", err);
      HttpResponse.error(res, 500, "Server error");
    }
  }
}
