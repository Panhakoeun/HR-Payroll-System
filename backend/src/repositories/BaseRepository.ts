import { Database } from "../database/Database";

export abstract class BaseRepository {
  protected readonly db = Database.getInstance();
  private schemaReady?: Promise<void>;

  public async ensureSchema(): Promise<void> {
    if (!this.schemaReady) {
      this.schemaReady = this.createSchema();
    }

    await this.schemaReady;
  }

  protected abstract createSchema(): Promise<void>;

  protected formatDate(value: Date | string): string {
    if (value instanceof Date) {
      return value.toISOString().slice(0, 10);
    }

    return String(value).slice(0, 10);
  }

  protected formatDateTime(value: Date | string): string {
    if (value instanceof Date) {
      return value.toISOString();
    }

    return String(value);
  }
}
