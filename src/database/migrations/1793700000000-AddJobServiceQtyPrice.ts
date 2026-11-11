import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds `quantity` and `unitPrice` to job_services; existing rows become 1 × labourCost.
 * Safe if the columns already exist (e.g. added by synchronize in development).
 */
export class AddJobServiceQtyPrice1793700000000 implements MigrationInterface {
  name = 'AddJobServiceQtyPrice1793700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "job_services" ADD COLUMN IF NOT EXISTS "quantity" numeric(10,2) NOT NULL DEFAULT 1`);
    await queryRunner.query(`ALTER TABLE "job_services" ADD COLUMN IF NOT EXISTS "unitPrice" numeric(10,2) NOT NULL DEFAULT 0`);
    await queryRunner.query(`UPDATE "job_services" SET "unitPrice" = "labourCost" WHERE "unitPrice" = 0 AND "quantity" = 1`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "job_services" DROP COLUMN IF EXISTS "unitPrice"`);
    await queryRunner.query(`ALTER TABLE "job_services" DROP COLUMN IF EXISTS "quantity"`);
  }
}
