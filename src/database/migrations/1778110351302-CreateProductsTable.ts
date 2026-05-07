import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateProductsTable1778110351302 implements MigrationInterface {
    name = 'CreateProductsTable1778110351302'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "products" ("id" varchar PRIMARY KEY NOT NULL, "created_at" datetime NOT NULL DEFAULT (datetime('now')), "updated_at" datetime DEFAULT (datetime('now')), "deleted_at" datetime, "name" varchar(100) NOT NULL, "barcode" varchar(50), "unit_type" varchar CHECK( "unit_type" IN ('kg','un') ) NOT NULL, "price" integer NOT NULL, "current_stock" integer NOT NULL, CONSTRAINT "UQ_adfc522baf9d9b19cd7d9461b7e" UNIQUE ("barcode"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "products"`);
    }

}
