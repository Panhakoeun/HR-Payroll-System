/**
 * Employee Module - Models and Interfaces
 * Defines all types and interfaces for the Employee entity
 */

export type EmploymentType = "full-time" | "part-time" | "contract";
export type EmployeeStatus = "active" | "inactive" | "on-leave";
export type Gender = "male" | "female" | "other";

// ========== Database Record Interface ==========
export interface EmployeeRecord {
  id: number;
  user_id: number | null;
  employee_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  date_of_birth: Date | null;
  gender: Gender | null;
  address: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  country: string | null;
  position: string;
  department: string;
  employment_type: EmploymentType;
  salary: number;
  joining_date: Date;
  status: EmployeeStatus;
  created_at: Date;
  updated_at: Date;
}

// ========== Request DTOs (Data Transfer Objects) ==========
export interface CreateEmployeeRequest {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  date_of_birth?: Date;
  gender?: Gender;
  address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  position: string;
  department: string;
  employment_type: EmploymentType;
  salary: number;
  joining_date: Date;
}

export interface UpdateEmployeeRequest {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  date_of_birth?: Date;
  gender?: Gender;
  address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  position?: string;
  department?: string;
  employment_type?: EmploymentType;
  salary?: number;
  status?: EmployeeStatus;
}

// ========== Response DTOs ==========
export interface EmployeeResponse {
  id: number;
  employee_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  position: string;
  department: string;
  salary: number;
  status: EmployeeStatus;
  joining_date: Date;
}

export interface EmployeeDetailResponse extends EmployeeResponse {
  date_of_birth: Date | null;
  gender: Gender | null;
  address: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  country: string | null;
  employment_type: EmploymentType;
  created_at: Date;
  updated_at: Date;
}

// ========== Class Definition ==========
export class Employee {
  constructor(private readonly record: EmployeeRecord) {}

  /**
   * Convert database record to public response format (list view)
   */
  public toResponse(): EmployeeResponse {
    return {
      id: this.record.id,
      employee_id: this.record.employee_id,
      first_name: this.record.first_name,
      last_name: this.record.last_name,
      email: this.record.email,
      phone: this.record.phone,
      position: this.record.position,
      department: this.record.department,
      salary: this.record.salary,
      status: this.record.status,
      joining_date: this.record.joining_date,
    };
  }

  /**
   * Convert database record to detailed response format (detail view)
   */
  public toDetailResponse(): EmployeeDetailResponse {
    return {
      ...this.toResponse(),
      date_of_birth: this.record.date_of_birth,
      gender: this.record.gender,
      address: this.record.address,
      city: this.record.city,
      state: this.record.state,
      postal_code: this.record.postal_code,
      country: this.record.country,
      employment_type: this.record.employment_type,
      created_at: this.record.created_at,
      updated_at: this.record.updated_at,
    };
  }

  /**
   * Get full name
   */
  public getFullName(): string {
    return `${this.record.first_name} ${this.record.last_name}`;
  }

  /**
   * Check if employee is active
   */
  public isActive(): boolean {
    return this.record.status === "active";
  }
}

