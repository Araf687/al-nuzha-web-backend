"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddAdminRequestSource1789578000000 = void 0;
class AddAdminRequestSource1789578000000 {
    constructor() {
        this.name = 'AddAdminRequestSource1789578000000';
    }
    async up(queryRunner) {
        await queryRunner.query(`ALTER TYPE "service_requests_source_enum" ADD VALUE IF NOT EXISTS 'admin'`);
    }
    async down() {
    }
}
exports.AddAdminRequestSource1789578000000 = AddAdminRequestSource1789578000000;
//# sourceMappingURL=1789578000000-AddAdminRequestSource.js.map