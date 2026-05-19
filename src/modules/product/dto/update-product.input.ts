import { CreateProductInput } from './create-product.input';
import { InputType, PartialType, OmitType } from '@nestjs/graphql';

@InputType('UpdateProductInput')
export class UpdateProductInput extends OmitType(
  PartialType(CreateProductInput),
  ['currentStock'],
) {}
