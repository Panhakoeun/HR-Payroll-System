import express, { Application as ExpressApplication, Request, Response, NextFunction } from "express";
import cors from "cors";
import path from "path";
import { envConfig } from "./config/env";
import { AuthRoutes } from "./routes/AuthRoutes";
import { EmployeeRoutes } from "./routes/EmployeeRoutes";
import { AttendanceRoutes } from "./routes/atendanceRoutes";
import { PayrollRoutes } from "./routes/payrollroutes";
import { PayslipRoutes } from "./routes/payslipRoutes";
import { DashboardRoutes } from "./routes/DashboardRoutes";

class App {
  private readonly app: ExpressApplication;

  constructor() {
    envConfig.validate();
    this.app = express();

    this.configureMiddlewares();
    this.configureRoutes();
    this.configureErrorHandling();
    this.configureFrontendFallback();
  }

  public start(): void {
    this.app.listen(envConfig.port, () => {
      console.log(`🚀 Server running on http://localhost:${envConfig.port}`);
      console.log("📚 API Documentation available at /api/docs");
    });
  }

  private configureMiddlewares(): void {
    // CORS configuration
    this.app.use(cors());

    // Body parsing middleware
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));

    // Request logging middleware
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
      next();
    });

    // Static files
    this.app.use(express.static(path.join(__dirname, "../frontend")));
  }

  private configureRoutes(): void {
    // Initialize route classes
    const authRoutes = new AuthRoutes();
    const employeeRoutes = new EmployeeRoutes();
    const attendanceRoutes = new AttendanceRoutes();
    const payrollRoutes = new PayrollRoutes();
    const payslipRoutes = new PayslipRoutes();
    const dashboardRoutes = new DashboardRoutes();

    // Register routes
    this.app.use("/api/auth", authRoutes.router);
    this.app.use("/api/employees", employeeRoutes.router);
    this.app.use("/api/attendance", attendanceRoutes.router);
    this.app.use("/api/payroll", payrollRoutes.router);
    this.app.use("/api/payslips", payslipRoutes.router);
    this.app.use("/api/dashboard", dashboardRoutes.router);

    // Health check endpoint
    this.app.get("/api/health", (_req: Request, res: Response) => {
      res.json({ status: "OK", timestamp: new Date().toISOString() });
    });

    // API documentation placeholder
    this.app.get("/api/docs", (_req: Request, res: Response) => {
      res.json({
        message: "HR & Payroll System API",
        version: "1.0.0",
        endpoints: {
          auth: "/api/auth",
          employees: "/api/employees",
          attendance: "/api/attendance",
          payroll: "/api/payroll",
          payslips: "/api/payslips",
          dashboard: "/api/dashboard",
        },
        documentation: "See README.md for detailed API documentation",
      });
    });
  }

  private configureErrorHandling(): void {
    // 404 handler (before frontend fallback)
    this.app.use("/api", (req: Request, res: Response) => {
      res.status(404).json({
        message: "API endpoint not found",
        path: req.path,
        method: req.method,
      });
    });

    // Global error handling middleware
    this.app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
      console.error("❌ Error:", {
        message: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method,
      });

      res.status(500).json({
        message: "Internal server error",
        error: process.env.NODE_ENV === "development" ? err.message : undefined,
      });
    });
  }

  private configureFrontendFallback(): void {
<<<<<<< HEAD
=======
    // Friendly routes for key pages
    this.app.get("/admin/dashboard.html", (_req: Request, res: Response) => {
      res.sendFile(path.join(__dirname, "../frontend/admin/dashboard.html"));
    });
    this.app.get("/admin/employees.html", (_req: Request, res: Response) => {
      res.sendFile(path.join(__dirname, "../frontend/admin/employees.html"));
    });
    this.app.get("/admin/payroll.html", (_req: Request, res: Response) => {
      res.sendFile(path.join(__dirname, "../frontend/admin/payroll.html"));
    });
    this.app.get("/staff/dashboard.html", (_req: Request, res: Response) => {
      res.sendFile(path.join(__dirname, "../frontend/staff/dashboard.html"));
    });
    this.app.get("/staff/payslip.html", (_req: Request, res: Response) => {
      res.sendFile(path.join(__dirname, "../frontend/staff/payslip.html"));
    });

>>>>>>> develop
    // Serve frontend for all non-API routes
    this.app.get("*", (_req: Request, res: Response) => {
      res.sendFile(path.join(__dirname, "../frontend/login.html"));
    });
  }
}

new App().start();
