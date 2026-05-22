import { Application } from "express";
import { AttendanceController } from "../controllers/AttendanceController";
import { BaseRoutes } from "./BaseRoutes";

export class AttendanceRoutes extends BaseRoutes {
  private static readonly basePath = "/api/attendance";
  private readonly attendanceController = new AttendanceController();

  public static register(app: Application): void {
    new AttendanceRoutes().register(app);
  }

  constructor() {
    super(AttendanceRoutes.basePath);
    this.initializeRoutes();
  }

  protected initializeRoutes(): void {
    this.useAuth();

    this.get(
      "/staff",
      this.requireRole("staff", "admin"),
      this.attendanceController.getStaffAttendance.bind(this.attendanceController),
    );

    this.get(
      "/admin",
      this.requireRole("admin"),
      this.attendanceController.getAdminAttendance.bind(this.attendanceController),
    );

    this.post(
      "/staff",
      this.requireRole("staff", "admin"),
      this.attendanceController.recordAttendance.bind(this.attendanceController),
    );
  }
}