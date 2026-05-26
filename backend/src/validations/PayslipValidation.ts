/**
 * Payslip Validation
 * Input validation rules for Payslip operations
 */

import { UpdatePayslipRequest } from "../models/Payslip";

export class PayslipValidation {
  /**
   * Validate update payslip request
   */
  public static validateUpdatePayslip(body: Partial<UpdatePayslipRequest>): string | null {
    if (body.status && !this.isValidStatus(body.status)) {
      return "Invalid payslip status";
    }

    return null;
  }

  private static isValidStatus(status: string): boolean {
    return ["draft", "generated", "sent", "viewed"].includes(status);
  }
}
