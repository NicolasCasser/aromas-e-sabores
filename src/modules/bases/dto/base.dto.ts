import { Field, ID, InterfaceType, ObjectType } from '@nestjs/graphql';

@InterfaceType()
@ObjectType('BaseDTO')
export abstract class BaseDTO {
  @Field(() => ID)
  id?: string;

  @Field()
  createdAt?: Date;

  @Field({ nullable: true })
  updatedAt?: Date;

  @Field({ nullable: true })
  deletedAt?: Date;
}
