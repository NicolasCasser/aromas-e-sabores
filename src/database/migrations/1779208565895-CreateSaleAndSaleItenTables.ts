import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateSaleAndSaleItenTables1779208565895 implements MigrationInterface {
    name = 'CreateSaleAndSaleItenTables1779208565895'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "sale_item" ("id" varchar PRIMARY KEY NOT NULL, "created_at" datetime NOT NULL DEFAULT (datetime('now')), "updated_at" datetime DEFAULT (datetime('now')), "deleted_at" datetime, "quantity" integer NOT NULL, "unitPrice" integer NOT NULL, "subTotal" integer NOT NULL, "sale_id" varchar NOT NULL, "product_id" varchar NOT NULL)`);
        await queryRunner.query(`CREATE TABLE "sale" ("id" varchar PRIMARY KEY NOT NULL, "created_at" datetime NOT NULL DEFAULT (datetime('now')), "updated_at" datetime DEFAULT (datetime('now')), "deleted_at" datetime, "totalAmount" integer NOT NULL, "paymentMethod" varchar CHECK( "paymentMethod" IN ('PIX','CREDIT_CARD','MONEY') ) NOT NULL, "status" varchar CHECK( "status" IN ('COMPLETED','CANCELED') ) NOT NULL)`);
        await queryRunner.query(`CREATE TABLE "temporary_sale_item" ("id" varchar PRIMARY KEY NOT NULL, "created_at" datetime NOT NULL DEFAULT (datetime('now')), "updated_at" datetime DEFAULT (datetime('now')), "deleted_at" datetime, "quantity" integer NOT NULL, "unitPrice" integer NOT NULL, "subTotal" integer NOT NULL, "sale_id" varchar NOT NULL, "product_id" varchar NOT NULL, CONSTRAINT "FK_86634f729a5a169e50ab18b98a6" FOREIGN KEY ("sale_id") REFERENCES "sale" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION, CONSTRAINT "FK_104266e6e0f51e5b33484efa280" FOREIGN KEY ("product_id") REFERENCES "products" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "temporary_sale_item"("id", "created_at", "updated_at", "deleted_at", "quantity", "unitPrice", "subTotal", "sale_id", "product_id") SELECT "id", "created_at", "updated_at", "deleted_at", "quantity", "unitPrice", "subTotal", "sale_id", "product_id" FROM "sale_item"`);
        await queryRunner.query(`DROP TABLE "sale_item"`);
        await queryRunner.query(`ALTER TABLE "temporary_sale_item" RENAME TO "sale_item"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "sale_item" RENAME TO "temporary_sale_item"`);
        await queryRunner.query(`CREATE TABLE "sale_item" ("id" varchar PRIMARY KEY NOT NULL, "created_at" datetime NOT NULL DEFAULT (datetime('now')), "updated_at" datetime DEFAULT (datetime('now')), "deleted_at" datetime, "quantity" integer NOT NULL, "unitPrice" integer NOT NULL, "subTotal" integer NOT NULL, "sale_id" varchar NOT NULL, "product_id" varchar NOT NULL)`);
        await queryRunner.query(`INSERT INTO "sale_item"("id", "created_at", "updated_at", "deleted_at", "quantity", "unitPrice", "subTotal", "sale_id", "product_id") SELECT "id", "created_at", "updated_at", "deleted_at", "quantity", "unitPrice", "subTotal", "sale_id", "product_id" FROM "temporary_sale_item"`);
        await queryRunner.query(`DROP TABLE "temporary_sale_item"`);
        await queryRunner.query(`DROP TABLE "sale"`);
        await queryRunner.query(`DROP TABLE "sale_item"`);
    }

}
