import fs from "fs/promises";
import path from "path";
import mysql from "mysql2/promise";
import { envConfig } from "../config/env";

class DatabaseSetup {
  public async run(): Promise<void> {
    console.log("Setting up HR Payroll database from database.sql...");
    console.log(`  Host:     ${envConfig.db.host}`);
    console.log(`  User:     ${envConfig.db.user}`);
    console.log(`  Database: ${envConfig.db.database}`);
    console.log("");

    try {
      const sqlPath = path.resolve(process.cwd(), "database.sql");
      const sql = await fs.readFile(sqlPath, "utf8");
      const connection = await mysql.createConnection({
        host: envConfig.db.host,
        port: envConfig.db.port,
        user: envConfig.db.user,
        password: envConfig.db.password,
        multipleStatements: true,
      });

      await connection.query(`DROP DATABASE IF EXISTS \`${envConfig.db.database}\``);
      await connection.query(sql);
      await connection.end();

      console.log("Database schema and seed data imported successfully.");
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("Setup failed:", message);
      process.exitCode = 1;
    }
  }
}

void new DatabaseSetup().run();
