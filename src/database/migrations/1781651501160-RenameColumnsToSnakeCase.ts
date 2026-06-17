import { MigrationInterface, QueryRunner } from 'typeorm';

export class RenameColumnsToSnakeCase1781490000000 implements MigrationInterface {
  // O número no nome da classe será o seu, mantenha-o!

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Tabela Sale Item
    await queryRunner.query(
      `ALTER TABLE "sale_item" RENAME COLUMN "subTotal" TO "sub_total"`,
    );

    // Tabela Sale
    await queryRunner.query(
      `ALTER TABLE "sale" RENAME COLUMN "totalAmount" TO "total_amount"`,
    );
    await queryRunner.query(
      `ALTER TABLE "sale" RENAME COLUMN "paymentMethod" TO "payment_method"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "sale_item" RENAME COLUMN "sub_total" TO "subTotal"`,
    );

    await queryRunner.query(
      `ALTER TABLE "sale" RENAME COLUMN "total_amount" TO "totalAmount"`,
    );
    await queryRunner.query(
      `ALTER TABLE "sale" RENAME COLUMN "payment_method" TO "paymentMethod"`,
    );
  }
}
