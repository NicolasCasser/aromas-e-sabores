import { InputType, Int, Field } from '@nestjs/graphql';

@InputType('CreateSaleItemInput')
export class CreateSaleItemInput {
  @Field()
  productId!: string;

  @Field(() => Int)
  quantity!: number;
}