import { CreateSaleInput } from './create-sale.input';
import { InputType, Field, Int, PartialType } from '@nestjs/graphql';

@InputType()
export class UpdateSaleInput extends PartialType(CreateSaleInput) {
  @Field(() => Int)
  id: number;
}
