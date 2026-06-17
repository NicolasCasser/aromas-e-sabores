import { BaseEntity } from 'src/modules/bases/entities/base.entity';
import { Column, Entity, OneToMany } from 'typeorm';
import { UnitType } from '../enum/unit-type.enum';
import { StockTransaction } from 'src/modules/stock-transaction/entities/stock-transaction.entity';

@Entity('products')
export class Product extends BaseEntity {
  @Column({ type: 'varchar', length: 100, nullable: false })
  name!: string;

  @Column({ type: 'varchar', length: 50, nullable: true, unique: true })
  barcode?: string;

  @Column({
    name: 'unit_type',
    type: 'simple-enum',
    enum: UnitType,
    nullable: false,
  })
  unitType!: UnitType;

  @Column({ type: 'int', nullable: false })
  price!: number;

  @Column({
    name: 'current_stock',
    type: 'decimal',
    precision: 10,
    scale: 3,
    nullable: false,
  })
  currentStock!: number;

  // Um Produto tem Várias Transações
  @OneToMany(() => StockTransaction, (transaction) => transaction.product)
  stockTransactions!: StockTransaction[];
}
