import { Response } from "express";
import { ErrorResponse } from "../models/Auth";

export class HttpResponse {
  /**
   * Send a success response
   */
  public static success<T>(res: Response, data: T, message?: string): void {
    res.status(200).json({
      success: true,
      message: message || "Request successful",
      data,
    });
  }

  /**
   * Send an error response
   */
  public static error(res: Response, status: number, message: string): void {
    res.status(status).json({ message } satisfies ErrorResponse);
  }
}
