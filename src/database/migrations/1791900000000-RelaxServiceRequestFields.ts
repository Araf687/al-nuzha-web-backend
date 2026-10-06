import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Makes `problemDescription` and `address` optional on service requests —
 * a job can be created with just customer, phone and service type.
 */
export class RelaxServiceRequestFields1791900000000 implements MigrationInterface {
  name = 'RelaxServiceRequestFields1791900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "service_requests" ALTER COLUMN "problemDescription" DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE "service_requests" ALTER COLUMN "address" DROP NOT NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Existing rows may hold NULLs, so fill them before putting the constraints back
    await queryRunner.query(`UPDATE "service_requests" SET "problemDescription" = '' WHERE "problemDescription" IS NULL`);
    await queryRunner.query(`UPDATE "service_requests" SET "address" = '' WHERE "address" IS NULL`);
    await queryRunner.query(`ALTER TABLE "service_requests" ALTER COLUMN "problemDescription" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "service_requests" ALTER COLUMN "address" SET NOT NULL`);
  }
}
