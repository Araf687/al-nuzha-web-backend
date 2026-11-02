import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds the optional `shopNumber` (shop phone) column to expenses.
 * Safe if the column already exists (e.g. added by synchronize in development).
 */
export class AddExpenseShopNumber1793500000000 implements MigrationInterface {
  name = 'AddExpenseShopNumber1793500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "expenses" ADD COLUMN IF NOT EXISTS "shopNumber" character varying`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "expenses" DROP COLUMN IF EXISTS "shopNumber"`);
  }
}
