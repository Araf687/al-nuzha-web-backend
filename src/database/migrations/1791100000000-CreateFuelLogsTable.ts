import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Creates the `fuel_logs` table — petrol put into the car: litres, cost, date
 * and the technician who filled up.
 * Safe on any starting state (e.g. created earlier by synchronize in development).
 */
export class CreateFuelLogsTable1791100000000 implements MigrationInterface {
  name = 'CreateFuelLogsTable1791100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "fuel_logs" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "litres" numeric(10,2) NOT NULL,
        "cost" numeric(10,2) NOT NULL,
        "filledAt" date NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "technicianId" uuid,
        CONSTRAINT "PK_fuel_logs_id" PRIMARY KEY ("id")
      )
    `);

    // Upgrade a table created before technicianId existed (e.g. by synchronize in development)
    await queryRunner.query(`ALTER TABLE "fuel_logs" ADD COLUMN IF NOT EXISTS "technicianId" uuid`);

    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_fuel_logs_filledAt" ON "fuel_logs" ("filledAt")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_fuel_logs_technicianId" ON "fuel_logs" ("technicianId")`);

    // Owner link; ON DELETE SET NULL keeps the spend history if a technician is removed
    const [{ exists }] = await queryRunner.query(
      `SELECT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_fuel_logs_technician') AS "exists"`,
    );
    if (!exists) {
      await queryRunner.query(`
        ALTER TABLE "fuel_logs"
        ADD CONSTRAINT "FK_fuel_logs_technician"
        FOREIGN KEY ("technicianId") REFERENCES "technicians"("id") ON DELETE SET NULL
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "fuel_logs"`);
  }
}
