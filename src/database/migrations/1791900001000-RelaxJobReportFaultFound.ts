import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Makes `faultFound` optional on job reports — a technician can submit a report
 * without writing a fault description.
 */
export class RelaxJobReportFaultFound1791900001000 implements MigrationInterface {
  name = 'RelaxJobReportFaultFound1791900001000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "job_reports" ALTER COLUMN "faultFound" DROP NOT NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Existing rows may hold NULLs, so fill them before putting the constraint back
    await queryRunner.query(`UPDATE "job_reports" SET "faultFound" = '' WHERE "faultFound" IS NULL`);
    await queryRunner.query(`ALTER TABLE "job_reports" ALTER COLUMN "faultFound" SET NOT NULL`);
  }
}
