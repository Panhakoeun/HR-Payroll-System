-- Run this in MySQL to set up the database
-- HR & Payroll System Database Schema

CREATE DATABASE IF NOT EXISTS hr_payroll_db;
USE hr_payroll_db;

-- ========== Users Table ==========
CREATE TABLE IF NOT EXISTS users (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(100)        NOT NULL,
  email      VARCHAR(150) UNIQUE NOT NULL,
  password   VARCHAR(255)        NOT NULL,
  role       ENUM('admin','staff') NOT NULL DEFAULT 'staff',
  created_at TIMESTAMP           DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP           DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========== Employees Table ==========
CREATE TABLE IF NOT EXISTS employees (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  user_id         INT UNIQUE,
  employee_id     VARCHAR(20) UNIQUE NOT NULL,
  first_name      VARCHAR(100) NOT NULL,
  last_name       VARCHAR(100) NOT NULL,
  email           VARCHAR(150) NOT NULL,
  phone           VARCHAR(20),
  date_of_birth   DATE,
  gender          ENUM('male', 'female', 'other'),
  address         VARCHAR(255),
  city            VARCHAR(100),
  state           VARCHAR(100),
  postal_code     VARCHAR(10),
  country         VARCHAR(100),
  position        VARCHAR(100) NOT NULL,
  department      VARCHAR(100) NOT NULL,
  employment_type ENUM('full-time', 'part-time', 'contract') DEFAULT 'full-time',
  salary          DECIMAL(12, 2) NOT NULL,
  joining_date    DATE NOT NULL,
  status          ENUM('active', 'inactive', 'on-leave') DEFAULT 'active',
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_department (department),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========== Attendance Table ==========
CREATE TABLE IF NOT EXISTS attendance (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  employee_id   INT NOT NULL,
  attendance_date DATE NOT NULL,
  check_in_time TIME,
  check_out_time TIME,
  status        ENUM('present', 'absent', 'late', 'half-day') DEFAULT 'absent',
  remarks       TEXT,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  UNIQUE KEY unique_employee_date (employee_id, attendance_date),
  INDEX idx_date (attendance_date),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========== Payroll Settings Table ==========
CREATE TABLE IF NOT EXISTS payroll_settings (
  id                    INT AUTO_INCREMENT PRIMARY KEY,
  employee_id           INT NOT NULL,
  base_salary           DECIMAL(12, 2) NOT NULL,
  housing_allowance     DECIMAL(12, 2) DEFAULT 0,
  transport_allowance   DECIMAL(12, 2) DEFAULT 0,
  other_allowances      DECIMAL(12, 2) DEFAULT 0,
  deduction_per_absent_day   DECIMAL(12, 2) DEFAULT 0,
  deduction_per_late_day     DECIMAL(12, 2) DEFAULT 0,
  deduction_per_half_day     DECIMAL(12, 2) DEFAULT 0,
  created_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  UNIQUE KEY unique_employee_settings (employee_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========== Payroll Table ==========
CREATE TABLE IF NOT EXISTS payroll (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  employee_id     INT NOT NULL,
  pay_period_start DATE NOT NULL,
  pay_period_end  DATE NOT NULL,
  basic_salary    DECIMAL(12, 2) NOT NULL,
  allowances      DECIMAL(12, 2) DEFAULT 0,
  deductions      DECIMAL(12, 2) DEFAULT 0,
  gross_salary    DECIMAL(12, 2) NOT NULL,
  net_salary      DECIMAL(12, 2) NOT NULL,
  status          ENUM('pending', 'approved', 'processed', 'paid') DEFAULT 'pending',
  payment_date    DATE,
  remarks         TEXT,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  UNIQUE KEY unique_employee_period (employee_id, pay_period_start, pay_period_end),
  INDEX idx_status (status),
  INDEX idx_period (pay_period_start, pay_period_end)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========== Payslips Table ==========
CREATE TABLE IF NOT EXISTS payslips (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  payroll_id      INT NOT NULL,
  employee_id     INT NOT NULL,
  pay_period_start DATE NOT NULL,
  pay_period_end  DATE NOT NULL,
  basic_salary    DECIMAL(12, 2) NOT NULL,
  allowances      DECIMAL(12, 2) DEFAULT 0,
  deductions      DECIMAL(12, 2) DEFAULT 0,
  gross_salary    DECIMAL(12, 2) NOT NULL,
  net_salary      DECIMAL(12, 2) NOT NULL,
  status          ENUM('draft', 'generated', 'sent', 'viewed') DEFAULT 'draft',
  generated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (payroll_id) REFERENCES payroll(id) ON DELETE CASCADE,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  INDEX idx_employee (employee_id),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========== Leave Requests Table ==========
CREATE TABLE IF NOT EXISTS leave_requests (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  employee_id     INT NOT NULL,
  start_date      DATE NOT NULL,
  end_date        DATE NOT NULL,
  leave_type      ENUM('annual', 'sick', 'unpaid', 'maternity') DEFAULT 'annual',
  reason          TEXT,
  status          ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  approved_by     INT,
  approval_date   DATETIME,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_employee (employee_id),
  INDEX idx_status (status),
  INDEX idx_dates (start_date, end_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========== Seed Data ==========
-- Users: admin password = Admin@123, staff password = Staff@123 (bcrypt with saltRounds=10)
INSERT INTO users (name, email, password, role) VALUES
  ('Admin User',  'admin@hrpayroll.com', '$2a$10$LCsTsOacvi4HSSsa/KDFreSU1pMBS4Y2SrYNcFUW8X8ClqbMepJl2', 'admin'),
  ('Staff User',  'staff@hrpayroll.com', '$2a$10$9jMV9gJ.2935zC.Ed.naOudF3j58m6PyT83L86zhi6DGrT9CNaZ4u', 'staff')
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  password = VALUES(password),
  role = VALUES(role);

-- Sample Employees
INSERT INTO employees (user_id, employee_id, first_name, last_name, email, phone, date_of_birth, gender, address, city, state, postal_code, country, position, department, employment_type, salary, joining_date, status)
VALUES
  (2, 'EMP001', 'John', 'Doe', 'john.doe@company.com', '555-1234', '1990-05-15', 'male', '123 Main St', 'New York', 'NY', '10001', 'USA', 'Software Engineer', 'IT', 'full-time', 60000.00, '2022-01-15', 'active'),
  (NULL, 'EMP002', 'Jane', 'Smith', 'jane.smith@company.com', '555-5678', '1992-08-22', 'female', '456 Oak Ave', 'Boston', 'MA', '02101', 'USA', 'HR Manager', 'Human Resources', 'full-time', 55000.00, '2021-03-20', 'active'),
  (NULL, 'EMP003', 'Robert', 'Johnson', 'robert.j@company.com', '555-9101', '1988-12-10', 'male', '789 Pine Rd', 'Chicago', 'IL', '60601', 'USA', 'Financial Analyst', 'Finance', 'full-time', 52000.00, '2020-06-01', 'active')
ON DUPLICATE KEY UPDATE
  first_name = VALUES(first_name),
  email = VALUES(email),
  position = VALUES(position);

-- Sample Leave Requests (for testing)
INSERT INTO leave_requests (employee_id, start_date, end_date, leave_type, reason, status, approved_by) VALUES
  (2, '2026-06-01', '2026-06-05', 'annual', 'Summer vacation', 'pending', NULL),
  (3, '2026-05-27', '2026-05-28', 'sick', 'Medical appointment', 'approved', 1),
  (2, '2026-05-20', '2026-05-22', 'annual', 'Family visit', 'approved', 1)
ON DUPLICATE KEY UPDATE
  status = VALUES(status);

-- Sample Attendance Records (May 2026)
INSERT INTO attendance (employee_id, attendance_date, check_in_time, check_out_time, status, remarks) VALUES
  (2, '2026-05-20', '09:00:00', '17:30:00', 'present', NULL),
  (2, '2026-05-21', '09:15:00', '17:45:00', 'late', 'Traffic delay'),
  (2, '2026-05-22', NULL, NULL, 'absent', 'Leave'),
  (2, '2026-05-23', '09:00:00', '17:30:00', 'present', NULL),
  (2, '2026-05-24', '09:00:00', '17:30:00', 'present', NULL),
  (3, '2026-05-20', '08:45:00', '17:30:00', 'present', NULL),
  (3, '2026-05-21', '09:30:00', '17:45:00', 'late', 'Doctor appointment'),
  (3, '2026-05-22', '08:45:00', '17:30:00', 'present', NULL),
  (3, '2026-05-23', NULL, NULL, 'absent', 'Sick leave'),
  (3, '2026-05-24', '09:00:00', '17:30:00', 'present', NULL)
ON DUPLICATE KEY UPDATE
  status = VALUES(status);

-- Sample Payroll Data (May 2026)
INSERT INTO payroll (employee_id, pay_period_start, pay_period_end, basic_salary, allowances, deductions, gross_salary, net_salary, status, payment_date) VALUES
  (2, '2026-05-01', '2026-05-31', 55000.00, 5500.00, 1000.00, 60500.00, 59500.00, 'paid', '2026-05-31'),
  (3, '2026-05-01', '2026-05-31', 52000.00, 5200.00, 1500.00, 57200.00, 55700.00, 'paid', '2026-05-31')
ON DUPLICATE KEY UPDATE
  net_salary = VALUES(net_salary);

-- Sample Payslips (May 2026)
INSERT INTO payslips (payroll_id, employee_id, pay_period_start, pay_period_end, basic_salary, allowances, deductions, gross_salary, net_salary, status) VALUES
  (1, 2, '2026-05-01', '2026-05-31', 55000.00, 5500.00, 1000.00, 60500.00, 59500.00, 'generated'),
  (2, 3, '2026-05-01', '2026-05-31', 52000.00, 5200.00, 1500.00, 57200.00, 55700.00, 'sent')
ON DUPLICATE KEY UPDATE
  status = VALUES(status);
