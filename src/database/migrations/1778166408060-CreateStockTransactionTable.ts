import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateStockTransactionTable1778166408060 implements MigrationInterface {
  name = 'CreateStockTransactionTable1778166408060';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "stock_transaction" ("id" varchar PRIMARY KEY NOT NULL, "created_at" datetime NOT NULL DEFAULT (datetime('now')), "updated_at" datetime DEFAULT (datetime('now')), "deleted_at" datetime, "type" varchar NOT NULL, "quantity" integer NOT NULL, "description" varchar, "product_id" varchar NOT NULL)`,
    );
    await queryRunner.query(
      `CREATE TABLE "temporary_stock_transaction" ("id" varchar PRIMARY KEY NOT NULL, "created_at" datetime NOT NULL DEFAULT (datetime('now')), "updated_at" datetime DEFAULT (datetime('now')), "deleted_at" datetime, "type" varchar NOT NULL, "quantity" integer NOT NULL, "description" varchar, "product_id" varchar NOT NULL, CONSTRAINT "FK_c0ba07239ce59e8c992a3d5f12b" FOREIGN KEY ("product_id") REFERENCES "products" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)`,
    );
    await queryRunner.query(
      `INSERT INTO "temporary_stock_transaction"("id", "created_at", "updated_at", "deleted_at", "type", "quantity", "description", "product_id") SELECT "id", "created_at", "updated_at", "deleted_at", "type", "quantity", "description", "product_id" FROM "stock_transaction"`,
    );
    await queryRunner.query(`DROP TABLE "stock_transaction"`);
    await queryRunner.query(
      `ALTER TABLE "temporary_stock_transaction" RENAME TO "stock_transaction"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "stock_transaction" RENAME TO "temporary_stock_transaction"`,
    );
    await queryRunner.query(
      `CREATE TABLE "stock_transaction" ("id" varchar PRIMARY KEY NOT NULL, "created_at" datetime NOT NULL DEFAULT (datetime('now')), "updated_at" datetime DEFAULT (datetime('now')), "deleted_at" datetime, "type" varchar NOT NULL, "quantity" integer NOT NULL, "description" varchar, "product_id" varchar NOT NULL)`,
    );
    await queryRunner.query(
      `INSERT INTO "stock_transaction"("id", "created_at", "updated_at", "deleted_at", "type", "quantity", "description", "product_id") SELECT "id", "created_at", "updated_at", "deleted_at", "type", "quantity", "description", "product_id" FROM "temporary_stock_transaction"`,
    );
    await queryRunner.query(`DROP TABLE "temporary_stock_transaction"`);
    await queryRunner.query(`DROP TABLE "stock_transaction"`);
  }
}
