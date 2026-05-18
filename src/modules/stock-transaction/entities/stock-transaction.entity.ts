import { BaseEntity } from 'src/modules/bases/entities/base.entity';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { TransactionType } from '../enum/transaction-type.enum';
import { Product } from 'src/modules/product/entities/product.entity';

@Entity('stock_transaction')
export class StockTransaction extends BaseEntity {
  @Column({ type: 'simple-enum', nullable: false })
  type!: TransactionType;

  @Column({ type: 'int', nullable: false })
  quantity!: number;

  @Column({ type: 'varchar', nullable: true })
  description?: string;

  @Column({ name: 'product_id', type: 'uuid', nullable: false })
  productId!: string;

  // Uma Transação pertence a Um Produto
  @ManyToOne(() => Product, (product) => product.stockTransactions)
  @JoinColumn({ name: 'product_id' })
  product!: Product;
}
