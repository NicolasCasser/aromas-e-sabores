import { Field, ID, Int, ObjectType } from '@nestjs/graphql';
import { BaseDTO } from 'src/modules/bases/dto/base.dto';

@ObjectType('SaleItem')
export class SaleItemDTO extends BaseDTO {
  @Field(() => Int)
  quantity!: number;

  @Field(() => Int)
  unitPrice!: number;

  @Field(() => Int)
  subTotal!: number;

  @Field(() => ID)
  saleId!: string;

  @Field(() => ID)
  productId!: string;
}
