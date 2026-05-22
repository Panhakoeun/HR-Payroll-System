import { Application, RequestHandler, Router } from "express";
import { AuthMiddleware } from "../middlewares/AuthMiddleware";
import { UserRole } from "../models/User";

export abstract class BaseRoutes {
  private readonly routeRegistry = Router();

  protected constructor(protected readonly basePath: string) {}

  public get router(): Router {
    return this.routeRegistry;
  }

  public register(app: Application): void {
    app.use(this.basePath, this.router);
  }

  protected abstract initializeRoutes(): void;

  protected get(path: string, ...handlers: RequestHandler[]): void {
    this.routeRegistry.get(path, ...handlers);
  }

  protected post(path: string, ...handlers: RequestHandler[]): void {
    this.routeRegistry.post(path, ...handlers);
  }

  protected patch(path: string, ...handlers: RequestHandler[]): void {
    this.routeRegistry.patch(path, ...handlers);
  }

  protected useAuth(): void {
    this.routeRegistry.use(AuthMiddleware.verifyToken);
  }

  protected verifyToken(): RequestHandler {
    return AuthMiddleware.verifyToken;
  }

  protected requireRole(...roles: UserRole[]): RequestHandler {
    return AuthMiddleware.requireRole(...roles);
  }
}
