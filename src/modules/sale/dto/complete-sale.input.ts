import { InputType, Field, ID } from '@nestjs/graphql';
import { PaymentMethod } from '../enum/payment-methods.enum';

@InputType('CompleteSaleInput')
export class CompleteSaleInput {
  @Field(() => ID)
  saleId!: string;

  @Field(() => PaymentMethod)
  paymentMethod!: PaymentMethod;
}
