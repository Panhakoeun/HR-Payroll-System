/**
 * Employee Routes
 * Defines all API endpoints for Employee entity
 */

import { Router } from "express";
import { EmployeeController } from "../controllers/employeeController";
import { AuthMiddleware } from "../middlewares/AuthMiddleware";

export class EmployeeRoutes {
  public readonly router = Router();
  private readonly employeeController = new EmployeeController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    // Get all employees (paginated, with filters)
    // GET /api/employees?limit=50&offset=0&department=IT&status=active
    this.router.get("/", AuthMiddleware.verifyToken, this.employeeController.listEmployees.bind(this.employeeController));

    // Get employee by ID
    // GET /api/employees/:id
    this.router.get("/:id", AuthMiddleware.verifyToken, this.employeeController.getEmployee.bind(this.employeeController));

    // Get employees by department
    // GET /api/employees/department/:department
    this.router.get(
      "/department/:department",
      AuthMiddleware.verifyToken,
      this.employeeController.getByDepartment.bind(this.employeeController),
    );

    // Get active employees count
    // GET /api/employees/stats/count
    this.router.get(
      "/stats/count",
      AuthMiddleware.verifyToken,
      AuthMiddleware.requireRole("admin"),
      this.employeeController.getActiveCount.bind(this.employeeController),
    );

    // Create new employee (admin only)
    // POST /api/employees
    this.router.post(
      "/",
      AuthMiddleware.verifyToken,
      AuthMiddleware.requireRole("admin"),
      this.employeeController.createEmployee.bind(this.employeeController),
    );

    // Update employee (admin only)
    // PUT /api/employees/:id
    this.router.put(
      "/:id",
      AuthMiddleware.verifyToken,
      AuthMiddleware.requireRole("admin"),
      this.employeeController.updateEmployee.bind(this.employeeController),
    );

    // Delete employee (admin only)
    // DELETE /api/employees/:id
    this.router.delete(
      "/:id",
      AuthMiddleware.verifyToken,
      AuthMiddleware.requireRole("admin"),
      this.employeeController.deleteEmployee.bind(this.employeeController),
    );
  }
}
