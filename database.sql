-- Run this in MySQL to set up the database

CREATE DATABASE IF NOT EXISTS hr_payroll_db;
USE hr_payroll_db;

CREATE TABLE IF NOT EXISTS users (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(100)        NOT NULL,
  email      VARCHAR(150) UNIQUE NOT NULL,
  password   VARCHAR(255)        NOT NULL,
  role       ENUM('admin','staff') NOT NULL DEFAULT 'staff',
  department VARCHAR(100)         NOT NULL DEFAULT 'General',
  created_at TIMESTAMP           DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS attendance_records (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  user_id         INT NOT NULL,
  attendance_date DATE NOT NULL,
  status          ENUM('present','absent','late','on_leave') NOT NULL,
  note            VARCHAR(255) NULL,
  updated_by      INT NULL,
  updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_user_attendance_date (user_id, attendance_date),
  INDEX idx_attendance_date (attendance_date),
  CONSTRAINT fk_attendance_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_attendance_updated_by FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS leave_requests (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  user_id       INT NOT NULL,
  leave_type    ENUM('annual','sick','personal','unpaid','maternity','paternity') NOT NULL,
  start_date    DATE NOT NULL,
  end_date      DATE NOT NULL,
  total_days    INT NOT NULL,
  reason        VARCHAR(500) NOT NULL,
  status        ENUM('pending','approved','rejected','cancelled') NOT NULL DEFAULT 'pending',
  reviewer_id   INT NULL,
  reviewer_note VARCHAR(500) NULL,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_leave_user_created (user_id, created_at),
  INDEX idx_leave_status_created (status, created_at),
  CONSTRAINT fk_leave_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_leave_reviewer FOREIGN KEY (reviewer_id) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT chk_leave_date_range CHECK (end_date >= start_date),
  CONSTRAINT chk_leave_total_days CHECK (total_days > 0)
);

-- Seed: admin  password = Admin@123
-- Seed: staff  password = Staff@123
-- (bcrypt hashes generated with saltRounds=10)
INSERT INTO users (name, email, password, role, department) VALUES
  ('Admin User',  'admin@hrpayroll.com', '$2a$10$LCsTsOacvi4HSSsa/KDFreSU1pMBS4Y2SrYNcFUW8X8ClqbMepJl2', 'admin', 'HR'),
  ('Staff User',  'staff@hrpayroll.com', '$2a$10$9jMV9gJ.2935zC.Ed.naOudF3j58m6PyT83L86zhi6DGrT9CNaZ4u', 'staff', 'Operations')
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  password = VALUES(password),
  role = VALUES(role),
  department = VALUES(department);
