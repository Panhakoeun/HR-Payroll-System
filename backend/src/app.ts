import express, { Application as ExpressApplication } from "express";
import cors from "cors";
import path from "path";
import { envConfig } from "./config/env";
import { AuthRoutes } from "./routes/AuthRoutes";
import { AttendanceRoutes } from "./routes/AttendanceRoutes";
import { LeaveRequestRoutes } from "./routes/LeaveRequestRoutes";

class App {
  private readonly app: ExpressApplication;

  constructor() {
    envConfig.validate();
    this.app = express();

    this.configureMiddlewares();
    this.configureRoutes();
    this.configureFrontendFallback();
  }

  public start(): void {
    this.app.listen(envConfig.port, () => {
      console.log(`Server running on http://localhost:${envConfig.port}`);
    });
  }

  private configureMiddlewares(): void {
    this.app.use(cors());
    this.app.use(express.json());
    this.app.use(express.static(path.join(__dirname, "../frontend")));
  }

  private configureRoutes(): void {
    AuthRoutes.register(this.app);
    AttendanceRoutes.register(this.app);
    LeaveRequestRoutes.register(this.app);
  }

  private configureFrontendFallback(): void {
    this.app.get("*", (_req, res) => {
      res.sendFile(path.join(__dirname, "../frontend/login.html"));
    });
  }
}

new App().start();
