import { BaseEntity } from 'src/modules/bases/entities/base.entity';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { Sale } from './sale.entity';
import { Product } from 'src/modules/product/entities/product.entity';

@Entity('sale_item')
export class SaleItem extends BaseEntity {
  @Column({ type: 'decimal', precision: 10, scale: 3 })
  quantity!: number;

  @Column({ name: 'unit_price', type: 'int', })
  unitPrice!: number;

  @Column({ name: 'sub_total', type: 'int' })
  subTotal!: number;

  @Column({ name: 'sale_id', type: 'uuid', nullable: false })
  saleId!: string;

  @Column({ name: 'product_id', type: 'uuid', nullable: false })
  productId!: string;

  // Muitos itens pertencem a uma venda
  @ManyToOne(() => Sale, (sale) => sale.saleItens)
  @JoinColumn({ name: 'sale_id' })
  sale!: Sale;

  // Muitos itens podem referenciar um produto
  @ManyToOne(() => Product)
  @JoinColumn({ name: 'product_id' })
  product!: Product;
}
