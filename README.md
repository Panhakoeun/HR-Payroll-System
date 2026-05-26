# HR & Payroll Management System

A comprehensive Node.js backend system for managing employees, attendance, payroll, and payslips with JWT authentication and role-based access control.

## 🏗️ Project Architecture

### Clean Layered Architecture

```
backend/src/
├── app.ts                 # Express application setup
├── config/               # Configuration files
│   └── env.ts           # Environment variables
├── controllers/         # HTTP request handlers
├── services/           # Business logic layer
├── repositories/       # Database access layer
├── models/            # Data models and interfaces
├── middlewares/       # Express middlewares
├── routes/           # API route definitions
├── utils/           # Utility functions
└── validations/    # Input validation rules
```

### Architecture Flow

```
HTTP Request → Route → Controller → Service → Repository → Database
                                ↓
                        Business Logic & Validation
```

## 📦 Core Components

### 1. **Models** (`models/`)
Define data structures and interfaces for each entity:
- **User**: Authentication user
- **Employee**: Employee information
- **Attendance**: Daily attendance records
- **Payroll**: Salary calculations and payment records
- **Payslip**: Employee payslips

### 2. **Repositories** (`repositories/`)
Database access layer with CRUD operations:
- `UserRepository`: User database operations
- `EmployeeRepository`: Employee CRUD operations
- `AttendanceRepository`: Attendance CRUD operations
- `PayrollRepository`: Payroll CRUD operations
- `PayslipRepository`: Payslip CRUD operations

### 3. **Services** (`services/`)
Business logic layer:
- `AuthService`: Authentication and user management
- `EmployeeService`: Employee management logic
- `AttendanceService`: Attendance logic
- `PayrollService`: Payroll calculations and management
- `PayslipService`: Payslip generation and management

### 4. **Controllers** (`controllers/`)
HTTP request handlers:
- `AuthController`: Login, registration, user management
- `EmployeeController`: Employee endpoints
- `AttendanceController`: Attendance endpoints
- `PayrollController`: Payroll endpoints
- `PayslipController`: Payslip endpoints

### 5. **Routes** (`routes/`)
API endpoint definitions with middleware:
- `AuthRoutes`: Authentication routes
- `EmployeeRoutes`: Employee management routes
- `AttendanceRoutes`: Attendance tracking routes
- `PayrollRoutes`: Payroll management routes
- `PayslipRoutes`: Payslip management routes

## 🗄️ Database Schema

### Tables

#### users
```sql
id, name, email, password, role, created_at, updated_at
```

#### employees
```sql
id, user_id, employee_id, first_name, last_name, email, phone,
date_of_birth, gender, address, city, state, postal_code, country,
position, department, employment_type, salary, joining_date, status
```

#### attendance
```sql
id, employee_id, attendance_date, check_in_time, check_out_time,
status, remarks
```

#### payroll
```sql
id, employee_id, pay_period_start, pay_period_end, basic_salary,
allowances, deductions, gross_salary, net_salary, status, payment_date, remarks
```

#### payslips
```sql
id, payroll_id, employee_id, pay_period_start, pay_period_end,
basic_salary, allowances, deductions, gross_salary, net_salary, status
```

## 🔐 Authentication & Authorization

### JWT Authentication
- Token-based authentication using JWT
- Tokens include user ID, name, email, and role
- Default expiry: 24 hours

### Role-Based Access Control
- **Admin**: Full system access
- **Staff**: Limited to own data viewing

### Default Credentials
```
Admin:
  Email: admin@hrpayroll.com
  Password: Admin@123

Staff:
  Email: staff@hrpayroll.com
  Password: Staff@123
```

## 📚 API Endpoints

### Authentication (`/api/auth`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/auth/login` | Login user | ❌ |
| GET | `/auth/me` | Get current user | ✅ |
| GET | `/auth/users` | List all users | ✅ Admin |
| POST | `/auth/users` | Create new user | ✅ Admin |

### Employees (`/api/employees`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/` | List employees (paginated) | ✅ |
| GET | `/:id` | Get employee details | ✅ |
| POST | `/` | Create employee | ✅ Admin |
| PUT | `/:id` | Update employee | ✅ Admin |
| DELETE | `/:id` | Delete employee | ✅ Admin |
| GET | `/department/:department` | Get by department | ✅ |
| GET | `/stats/count` | Get active count | ✅ Admin |

### Attendance (`/api/attendance`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/` | List attendance | ✅ Admin |
| GET | `/:id` | Get record | ✅ |
| POST | `/` | Mark attendance | ✅ Admin |
| PUT | `/:id` | Update attendance | ✅ Admin |
| DELETE | `/:id` | Delete record | ✅ Admin |
| GET | `/employee/:id/date-range` | Get range | ✅ |

### Payroll (`/api/payroll`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/` | List payroll | ✅ Admin |
| GET | `/:id` | Get payroll | ✅ |
| POST | `/` | Create payroll | ✅ Admin |
| PUT | `/:id` | Update payroll | ✅ Admin |
| GET | `/employee/:id` | Get employee payroll | ✅ |
| POST | `/:id/approve` | Approve payroll | ✅ Admin |
| POST | `/:id/process` | Process payroll | ✅ Admin |
| POST | `/:id/mark-paid` | Mark as paid | ✅ Admin |
| DELETE | `/:id` | Delete payroll | ✅ Admin |

### Payslips (`/api/payslips`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/` | List payslips | ✅ Admin |
| GET | `/:id` | Get payslip | ✅ |
| POST | `/generate/:payrollId` | Generate payslip | ✅ Admin |
| PUT | `/:id` | Update status | ✅ Admin |
| GET | `/employee/:id` | Get employee payslips | ✅ |
| POST | `/:id/send` | Send payslip | ✅ Admin |
| POST | `/:id/mark-viewed` | Mark viewed | ✅ |
| DELETE | `/:id` | Delete payslip | ✅ Admin |

## 🚀 Setup Instructions

### Prerequisites
- Node.js 16+ and npm
- MySQL 8.0+

### Installation

1. **Clone repository**
   ```bash
   git clone <repository-url>
   cd HR-Payroll-System
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Setup database**
   ```bash
   # Create database and tables
   mysql -u root -p < database.sql
   ```

4. **Configure environment**
   ```bash
   # Copy example env file
   cp .env.example .env
   
   # Edit .env with your configuration
   ```

5. **Environment Variables**
   ```
   PORT=3000
   NODE_ENV=development
   
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=your_password
   DB_NAME=hr_payroll_db
   
   JWT_SECRET=your_secret_key_here
   JWT_EXPIRES_IN=24h
   ```

6. **Build & Run**
   ```bash
   # Development
   npm run dev
   
   # Production
   npm run build
   npm start
   ```

## 📋 Usage Examples

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@hrpayroll.com",
    "password": "Admin@123"
  }'
```

### Create Employee
```bash
curl -X POST http://localhost:3000/api/employees \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "John",
    "last_name": "Doe",
    "email": "john@company.com",
    "position": "Developer",
    "department": "IT",
    "salary": 50000,
    "joining_date": "2024-01-15"
  }'
```

### Mark Attendance
```bash
curl -X POST http://localhost:3000/api/attendance \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "employee_id": 1,
    "attendance_date": "2024-01-15",
    "check_in_time": "09:00",
    "check_out_time": "17:30",
    "status": "present"
  }'
```

### Create Payroll
```bash
curl -X POST http://localhost:3000/api/payroll \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "employee_id": 1,
    "pay_period_start": "2024-01-01",
    "pay_period_end": "2024-01-31",
    "basic_salary": 50000,
    "allowances": 5000,
    "deductions": 2000
  }'
```

## 🔍 Code Quality Standards

### Naming Conventions
- **Files**: camelCase (e.g., `employeeService.ts`)
- **Classes**: PascalCase (e.g., `EmployeeService`)
- **Methods/Variables**: camelCase (e.g., `getEmployee()`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_SALARY`)

### Best Practices
- ✅ Type safety with TypeScript
- ✅ Layered architecture for separation of concerns
- ✅ Dependency injection pattern
- ✅ Error handling with try-catch
- ✅ Input validation at controller level
- ✅ Comments for complex logic
- ✅ Consistent code formatting

### Error Handling
All controllers follow consistent error handling:
```typescript
try {
  // Business logic
} catch (err) {
  if (err instanceof Error && err.message === "Entity not found") {
    HttpResponse.error(res, 404, "Entity not found");
    return;
  }
  console.error("Operation error:", err);
  HttpResponse.error(res, 500, "Server error");
}
```

## 📝 Response Format

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
    "salary": 50000,
    "status": "active",
    "joining_date": "2024-01-15"
  }
}
```

### Error Response
```json
{
  "message": "Invalid employee ID"
}
```

### List Response with Pagination
```json
{
  "employees": [...],
  "pagination": {
    "total": 50,
    "limit": 10,
    "offset": 0,
    "pages": 5
  }
}
```

## 🧪 Testing Checklist

- [ ] User authentication and JWT
- [ ] Employee CRUD operations
- [ ] Attendance marking and tracking
- [ ] Payroll creation and approval workflow
- [ ] Payslip generation and distribution
- [ ] Role-based access control
- [ ] Input validation
- [ ] Error handling
- [ ] Database transactions

## 📖 Additional Notes

### Soft Deletes
Employees are soft-deleted (status changed to 'inactive') instead of hard deletion for data integrity.

### Automatic IDs
- Employee IDs are auto-generated in format: `EMP000001`, `EMP000002`, etc.

### Payroll Calculations
- `gross_salary = basic_salary + allowances`
- `net_salary = gross_salary - deductions`

### Time Format
- Time fields use HH:mm:ss format (24-hour)
- Optional seconds: HH:mm also accepted

## 📞 Support & Troubleshooting

### Common Issues

**Database Connection Error**
- Check MySQL is running
- Verify credentials in .env
- Ensure database is created: `mysql -u root -p < database.sql`

**Port Already in Use**
- Change PORT in .env
- Or kill process: `lsof -ti:3000 | xargs kill -9`

**JWT Token Invalid**
- Ensure JWT_SECRET matches in .env
- Check token hasn't expired
- Include "Bearer " prefix in Authorization header

## 📄 License

This project is part of an HR & Payroll Management System implementation.

---

**Last Updated**: May 2024
**Version**: 1.0.0
