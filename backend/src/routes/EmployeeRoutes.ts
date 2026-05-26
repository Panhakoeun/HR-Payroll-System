/**
 * Employee Routes
 * Defines all API endpoints for Employee entity
 */

import { Router } from "express";
import { EmployeeController } from "../controllers/EmployeeController";
import { AuthMiddleware } from "../middlewares/AuthMiddleware";

export class EmployeeRoutes {
  public readonly router = Router();
  private readonly employeeController = new EmployeeController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get(
      "/",
      AuthMiddleware.verifyToken,
      this.employeeController.listEmployees.bind(this.employeeController),
    );

    this.router.get(
      "/:id",
      AuthMiddleware.verifyToken,
      this.employeeController.getEmployee.bind(this.employeeController),
    );

    this.router.get(
      "/department/:department",
      AuthMiddleware.verifyToken,
      this.employeeController.getByDepartment.bind(this.employeeController),
    );

    this.router.get(
      "/stats/count",
      AuthMiddleware.verifyToken,
      AuthMiddleware.requireRole("admin"),
      this.employeeController.getActiveCount.bind(this.employeeController),
    );

    this.router.post(
      "/",
      AuthMiddleware.verifyToken,
      AuthMiddleware.requireRole("admin"),
      this.employeeController.createEmployee.bind(this.employeeController),
    );

    this.router.put(
      "/:id",
      AuthMiddleware.verifyToken,
      AuthMiddleware.requireRole("admin"),
      this.employeeController.updateEmployee.bind(this.employeeController),
    );

    this.router.delete(
      "/:id",
      AuthMiddleware.verifyToken,
      AuthMiddleware.requireRole("admin"),
      this.employeeController.deleteEmployee.bind(this.employeeController),
    );
  }
}

