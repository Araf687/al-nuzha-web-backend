import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds the optional `serviceItems` (list of services) column to service_requests.
 * Safe if the column already exists (e.g. added by synchronize in development).
 */
export class AddServiceRequestServiceItems1793600000000 implements MigrationInterface {
  name = 'AddServiceRequestServiceItems1793600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "service_requests" ADD COLUMN IF NOT EXISTS "serviceItems" text array`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "service_requests" DROP COLUMN IF EXISTS "serviceItems"`);
  }
}
