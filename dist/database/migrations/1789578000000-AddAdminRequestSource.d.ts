import { MigrationInterface, QueryRunner } from 'typeorm';
export declare class AddAdminRequestSource1789578000000 implements MigrationInterface {
    name: string;
    up(queryRunner: QueryRunner): Promise<void>;
    down(): Promise<void>;
}
