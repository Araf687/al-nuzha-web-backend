import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds 'admin' to service_requests.source enum (jobs created from admin panel).
 * Safe if value already exists (e.g. added earlier by synchronize in development).
 */
export class AddAdminRequestSource1789578000000 implements MigrationInterface {
  name = 'AddAdminRequestSource1789578000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TYPE "service_requests_source_enum" ADD VALUE IF NOT EXISTS 'admin'`);
  }

  public async down(): Promise<void> {
    // Postgres cannot drop an enum value; leaving 'admin' in place is harmless.
  }
}
