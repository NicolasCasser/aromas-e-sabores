import { Column, Entity, OneToMany } from 'typeorm';
import { PaymentMethod } from '../enum/payment-methods.enum';
import { SaleStatus } from '../enum/sale-status.enum';
import { BaseEntity } from 'src/modules/bases/entities/base.entity';
import { SaleItem } from './sale-item.entity';

@Entity('sale')
export class Sale extends BaseEntity {
  @Column({ name: 'total_amount', type: 'int', default: 0 })
  totalAmount!: number;

  @Column({
    name: 'payment_method',
    type: 'simple-enum',
    enum: PaymentMethod,
    nullable: true,
  })
  paymentMethod?: PaymentMethod;

  @Column({ type: 'simple-enum', enum: SaleStatus })
  status!: SaleStatus;

  @OneToMany(() => SaleItem, (saleItem) => saleItem.sale)
  saleItens!: SaleItem[];
}
