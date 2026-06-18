import { Field, Int, ObjectType } from '@nestjs/graphql';
import { SaleDTO } from './sale.dto';

@ObjectType('PaginatedSalesDTO')
export class PaginatedSalesDTO {
  @Field(() => [SaleDTO])
  items!: SaleDTO[];

  @Field(() => Int)
  totalCount!: number;
}
