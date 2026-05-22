import { Application } from "express";
import { LeaveRequestController } from "../controllers/LeaveRequestController";
import { BaseRoutes } from "./BaseRoutes";

export class LeaveRequestRoutes extends BaseRoutes {
  private static readonly basePath = "/api/leave-requests";
  private readonly leaveRequestController = new LeaveRequestController();

  public static register(app: Application): void {
    new LeaveRequestRoutes().register(app);
  }

  constructor() {
    super(LeaveRequestRoutes.basePath);
    this.initializeRoutes();
  }

  protected initializeRoutes(): void {
    this.useAuth();

    this.post(
      "/staff",
      this.requireRole("staff", "admin"),
      this.leaveRequestController.submit.bind(this.leaveRequestController),
    );

    this.get(
      "/staff",
      this.requireRole("staff", "admin"),
      this.leaveRequestController.getMyRequests.bind(this.leaveRequestController),
    );

    this.patch(
      "/staff/:id/cancel",
      this.requireRole("staff", "admin"),
      this.leaveRequestController.cancel.bind(this.leaveRequestController),
    );

    this.get(
      "/admin",
      this.requireRole("admin"),
      this.leaveRequestController.getAdminRequests.bind(this.leaveRequestController),
    );

    this.patch(
      "/admin/:id/approve",
      this.requireRole("admin"),
      this.leaveRequestController.approve.bind(this.leaveRequestController),
    );

    this.patch(
      "/admin/:id/reject",
      this.requireRole("admin"),
      this.leaveRequestController.reject.bind(this.leaveRequestController),
    );
  }
}
