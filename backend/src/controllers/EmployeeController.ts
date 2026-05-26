/**
 * Employee Controller
 * Handles HTTP requests for Employee entity
 */

import { Request, Response } from "express";
import { EmployeeService } from "../services/EmployeeService";
import { CreateEmployeeRequest, UpdateEmployeeRequest } from "../models/Employee";
import { HttpResponse } from "../utils/HttpResponse";

export class EmployeeController {
  constructor(private readonly employeeService = new EmployeeService()) {}

  /**
   * GET /api/employees/:id
   * Get employee by ID
   */
  public async getEmployee(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);

      if (!id || isNaN(id)) {
        HttpResponse.error(res, 400, "Invalid employee ID");
        return;
      }

      const employee = await this.employeeService.getEmployeeById(id);

      if (!employee) {
        HttpResponse.error(res, 404, "Employee not found");
        return;
      }

      res.json({ employee });
    } catch (err) {
      console.error("Get employee error:", err);
      HttpResponse.error(res, 500, "Server error");
    }
  }

  /**
   * GET /api/employees
   * List all employees with pagination and filters
   */
  public async listEmployees(req: Request, res: Response): Promise<void> {
    try {
      const limit = Number(req.query.limit) || 50;
      const offset = Number(req.query.offset) || 0;
      const department = req.query.department as string | undefined;
      const status = req.query.status as string | undefined;

      const result = await this.employeeService.listEmployees({
        department,
        status,
        limit,
        offset,
      });

      res.json({
        employees: result.employees,
        pagination: {
          total: result.total,
          limit,
          offset,
          pages: Math.ceil(result.total / limit),
        },
      });
    } catch (err) {
      console.error("List employees error:", err);
      HttpResponse.error(res, 500, "Server error");
    }
  }

  /**
   * POST /api/employees
   * Create new employee
   */
  public async createEmployee(req: Request, res: Response): Promise<void> {
    try {
      const data = req.body as CreateEmployeeRequest;

      if (
        !data.first_name ||
        !data.last_name ||
        !data.email ||
        !data.position ||
        !data.department
      ) {
        HttpResponse.error(res, 400, "Missing required fields");
        return;
      }

      if (!data.salary || data.salary <= 0) {
        HttpResponse.error(res, 400, "Invalid salary");
        return;
      }

      if (!data.joining_date) {
        HttpResponse.error(res, 400, "Joining date is required");
        return;
      }

      if (!this.isValidEmail(data.email)) {
        HttpResponse.error(res, 400, "Invalid email format");
        return;
      }

      const employee = await this.employeeService.createEmployee(data);
      res.status(201).json({ employee });
    } catch (err) {
      if (err instanceof Error && err.message.includes("email already exists")) {
        HttpResponse.error(res, 409, err.message);
        return;
      }
      console.error("Create employee error:", err);
      HttpResponse.error(res, 500, "Server error");
    }
  }

  /**
   * PUT /api/employees/:id
   * Update employee
   */
  public async updateEmployee(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);

      if (!id || isNaN(id)) {
        HttpResponse.error(res, 400, "Invalid employee ID");
        return;
      }

      const data = req.body as UpdateEmployeeRequest;

      if (data.email && !this.isValidEmail(data.email)) {
        HttpResponse.error(res, 400, "Invalid email format");
        return;
      }

      if (data.salary !== undefined && data.salary <= 0) {
        HttpResponse.error(res, 400, "Invalid salary");
        return;
      }

      const employee = await this.employeeService.updateEmployee(id, data);
      res.json({ employee });
    } catch (err) {
      if (err instanceof Error && err.message === "Employee not found") {
        HttpResponse.error(res, 404, "Employee not found");
        return;
      }
      if (err instanceof Error && err.message.includes("Email already in use")) {
        HttpResponse.error(res, 409, err.message);
        return;
      }
      console.error("Update employee error:", err);
      HttpResponse.error(res, 500, "Server error");
    }
  }

  /**
   * DELETE /api/employees/:id
   * Delete employee (soft delete)
   */
  public async deleteEmployee(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);

      if (!id || isNaN(id)) {
        HttpResponse.error(res, 400, "Invalid employee ID");
        return;
      }

      await this.employeeService.deleteEmployee(id);
      res.json({ message: "Employee deleted successfully" });
    } catch (err) {
      if (err instanceof Error && err.message === "Employee not found") {
        HttpResponse.error(res, 404, "Employee not found");
        return;
      }
      console.error("Delete employee error:", err);
      HttpResponse.error(res, 500, "Server error");
    }
  }

  /**
   * GET /api/employees/department/:department
   * Get employees by department
   */
  public async getByDepartment(req: Request, res: Response): Promise<void> {
    try {
      const department = req.params.department as string;
      const limit = Number(req.query.limit) || 50;
      const offset = Number(req.query.offset) || 0;

      if (!department) {
        HttpResponse.error(res, 400, "Department is required");
        return;
      }

      const result = await this.employeeService.getEmployeesByDepartment(
        department,
        limit,
        offset,
      );

      res.json({
        employees: result.employees,
        pagination: {
          total: result.total,
          limit,
          offset,
          pages: Math.ceil(result.total / limit),
        },
      });
    } catch (err) {
      console.error("Get by department error:", err);
      HttpResponse.error(res, 500, "Server error");
    }
  }

  /**
   * GET /api/employees/stats/count
   * Get total active employees count
   */
  public async getActiveCount(req: Request, res: Response): Promise<void> {
    try {
      const count = await this.employeeService.getActiveEmployeesCount();
      res.json({ count });
    } catch (err) {
      console.error("Get active count error:", err);
      HttpResponse.error(res, 500, "Server error");
    }
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

