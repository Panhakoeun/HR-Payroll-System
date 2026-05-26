/**
 * Employee Service
 * Business logic layer for Employee operations
 */

import { EmployeeRepository } from "../repositories/employeeRepositories";
import {
  CreateEmployeeRequest,
  UpdateEmployeeRequest,
  EmployeeResponse,
  EmployeeDetailResponse,
  Employee,
} from "../models/Employee";

export class EmployeeService {
  constructor(private readonly employeeRepository = new EmployeeRepository()) {}

  /**
   * Get employee by ID
   */
  public async getEmployeeById(
    id: number,
  ): Promise<EmployeeDetailResponse | null> {
    const record = await this.employeeRepository.findById(id);
    if (!record) return null;
    return new Employee(record).toDetailResponse();
  }

  /**
   * Get employee by employee_id
   */
  public async getEmployeeByEmployeeId(
    employeeId: string,
  ): Promise<EmployeeDetailResponse | null> {
    const record = await this.employeeRepository.findByEmployeeId(employeeId);
    if (!record) return null;
    return new Employee(record).toDetailResponse();
  }

  /**
   * Get all employees with pagination and filters
   */
  public async listEmployees(filters?: {
    department?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ employees: EmployeeResponse[]; total: number }> {
    const limit = filters?.limit || 50;
    const offset = filters?.offset || 0;

    const [records, total] = await Promise.all([
      this.employeeRepository.findAll(
        filters?.department,
        filters?.status,
        limit,
        offset,
      ),
      this.employeeRepository.count(filters?.department, filters?.status),
    ]);

    return {
      employees: records.map((r) => new Employee(r).toResponse()),
      total,
    };
  }

  /**
   * Create new employee
   */
  public async createEmployee(
    data: CreateEmployeeRequest,
  ): Promise<EmployeeDetailResponse> {
    const existingEmployee = await this.employeeRepository.findByEmail(data.email);
    if (existingEmployee) {
      throw new Error("Employee with this email already exists");
    }

    const employeeId = await this.employeeRepository.create(data);

    const record = await this.employeeRepository.findById(employeeId);
    if (!record) {
      throw new Error("Failed to create employee");
    }

    return new Employee(record).toDetailResponse();
  }

  /**
   * Update employee
   */
  public async updateEmployee(
    id: number,
    data: UpdateEmployeeRequest,
  ): Promise<EmployeeDetailResponse> {
    const employee = await this.employeeRepository.findById(id);
    if (!employee) {
      throw new Error("Employee not found");
    }

    if (data.email) {
      const existingEmployee = await this.employeeRepository.findByEmail(data.email);
      if (existingEmployee && existingEmployee.id !== id) {
        throw new Error("Email already in use by another employee");
      }
    }

    const updated = await this.employeeRepository.update(id, data);
    if (!updated) {
      throw new Error("Failed to update employee");
    }

    const record = await this.employeeRepository.findById(id);
    if (!record) {
      throw new Error("Failed to fetch updated employee");
    }

    return new Employee(record).toDetailResponse();
  }

  /**
   * Delete employee (soft delete)
   */
  public async deleteEmployee(id: number): Promise<void> {
    const employee = await this.employeeRepository.findById(id);
    if (!employee) {
      throw new Error("Employee not found");
    }

    const deleted = await this.employeeRepository.delete(id);
    if (!deleted) {
      throw new Error("Failed to delete employee");
    }
  }

  /**
   * Get employees by department
   */
  public async getEmployeesByDepartment(
    department: string,
    limit: number = 50,
    offset: number = 0,
  ): Promise<{ employees: EmployeeResponse[]; total: number }> {
    const [records, total] = await Promise.all([
      this.employeeRepository.findAll(department, "active", limit, offset),
      this.employeeRepository.count(department, "active"),
    ]);

    return {
      employees: records.map((r) => new Employee(r).toResponse()),
      total,
    };
  }

  public async getActiveEmployeesCount(): Promise<number> {
    return this.employeeRepository.count(undefined, "active");
  }

  public async emailExists(email: string, excludeId?: number): Promise<boolean> {
    const employee = await this.employeeRepository.findByEmail(email);
    if (!employee) return false;
    if (excludeId && employee.id === excludeId) return false;
    return true;
  }
}

