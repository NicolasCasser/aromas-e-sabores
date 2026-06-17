import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixProductAndSaleStructure1781650731051 implements MigrationInterface {
  name = 'FixProductAndSaleStructure1781650731051';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "temporary_products" ("id" varchar PRIMARY KEY NOT NULL, "created_at" datetime NOT NULL DEFAULT (datetime('now')), "updated_at" datetime DEFAULT (datetime('now')), "deleted_at" datetime, "name" varchar(100) NOT NULL, "barcode" varchar(50), "unit_type" varchar CHECK( "unit_type" IN ('kg','un') ) NOT NULL, "price" integer NOT NULL, "current_stock" integer NOT NULL, CONSTRAINT "UQ_adfc522baf9d9b19cd7d9461b7e" UNIQUE ("barcode"))`,
    );
    await queryRunner.query(
      `INSERT INTO "temporary_products"("id", "created_at", "updated_at", "deleted_at", "name", "barcode", "unit_type", "price", "current_stock") SELECT "id", "created_at", "updated_at", "deleted_at", "name", "barcode", "unit_type", "price", "current_stock" FROM "products"`,
    );
    await queryRunner.query(`DROP TABLE "products"`);
    await queryRunner.query(
      `ALTER TABLE "temporary_products" RENAME TO "products"`,
    );
    await queryRunner.query(
      `CREATE TABLE "temporary_sale" ("id" varchar PRIMARY KEY NOT NULL, "created_at" datetime NOT NULL DEFAULT (datetime('now')), "updated_at" datetime DEFAULT (datetime('now')), "deleted_at" datetime, "totalAmount" integer NOT NULL, "paymentMethod" varchar CHECK( "paymentMethod" IN ('PIX','CREDIT_CARD','MONEY') ) NOT NULL, "status" varchar CHECK( "status" IN ('COMPLETED','CANCELED') ) NOT NULL)`,
    );
    await queryRunner.query(
      `INSERT INTO "temporary_sale"("id", "created_at", "updated_at", "deleted_at", "totalAmount", "paymentMethod", "status") SELECT "id", "created_at", "updated_at", "deleted_at", "totalAmount", "paymentMethod", "status" FROM "sale"`,
    );
    await queryRunner.query(`DROP TABLE "sale"`);
    await queryRunner.query(`ALTER TABLE "temporary_sale" RENAME TO "sale"`);
    await queryRunner.query(
      `CREATE TABLE "temporary_sale_item" ("id" varchar PRIMARY KEY NOT NULL, "created_at" datetime NOT NULL DEFAULT (datetime('now')), "updated_at" datetime DEFAULT (datetime('now')), "deleted_at" datetime, "quantity" integer NOT NULL, "subTotal" integer NOT NULL, "sale_id" varchar NOT NULL, "product_id" varchar NOT NULL, CONSTRAINT "FK_104266e6e0f51e5b33484efa280" FOREIGN KEY ("product_id") REFERENCES "products" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION, CONSTRAINT "FK_86634f729a5a169e50ab18b98a6" FOREIGN KEY ("sale_id") REFERENCES "sale" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)`,
    );
    await queryRunner.query(
      `INSERT INTO "temporary_sale_item"("id", "created_at", "updated_at", "deleted_at", "quantity", "subTotal", "sale_id", "product_id") SELECT "id", "created_at", "updated_at", "deleted_at", "quantity", "subTotal", "sale_id", "product_id" FROM "sale_item"`,
    );
    await queryRunner.query(`DROP TABLE "sale_item"`);
    await queryRunner.query(
      `ALTER TABLE "temporary_sale_item" RENAME TO "sale_item"`,
    );
    await queryRunner.query(
      `CREATE TABLE "temporary_sale_item" ("id" varchar PRIMARY KEY NOT NULL, "created_at" datetime NOT NULL DEFAULT (datetime('now')), "updated_at" datetime DEFAULT (datetime('now')), "deleted_at" datetime, "quantity" integer NOT NULL, "subTotal" integer NOT NULL, "sale_id" varchar NOT NULL, "product_id" varchar NOT NULL, "unit_price" integer NOT NULL, CONSTRAINT "FK_104266e6e0f51e5b33484efa280" FOREIGN KEY ("product_id") REFERENCES "products" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION, CONSTRAINT "FK_86634f729a5a169e50ab18b98a6" FOREIGN KEY ("sale_id") REFERENCES "sale" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)`,
    );
    await queryRunner.query(
      `INSERT INTO "temporary_sale_item"("id", "created_at", "updated_at", "deleted_at", "quantity", "subTotal", "sale_id", "product_id") SELECT "id", "created_at", "updated_at", "deleted_at", "quantity", "subTotal", "sale_id", "product_id" FROM "sale_item"`,
    );
    await queryRunner.query(`DROP TABLE "sale_item"`);
    await queryRunner.query(
      `ALTER TABLE "temporary_sale_item" RENAME TO "sale_item"`,
    );
    await queryRunner.query(
      `CREATE TABLE "temporary_products" ("id" varchar PRIMARY KEY NOT NULL, "created_at" datetime NOT NULL DEFAULT (datetime('now')), "updated_at" datetime DEFAULT (datetime('now')), "deleted_at" datetime, "name" varchar(100) NOT NULL, "barcode" varchar(50), "unit_type" varchar CHECK( "unit_type" IN ('kg','un') ) NOT NULL, "price" integer NOT NULL, "current_stock" decimal(10,3) NOT NULL, CONSTRAINT "UQ_adfc522baf9d9b19cd7d9461b7e" UNIQUE ("barcode"))`,
    );
    await queryRunner.query(
      `INSERT INTO "temporary_products"("id", "created_at", "updated_at", "deleted_at", "name", "barcode", "unit_type", "price", "current_stock") SELECT "id", "created_at", "updated_at", "deleted_at", "name", "barcode", "unit_type", "price", "current_stock" FROM "products"`,
    );
    await queryRunner.query(`DROP TABLE "products"`);
    await queryRunner.query(
      `ALTER TABLE "temporary_products" RENAME TO "products"`,
    );
    await queryRunner.query(
      `CREATE TABLE "temporary_sale_item" ("id" varchar PRIMARY KEY NOT NULL, "created_at" datetime NOT NULL DEFAULT (datetime('now')), "updated_at" datetime DEFAULT (datetime('now')), "deleted_at" datetime, "quantity" decimal(10,3) NOT NULL, "subTotal" integer NOT NULL, "sale_id" varchar NOT NULL, "product_id" varchar NOT NULL, "unit_price" integer NOT NULL, CONSTRAINT "FK_104266e6e0f51e5b33484efa280" FOREIGN KEY ("product_id") REFERENCES "products" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION, CONSTRAINT "FK_86634f729a5a169e50ab18b98a6" FOREIGN KEY ("sale_id") REFERENCES "sale" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)`,
    );
    await queryRunner.query(
      `INSERT INTO "temporary_sale_item"("id", "created_at", "updated_at", "deleted_at", "quantity", "subTotal", "sale_id", "product_id", "unit_price") SELECT "id", "created_at", "updated_at", "deleted_at", "quantity", "subTotal", "sale_id", "product_id", "unit_price" FROM "sale_item"`,
    );
    await queryRunner.query(`DROP TABLE "sale_item"`);
    await queryRunner.query(
      `ALTER TABLE "temporary_sale_item" RENAME TO "sale_item"`,
    );
    await queryRunner.query(
      `CREATE TABLE "temporary_sale" ("id" varchar PRIMARY KEY NOT NULL, "created_at" datetime NOT NULL DEFAULT (datetime('now')), "updated_at" datetime DEFAULT (datetime('now')), "deleted_at" datetime, "totalAmount" integer NOT NULL DEFAULT (0), "paymentMethod" varchar CHECK( "paymentMethod" IN ('PIX','CREDIT_CARD','MONEY') ), "status" varchar CHECK( "status" IN ('OPEN','COMPLETED','CANCELED') ) NOT NULL)`,
    );
    await queryRunner.query(
      `INSERT INTO "temporary_sale"("id", "created_at", "updated_at", "deleted_at", "totalAmount", "paymentMethod", "status") SELECT "id", "created_at", "updated_at", "deleted_at", "totalAmount", "paymentMethod", "status" FROM "sale"`,
    );
    await queryRunner.query(`DROP TABLE "sale"`);
    await queryRunner.query(`ALTER TABLE "temporary_sale" RENAME TO "sale"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "sale" RENAME TO "temporary_sale"`);
    await queryRunner.query(
      `CREATE TABLE "sale" ("id" varchar PRIMARY KEY NOT NULL, "created_at" datetime NOT NULL DEFAULT (datetime('now')), "updated_at" datetime DEFAULT (datetime('now')), "deleted_at" datetime, "totalAmount" integer NOT NULL, "paymentMethod" varchar CHECK( "paymentMethod" IN ('PIX','CREDIT_CARD','MONEY') ) NOT NULL, "status" varchar CHECK( "status" IN ('COMPLETED','CANCELED') ) NOT NULL)`,
    );
    await queryRunner.query(
      `INSERT INTO "sale"("id", "created_at", "updated_at", "deleted_at", "totalAmount", "paymentMethod", "status") SELECT "id", "created_at", "updated_at", "deleted_at", "totalAmount", "paymentMethod", "status" FROM "temporary_sale"`,
    );
    await queryRunner.query(`DROP TABLE "temporary_sale"`);
    await queryRunner.query(
      `ALTER TABLE "sale_item" RENAME TO "temporary_sale_item"`,
    );
    await queryRunner.query(
      `CREATE TABLE "sale_item" ("id" varchar PRIMARY KEY NOT NULL, "created_at" datetime NOT NULL DEFAULT (datetime('now')), "updated_at" datetime DEFAULT (datetime('now')), "deleted_at" datetime, "quantity" integer NOT NULL, "subTotal" integer NOT NULL, "sale_id" varchar NOT NULL, "product_id" varchar NOT NULL, "unit_price" integer NOT NULL, CONSTRAINT "FK_104266e6e0f51e5b33484efa280" FOREIGN KEY ("product_id") REFERENCES "products" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION, CONSTRAINT "FK_86634f729a5a169e50ab18b98a6" FOREIGN KEY ("sale_id") REFERENCES "sale" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)`,
    );
    await queryRunner.query(
      `INSERT INTO "sale_item"("id", "created_at", "updated_at", "deleted_at", "quantity", "subTotal", "sale_id", "product_id", "unit_price") SELECT "id", "created_at", "updated_at", "deleted_at", "quantity", "subTotal", "sale_id", "product_id", "unit_price" FROM "temporary_sale_item"`,
    );
    await queryRunner.query(`DROP TABLE "temporary_sale_item"`);
    await queryRunner.query(
      `ALTER TABLE "products" RENAME TO "temporary_products"`,
    );
    await queryRunner.query(
      `CREATE TABLE "products" ("id" varchar PRIMARY KEY NOT NULL, "created_at" datetime NOT NULL DEFAULT (datetime('now')), "updated_at" datetime DEFAULT (datetime('now')), "deleted_at" datetime, "name" varchar(100) NOT NULL, "barcode" varchar(50), "unit_type" varchar CHECK( "unit_type" IN ('kg','un') ) NOT NULL, "price" integer NOT NULL, "current_stock" integer NOT NULL, CONSTRAINT "UQ_adfc522baf9d9b19cd7d9461b7e" UNIQUE ("barcode"))`,
    );
    await queryRunner.query(
      `INSERT INTO "products"("id", "created_at", "updated_at", "deleted_at", "name", "barcode", "unit_type", "price", "current_stock") SELECT "id", "created_at", "updated_at", "deleted_at", "name", "barcode", "unit_type", "price", "current_stock" FROM "temporary_products"`,
    );
    await queryRunner.query(`DROP TABLE "temporary_products"`);
    await queryRunner.query(
      `ALTER TABLE "sale_item" RENAME TO "temporary_sale_item"`,
    );
    await queryRunner.query(
      `CREATE TABLE "sale_item" ("id" varchar PRIMARY KEY NOT NULL, "created_at" datetime NOT NULL DEFAULT (datetime('now')), "updated_at" datetime DEFAULT (datetime('now')), "deleted_at" datetime, "quantity" integer NOT NULL, "subTotal" integer NOT NULL, "sale_id" varchar NOT NULL, "product_id" varchar NOT NULL, CONSTRAINT "FK_104266e6e0f51e5b33484efa280" FOREIGN KEY ("product_id") REFERENCES "products" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION, CONSTRAINT "FK_86634f729a5a169e50ab18b98a6" FOREIGN KEY ("sale_id") REFERENCES "sale" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)`,
    );
    await queryRunner.query(
      `INSERT INTO "sale_item"("id", "created_at", "updated_at", "deleted_at", "quantity", "subTotal", "sale_id", "product_id") SELECT "id", "created_at", "updated_at", "deleted_at", "quantity", "subTotal", "sale_id", "product_id" FROM "temporary_sale_item"`,
    );
    await queryRunner.query(`DROP TABLE "temporary_sale_item"`);
    await queryRunner.query(
      `ALTER TABLE "sale_item" RENAME TO "temporary_sale_item"`,
    );
    await queryRunner.query(
      `CREATE TABLE "sale_item" ("id" varchar PRIMARY KEY NOT NULL, "created_at" datetime NOT NULL DEFAULT (datetime('now')), "updated_at" datetime DEFAULT (datetime('now')), "deleted_at" datetime, "quantity" integer NOT NULL, "unitPrice" integer NOT NULL, "subTotal" integer NOT NULL, "sale_id" varchar NOT NULL, "product_id" varchar NOT NULL, CONSTRAINT "FK_104266e6e0f51e5b33484efa280" FOREIGN KEY ("product_id") REFERENCES "products" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION, CONSTRAINT "FK_86634f729a5a169e50ab18b98a6" FOREIGN KEY ("sale_id") REFERENCES "sale" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)`,
    );
    await queryRunner.query(
      `INSERT INTO "sale_item"("id", "created_at", "updated_at", "deleted_at", "quantity", "subTotal", "sale_id", "product_id") SELECT "id", "created_at", "updated_at", "deleted_at", "quantity", "subTotal", "sale_id", "product_id" FROM "temporary_sale_item"`,
    );
    await queryRunner.query(`DROP TABLE "temporary_sale_item"`);
    await queryRunner.query(`ALTER TABLE "sale" RENAME TO "temporary_sale"`);
    await queryRunner.query(
      `CREATE TABLE "sale" ("id" varchar PRIMARY KEY NOT NULL, "created_at" datetime NOT NULL DEFAULT (datetime('now')), "updated_at" datetime DEFAULT (datetime('now')), "deleted_at" datetime, "totalAmount" integer NOT NULL, "paymentMethod" varchar CHECK( "paymentMethod" IN ('PIX','CREDIT_CARD','MONEY') ) NOT NULL, "status" varchar CHECK( "status" IN ('COMPLETED','CANCELED') ) NOT NULL)`,
    );
    await queryRunner.query(
      `INSERT INTO "sale"("id", "created_at", "updated_at", "deleted_at", "totalAmount", "paymentMethod", "status") SELECT "id", "created_at", "updated_at", "deleted_at", "totalAmount", "paymentMethod", "status" FROM "temporary_sale"`,
    );
    await queryRunner.query(`DROP TABLE "temporary_sale"`);
    await queryRunner.query(
      `ALTER TABLE "products" RENAME TO "temporary_products"`,
    );
    await queryRunner.query(
      `CREATE TABLE "products" ("id" varchar PRIMARY KEY NOT NULL, "created_at" datetime NOT NULL DEFAULT (datetime('now')), "updated_at" datetime DEFAULT (datetime('now')), "deleted_at" datetime, "name" varchar(100) NOT NULL, "barcode" varchar(50), "unit_type" varchar CHECK( "unit_type" IN ('kg','un') ) NOT NULL, "price" integer NOT NULL, "current_stock" integer NOT NULL, CONSTRAINT "UQ_adfc522baf9d9b19cd7d9461b7e" UNIQUE ("barcode"))`,
    );
    await queryRunner.query(
      `INSERT INTO "products"("id", "created_at", "updated_at", "deleted_at", "name", "barcode", "unit_type", "price", "current_stock") SELECT "id", "created_at", "updated_at", "deleted_at", "name", "barcode", "unit_type", "price", "current_stock" FROM "temporary_products"`,
    );
    await queryRunner.query(`DROP TABLE "temporary_products"`);
  }
}
