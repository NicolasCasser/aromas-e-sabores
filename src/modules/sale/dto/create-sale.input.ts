import { InputType, Int, Field } from '@nestjs/graphql';
import { PaymentMethod } from '../enum/payment-methods.enum';
import { CreateSaleItemInput } from './create-sale-item.input';

@InputType('CreateSaleInput')
export class CreateSaleInput {
  @Field(() => PaymentMethod )
  paymentMethod!: PaymentMethod;

  @Field(() => [CreateSaleItemInput])
  items!: CreateSaleItemInput[];
}
