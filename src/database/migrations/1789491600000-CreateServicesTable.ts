import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Creates the `services` table, or upgrades an older version of it.
 * Safe on any starting state: table missing, table without isCustomQuote/priority,
 * or already up to date (e.g. created earlier by synchronize in development).
 */
export class CreateServicesTable1789491600000 implements MigrationInterface {
  name = 'CreateServicesTable1789491600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "services" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "title" character varying NOT NULL,
        "startingPrice" numeric(10,2),
        "isCustomQuote" boolean NOT NULL DEFAULT false,
        "priority" integer NOT NULL DEFAULT 0,
        "thumbnail" character varying NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_ba2d347a3168a296416c6c5ccb2" PRIMARY KEY ("id")
      )
    `);

    // Upgrade a table created before isCustomQuote/priority existed
    await queryRunner.query(`ALTER TABLE "services" ALTER COLUMN "startingPrice" DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE "services" ADD COLUMN IF NOT EXISTS "isCustomQuote" boolean NOT NULL DEFAULT false`);
    await queryRunner.query(`ALTER TABLE "services" ADD COLUMN IF NOT EXISTS "priority" integer NOT NULL DEFAULT 0`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "services"`);
  }
}
