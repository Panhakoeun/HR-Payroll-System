# 🧪 API Testing Guide

This guide provides curl examples for testing all API endpoints.

## 📌 Setup

### 1. Start Server
```bash
npm run dev
```

### 2. Get Authentication Token
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@hrpayroll.com",
    "password": "Admin@123"
  }'
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "name": "Admin User",
    "email": "admin@hrpayroll.com",
    "role": "admin"
  }
}
```

### 3. Use Token in Headers
Replace `<token>` with the actual token from login response.

---

## ✅ Health Check

### Test Server is Running
```bash
curl http://localhost:3000/api/health
```

**Response:**
```json
{
  "status": "OK",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

## 👥 Employee Management

### 1. List All Employees
```bash
curl -X GET "http://localhost:3000/api/employees?limit=10&offset=0" \
  -H "Authorization: Bearer <token>"
```

### 2. Get Specific Employee
```bash
curl -X GET http://localhost:3000/api/employees/1 \
  -H "Authorization: Bearer <token>"
```

### 3. Get Employees by Department
```bash
curl -X GET "http://localhost:3000/api/employees/department/IT?limit=10" \
  -H "Authorization: Bearer <token>"
```

### 4. Create New Employee
```bash
curl -X POST http://localhost:3000/api/employees \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Jane",
    "last_name": "Smith",
    "email": "jane.smith@company.com",
    "phone": "555-1234",
    "position": "Project Manager",
    "department": "Management",
    "employment_type": "full-time",
    "salary": 75000,
    "joining_date": "2024-01-15",
    "date_of_birth": "1990-05-20",
    "gender": "female",
    "address": "123 Main St",
    "city": "New York",
    "state": "NY",
    "postal_code": "10001",
    "country": "USA"
  }'
```

### 5. Update Employee
```bash
curl -X PUT http://localhost:3000/api/employees/1 \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "position": "Senior Developer",
    "salary": 85000,
    "department": "IT"
  }'
```

### 6. Delete Employee
```bash
curl -X DELETE http://localhost:3000/api/employees/1 \
  -H "Authorization: Bearer <token>"
```

### 7. Get Active Employees Count
```bash
curl -X GET http://localhost:3000/api/employees/stats/count \
  -H "Authorization: Bearer <token>"
```

---

## 📋 Attendance Management

### 1. List All Attendance Records
```bash
curl -X GET "http://localhost:3000/api/attendance?limit=20&offset=0" \
  -H "Authorization: Bearer <token>"
```

### 2. Get Attendance by ID
```bash
curl -X GET http://localhost:3000/api/attendance/1 \
  -H "Authorization: Bearer <token>"
```

### 3. Get Attendance for Employee in Date Range
```bash
curl -X GET "http://localhost:3000/api/attendance/employee/1/date-range?start_date=2024-01-01&end_date=2024-01-31" \
  -H "Authorization: Bearer <token>"
```

### 4. Mark Attendance
```bash
curl -X POST http://localhost:3000/api/attendance \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "employee_id": 1,
    "attendance_date": "2024-01-15",
    "check_in_time": "09:00:00",
    "check_out_time": "17:30:00",
    "status": "present",
    "remarks": "Normal working day"
  }'
```

### 5. Update Attendance
```bash
curl -X PUT http://localhost:3000/api/attendance/1 \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "check_out_time": "18:00:00",
    "status": "present"
  }'
```

### 6. Delete Attendance Record
```bash
curl -X DELETE http://localhost:3000/api/attendance/1 \
  -H "Authorization: Bearer <token>"
```

---

## 💰 Payroll Management

### 1. List All Payroll Records
```bash
curl -X GET "http://localhost:3000/api/payroll?limit=20&offset=0&status=pending" \
  -H "Authorization: Bearer <token>"
```

### 2. Get Payroll by ID
```bash
curl -X GET http://localhost:3000/api/payroll/1 \
  -H "Authorization: Bearer <token>"
```

### 3. Get Employee's Payroll Records
```bash
curl -X GET "http://localhost:3000/api/payroll/employee/1?limit=12&status=paid" \
  -H "Authorization: Bearer <token>"
```

### 4. Create Payroll Record
```bash
curl -X POST http://localhost:3000/api/payroll \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "employee_id": 1,
    "pay_period_start": "2024-01-01",
    "pay_period_end": "2024-01-31",
    "basic_salary": 75000,
    "allowances": 5000,
    "deductions": 2000,
    "remarks": "January 2024 payroll"
  }'
```

### 5. Update Payroll Record
```bash
curl -X PUT http://localhost:3000/api/payroll/1 \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "allowances": 6000,
    "deductions": 2500
  }'
```

### 6. Approve Payroll
```bash
curl -X POST http://localhost:3000/api/payroll/1/approve \
  -H "Authorization: Bearer <token>"
```

### 7. Process Payroll (Ready for Payment)
```bash
curl -X POST http://localhost:3000/api/payroll/1/process \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "payment_date": "2024-02-05"
  }'
```

### 8. Mark Payroll as Paid
```bash
curl -X POST http://localhost:3000/api/payroll/1/mark-paid \
  -H "Authorization: Bearer <token>"
```

### 9. Delete Payroll Record
```bash
curl -X DELETE http://localhost:3000/api/payroll/1 \
  -H "Authorization: Bearer <token>"
```

---

## 📄 Payslip Management

### 1. List All Payslips
```bash
curl -X GET "http://localhost:3000/api/payslips?limit=20&offset=0&status=sent" \
  -H "Authorization: Bearer <token>"
```

### 2. Get Payslip by ID
```bash
curl -X GET http://localhost:3000/api/payslips/1 \
  -H "Authorization: Bearer <token>"
```

### 3. Get Employee's Payslips
```bash
curl -X GET "http://localhost:3000/api/payslips/employee/1?limit=12" \
  -H "Authorization: Bearer <token>"
```

### 4. Get Unviewed Payslips for Employee
```bash
curl -X GET http://localhost:3000/api/payslips/employee/1/unviewed \
  -H "Authorization: Bearer <token>"
```

### 5. Generate Payslip from Payroll
```bash
curl -X POST http://localhost:3000/api/payslips/generate/1 \
  -H "Authorization: Bearer <token>"
```

### 6. Send Payslip to Employee
```bash
curl -X POST http://localhost:3000/api/payslips/1/send \
  -H "Authorization: Bearer <token>"
```

### 7. Employee Views Payslip
```bash
curl -X POST http://localhost:3000/api/payslips/1/mark-viewed \
  -H "Authorization: Bearer <token>"
```

### 8. Update Payslip Status
```bash
curl -X PUT http://localhost:3000/api/payslips/1 \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "viewed"
  }'
```

### 9. Delete Payslip
```bash
curl -X DELETE http://localhost:3000/api/payslips/1 \
  -H "Authorization: Bearer <token>"
```

---

## 🔐 Authentication

### 1. Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@hrpayroll.com",
    "password": "Admin@123"
  }'
```

### 2. Get Current User
```bash
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer <token>"
```

### 3. List All Users (Admin Only)
```bash
curl -X GET http://localhost:3000/api/auth/users \
  -H "Authorization: Bearer <token>"
```

### 4. Create New User (Admin Only)
```bash
curl -X POST http://localhost:3000/api/auth/users \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "New Admin",
    "email": "newadmin@hrpayroll.com",
    "password": "SecurePass@123",
    "role": "admin"
  }'
```

---

## 🔄 Complete Workflow Example

### Step 1: Login as Admin
```bash
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@hrpayroll.com", "password": "Admin@123"}' | jq -r '.token')
```

### Step 2: Create Employee
```bash
curl -X POST http://localhost:3000/api/employees \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Bob",
    "last_name": "Johnson",
    "email": "bob@company.com",
    "position": "Developer",
    "department": "IT",
    "salary": 60000,
    "joining_date": "2024-01-10",
    "employment_type": "full-time"
  }'
```

### Step 3: Mark Attendance
```bash
curl -X POST http://localhost:3000/api/attendance \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "employee_id": 2,
    "attendance_date": "2024-01-15",
    "check_in_time": "09:00",
    "check_out_time": "17:30",
    "status": "present"
  }'
```

### Step 4: Create Payroll
```bash
curl -X POST http://localhost:3000/api/payroll \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "employee_id": 2,
    "pay_period_start": "2024-01-01",
    "pay_period_end": "2024-01-31",
    "basic_salary": 60000,
    "allowances": 3000,
    "deductions": 1500
  }'
```

### Step 5: Approve Payroll
```bash
curl -X POST http://localhost:3000/api/payroll/1/approve \
  -H "Authorization: Bearer $TOKEN"
```

### Step 6: Generate Payslip
```bash
curl -X POST http://localhost:3000/api/payslips/generate/1 \
  -H "Authorization: Bearer $TOKEN"
```

### Step 7: Send Payslip
```bash
curl -X POST http://localhost:3000/api/payslips/1/send \
  -H "Authorization: Bearer $TOKEN"
```

---

## 🚨 Error Codes

| Status | Meaning |
|--------|---------|
| 200 | OK - Success |
| 201 | Created - Resource created |
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - No/invalid token |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource doesn't exist |
| 409 | Conflict - Duplicate/conflict error |
| 500 | Server Error |

---

## 📝 Example Responses

### Success Response
```json
{
  "employee": {
    "id": 1,
    "employee_id": "EMP000001",
    "first_name": "John",
    "last_name": "Doe",
    "email": "john@company.com",
    "position": "Developer",
    "department": "IT",
    "salary": 60000,
    "status": "active"
  }
}
```

### Error Response
```json
{
  "message": "Employee with this email already exists"
}
```

### List Response with Pagination
```json
{
  "employees": [...],
  "pagination": {
    "total": 25,
    "limit": 10,
    "offset": 0,
    "pages": 3
  }
}
```

---

## 💡 Tips

1. **Always include Authorization header** for protected endpoints
2. **Use Content-Type: application/json** for POST/PUT requests
3. **Check status codes** to understand success/failure
4. **Use jq** for JSON parsing: `curl ... | jq '.'`
5. **Store token in variable** for multiple requests
6. **Date format**: YYYY-MM-DD
7. **Time format**: HH:mm or HH:mm:ss

---

**Happy Testing!** 🎉
