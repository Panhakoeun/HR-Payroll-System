/**
 * Employee Validation
 * Input validation rules for Employee operations
 */

import { CreateEmployeeRequest, UpdateEmployeeRequest } from "../models/Employee";

export class EmployeeValidation {
  /**
   * Validate create employee request
   */
  public static validateCreateEmployee(
    body: Partial<CreateEmployeeRequest>,
  ): string | null {
    if (!body.first_name || !body.first_name.trim()) {
      return "First name is required";
    }

    if (!body.last_name || !body.last_name.trim()) {
      return "Last name is required";
    }

    if (!body.email || !body.email.trim()) {
      return "Email is required";
    }

    if (!this.isValidEmail(body.email)) {
      return "Invalid email format";
    }

    if (!body.position || !body.position.trim()) {
      return "Position is required";
    }

    if (!body.department || !body.department.trim()) {
      return "Department is required";
    }

    if (!body.salary || body.salary <= 0) {
      return "Salary must be greater than 0";
    }

    if (!body.joining_date) {
      return "Joining date is required";
    }

    if (
      body.employment_type &&
      !this.isValidEmploymentType(body.employment_type)
    ) {
      return "Invalid employment type";
    }

    return null;
  }

  /**
   * Validate update employee request
   */
  public static validateUpdateEmployee(
    body: Partial<UpdateEmployeeRequest>,
  ): string | null {
    if (body.first_name !== undefined && !body.first_name.trim()) {
      return "First name cannot be empty";
    }

    if (body.last_name !== undefined && !body.last_name.trim()) {
      return "Last name cannot be empty";
    }

    if (body.email !== undefined && !body.email.trim()) {
      return "Email cannot be empty";
    }

    if (body.email && !this.isValidEmail(body.email)) {
      return "Invalid email format";
    }

    if (body.position !== undefined && !body.position.trim()) {
      return "Position cannot be empty";
    }

    if (body.department !== undefined && !body.department.trim()) {
      return "Department cannot be empty";
    }

    if (body.salary !== undefined && body.salary <= 0) {
      return "Salary must be greater than 0";
    }

    if (
      body.employment_type &&
      !this.isValidEmploymentType(body.employment_type)
    ) {
      return "Invalid employment type";
    }

    if (body.status && !this.isValidStatus(body.status)) {
      return "Invalid employee status";
    }

    return null;
  }

  private static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private static isValidEmploymentType(type: string): boolean {
    return ["full-time", "part-time", "contract"].includes(type);
  }

  private static isValidStatus(status: string): boolean {
    return ["active", "inactive", "on-leave"].includes(status);
  }
}
