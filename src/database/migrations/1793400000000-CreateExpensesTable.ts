import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Creates the `expenses` table — monthly expense tracking: cost, shop, description,
 * date and the technician who recorded it.
 * Safe on any starting state (e.g. created earlier by synchronize in development).
 */
export class CreateExpensesTable1793400000000 implements MigrationInterface {
  name = 'CreateExpensesTable1793400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "expenses" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "cost" numeric(10,2) NOT NULL,
        "shopName" character varying NOT NULL,
        "description" text,
        "spentAt" date NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "technicianId" uuid,
        CONSTRAINT "PK_expenses_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_expenses_spentAt" ON "expenses" ("spentAt")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_expenses_technicianId" ON "expenses" ("technicianId")`);

    // Owner link; ON DELETE SET NULL keeps the spend history if a technician is removed
    const [{ exists }] = await queryRunner.query(
      `SELECT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_expenses_technician') AS "exists"`,
    );
    if (!exists) {
      await queryRunner.query(`
        ALTER TABLE "expenses"
        ADD CONSTRAINT "FK_expenses_technician"
        FOREIGN KEY ("technicianId") REFERENCES "technicians"("id") ON DELETE SET NULL
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "expenses"`);
  }
}
