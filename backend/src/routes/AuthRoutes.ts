import { Application } from "express";
import { AuthController } from "../controllers/AuthController";
import { BaseRoutes } from "./BaseRoutes";

export class AuthRoutes extends BaseRoutes {
  private static readonly basePath = "/api/auth";
  private readonly authController = new AuthController();

  public static register(app: Application): void {
    new AuthRoutes().register(app);
  }

  constructor() {
    super(AuthRoutes.basePath);
    this.initializeRoutes();
  }

  protected initializeRoutes(): void {
    this.post("/login", this.authController.login.bind(this.authController));
    this.get(
      "/me",
      this.verifyToken(),
      this.authController.getMe.bind(this.authController),
    );
    this.post(
      "/users",
      this.verifyToken(),
      this.requireRole("admin"),
      this.authController.createUser.bind(this.authController),
    );
  }
}
