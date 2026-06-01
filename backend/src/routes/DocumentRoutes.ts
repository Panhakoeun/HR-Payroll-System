/**
 * Document Routes
 * Express routes for Document API endpoints
 */

import { Router } from "express";
import { DocumentController } from "../controllers/DocumentController";
import { AuthMiddleware } from "../middlewares/AuthMiddleware";

export class DocumentRoutes {
  public readonly router = Router();
  private readonly controller: DocumentController;

  constructor() {
    this.controller = new DocumentController();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    /**
     * Document endpoints - all require authentication
     */
    this.router.get(
      "/",
      AuthMiddleware.verifyToken,
      this.controller.listDocuments.bind(this.controller),
    );

    this.router.post(
      "/",
      AuthMiddleware.verifyToken,
      this.controller.createDocument.bind(this.controller),
    );

    this.router.get(
      "/:id",
      AuthMiddleware.verifyToken,
      this.controller.getDocument.bind(this.controller),
    );

    this.router.put(
      "/:id",
      AuthMiddleware.verifyToken,
      this.controller.updateDocument.bind(this.controller),
    );

    this.router.delete(
      "/:id",
      AuthMiddleware.verifyToken,
      this.controller.deleteDocument.bind(this.controller),
    );

    /**
     * Employee documents endpoint
     */
    this.router.get(
      "/employee/:employeeId",
      AuthMiddleware.verifyToken,
      this.controller.getEmployeeDocuments.bind(this.controller),
    );
  }
}

