import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds free-text `houseNo` (villa / flat / building number) to service_requests.
 * Safe if the column already exists (e.g. added by synchronize in development).
 */
export class AddServiceRequestHouseNo1793800000000 implements MigrationInterface {
  name = 'AddServiceRequestHouseNo1793800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "service_requests" ADD COLUMN IF NOT EXISTS "houseNo" character varying`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "service_requests" DROP COLUMN IF EXISTS "houseNo"`);
  }
}
