/**
 * Employee Repository
 * Handles all database operations for the Employee entity
 */

import { RowDataPacket, ResultSetHeader } from "mysql2";
import { Database } from "../database/Database";
import {
  EmployeeRecord,
  CreateEmployeeRequest,
  UpdateEmployeeRequest,
} from "../models/Employee";

export class EmployeeRepository {
  private readonly db = Database.getInstance();

  /**
   * Find employee by ID
   */
  public async findById(id: number): Promise<EmployeeRecord | null> {
    const rows = await this.db.query<RowDataPacket[]>(
      `SELECT e.id, e.user_id, u.login_password, e.employee_id, e.first_name, e.last_name, e.email, e.phone,
              date_of_birth, gender, address, city, state, postal_code, country,
              position, department, employment_type, salary, joining_date, status,
              e.created_at, e.updated_at
       FROM employees e LEFT JOIN users u ON u.id = e.user_id WHERE e.id = ?`,
      [id],
    );
    return rows.length > 0 ? (rows[0] as EmployeeRecord) : null;
  }

  /**
   * Find employee by linked user_id
   */
  public async findByUserId(userId: number): Promise<EmployeeRecord | null> {
    const rows = await this.db.query<RowDataPacket[]>(
      `SELECT e.id, e.user_id, u.login_password, e.employee_id, e.first_name, e.last_name, e.email, e.phone,
              date_of_birth, gender, address, city, state, postal_code, country,
              position, department, employment_type, salary, joining_date, status,
              e.created_at, e.updated_at
       FROM employees e LEFT JOIN users u ON u.id = e.user_id WHERE e.user_id = ?`,
      [userId],
    );
    return rows.length > 0 ? (rows[0] as EmployeeRecord) : null;
  }

  /**
   * Find employee by employee_id (unique identifier)
   */
  public async findByEmployeeId(employeeId: string): Promise<EmployeeRecord | null> {
    const rows = await this.db.query<RowDataPacket[]>(
      `SELECT e.id, e.user_id, u.login_password, e.employee_id, e.first_name, e.last_name, e.email, e.phone,
              date_of_birth, gender, address, city, state, postal_code, country,
              position, department, employment_type, salary, joining_date, status,
              e.created_at, e.updated_at
       FROM employees e LEFT JOIN users u ON u.id = e.user_id WHERE e.employee_id = ?`,
      [employeeId],
    );
    return rows.length > 0 ? (rows[0] as EmployeeRecord) : null;
  }

  /**
   * Find employee by email
   */
  public async findByEmail(email: string): Promise<EmployeeRecord | null> {
    const rows = await this.db.query<RowDataPacket[]>(
      `SELECT e.id, e.user_id, u.login_password, e.employee_id, e.first_name, e.last_name, e.email, e.phone,
              date_of_birth, gender, address, city, state, postal_code, country,
              position, department, employment_type, salary, joining_date, status,
              e.created_at, e.updated_at
       FROM employees e LEFT JOIN users u ON u.id = e.user_id WHERE e.email = ?`,
      [email],
    );
    return rows.length > 0 ? (rows[0] as EmployeeRecord) : null;
  }

  /**
   * Find all employees with optional filters
   */
  public async findAll(
    department?: string,
    status?: string,
    limit: number = 50,
    offset: number = 0,
  ): Promise<EmployeeRecord[]> {
    let query = `SELECT e.id, e.user_id, u.login_password, e.employee_id, e.first_name, e.last_name, e.email, e.phone,
                        date_of_birth, gender, address, city, state, postal_code, country,
                        position, department, employment_type, salary, joining_date, status,
                        e.created_at, e.updated_at
                 FROM employees e LEFT JOIN users u ON u.id = e.user_id WHERE 1=1`;
    const params: (string | number)[] = [];

    if (department) {
      query += ` AND e.department = ?`;
      params.push(department);
    }

    if (status) {
      query += ` AND e.status = ?`;
      params.push(status);
    }

    query += ` ORDER BY e.joining_date DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    return await this.db.query<RowDataPacket[]>(query, params) as EmployeeRecord[];
  }

  /**
   * Count total employees
   */
  public async count(department?: string, status?: string): Promise<number> {
    let query = "SELECT COUNT(*) as count FROM employees WHERE 1=1";
    const params: (string | number)[] = [];

    if (department) {
      query += ` AND department = ?`;
      params.push(department);
    }

    if (status) {
      query += ` AND status = ?`;
      params.push(status);
    }

    const rows = await this.db.query<RowDataPacket[]>(query, params);
    return (rows[0] as any).count || 0;
  }

  /**
   * Create new employee
   */
  public async create(data: CreateEmployeeRequest): Promise<number> {
    const employeeId = await this.generateEmployeeId();
    const result = await this.db.execute(
      `INSERT INTO employees 
       (employee_id, first_name, last_name, email, phone, date_of_birth, gender,
        address, city, state, postal_code, country, position, department,
        employment_type, salary, joining_date, status, user_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        employeeId,
        data.first_name,
        data.last_name,
        data.email.toLowerCase().trim(),
        data.phone || null,
        data.date_of_birth || null,
        data.gender || null,
        data.address || null,
        data.city || null,
        data.state || null,
        data.postal_code || null,
        data.country || null,
        data.position,
        data.department,
        data.employment_type,
        data.salary,
        data.joining_date,
        "active",
        data.user_id || null,
      ],
    );

    return result.insertId;
  }

  /**
   * Update existing employee
   */
  public async update(id: number, data: UpdateEmployeeRequest): Promise<boolean> {
    const fields: string[] = [];
    const params: any[] = [];

    // Build dynamic update query
    if (data.first_name !== undefined) {
      fields.push("first_name = ?");
      params.push(data.first_name);
    }
    if (data.last_name !== undefined) {
      fields.push("last_name = ?");
      params.push(data.last_name);
    }
    if (data.email !== undefined) {
      fields.push("email = ?");
      params.push(data.email.toLowerCase().trim());
    }
    if (data.phone !== undefined) {
      fields.push("phone = ?");
      params.push(data.phone || null);
    }
    if (data.date_of_birth !== undefined) {
      fields.push("date_of_birth = ?");
      params.push(data.date_of_birth || null);
    }
    if (data.gender !== undefined) {
      fields.push("gender = ?");
      params.push(data.gender || null);
    }
    if (data.address !== undefined) {
      fields.push("address = ?");
      params.push(data.address || null);
    }
    if (data.city !== undefined) {
      fields.push("city = ?");
      params.push(data.city || null);
    }
    if (data.state !== undefined) {
      fields.push("state = ?");
      params.push(data.state || null);
    }
    if (data.postal_code !== undefined) {
      fields.push("postal_code = ?");
      params.push(data.postal_code || null);
    }
    if (data.country !== undefined) {
      fields.push("country = ?");
      params.push(data.country || null);
    }
    if (data.position !== undefined) {
      fields.push("position = ?");
      params.push(data.position);
    }
    if (data.department !== undefined) {
      fields.push("department = ?");
      params.push(data.department);
    }
    if (data.employment_type !== undefined) {
      fields.push("employment_type = ?");
      params.push(data.employment_type);
    }
    if (data.salary !== undefined) {
      fields.push("salary = ?");
      params.push(data.salary);
    }
    if (data.status !== undefined) {
      fields.push("status = ?");
      params.push(data.status);
    }

    if (fields.length === 0) {
      return false; // No fields to update
    }

    params.push(id);
    const query = `UPDATE employees SET ${fields.join(", ")} WHERE id = ?`;

    const result = await this.db.execute(query, params);
    return result.affectedRows > 0;
  }

  /**
   * Delete employee (soft delete - set status to inactive)
   */
  public async delete(id: number): Promise<boolean> {
    const result = await this.db.execute(
      "UPDATE employees SET status = ? WHERE id = ?",
      ["inactive", id],
    );
    return result.affectedRows > 0;
  }

  /**
   * Generate unique employee ID
   * Format: EMP + 6 digit number (e.g., EMP000001)
   */
  private async generateEmployeeId(): Promise<string> {
    const result = await this.db.query<RowDataPacket[]>(
      "SELECT MAX(CAST(SUBSTRING(employee_id, 4) AS UNSIGNED)) as max_id FROM employees",
    );

    const maxId = result[0]?.max_id || 0;
    const newId = maxId + 1;
    return `EMP${String(newId).padStart(6, "0")}`;
  }
}
