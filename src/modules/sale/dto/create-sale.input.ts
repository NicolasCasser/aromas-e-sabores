import { InputType, Int, Field } from '@nestjs/graphql';

@InputType()
export class CreateSaleInput {
  @Field(() => Int, { description: 'Example field (placeholder)' })
  exampleField: number;
}
