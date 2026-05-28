import { Field, Int, ObjectType } from '@nestjs/graphql';
import { BaseDTO } from 'src/modules/bases/dto/base.dto';
import { PaymentMethod } from '../enum/payment-methods.enum';
import { SaleStatus } from '../enum/sale-status.enum';
import { SaleItemDTO } from './sale-item.dto';

@ObjectType('Sale')
export class SaleDTO extends BaseDTO {
  @Field(() => Int)
  totalAmount!: number;

  @Field(() => PaymentMethod)
  paymentMethod!: PaymentMethod;

  @Field(() => SaleStatus)
  status!: SaleStatus;

  @Field(() => [SaleItemDTO])
  saleItens?: SaleItemDTO[];
}
