import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds 'admin' to service_requests.source enum (jobs created from admin panel).
 * Safe if value already exists (e.g. added earlier by synchronize in development).
 *
 * Runs outside a transaction: Postgres < 12 rejects ALTER TYPE ... ADD VALUE
 * inside a transaction block, which would stop the app from booting.
 */
export class AddAdminRequestSource1789578000000 implements MigrationInterface {
  name = 'AddAdminRequestSource1789578000000';
  transaction = false;

  public async up(queryRunner: QueryRunner): Promise<void> {
    const [{ exists }] = await queryRunner.query(
      `SELECT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'service_requests_source_enum') AS "exists"`,
    );
    if (!exists) return;

    await queryRunner.query(`ALTER TYPE "service_requests_source_enum" ADD VALUE IF NOT EXISTS 'admin'`);
  }

  public async down(): Promise<void> {
    // Postgres cannot drop an enum value; leaving 'admin' in place is harmless.
  }
}
