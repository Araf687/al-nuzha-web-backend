"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateServicesTable1789491600000 = void 0;
class CreateServicesTable1789491600000 {
    constructor() {
        this.name = 'CreateServicesTable1789491600000';
    }
    async up(queryRunner) {
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
        await queryRunner.query(`ALTER TABLE "services" ALTER COLUMN "startingPrice" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "services" ADD COLUMN IF NOT EXISTS "isCustomQuote" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "services" ADD COLUMN IF NOT EXISTS "priority" integer NOT NULL DEFAULT 0`);
    }
    async down(queryRunner) {
        await queryRunner.query(`DROP TABLE IF EXISTS "services"`);
    }
}
exports.CreateServicesTable1789491600000 = CreateServicesTable1789491600000;
//# sourceMappingURL=1789491600000-CreateServicesTable.js.map