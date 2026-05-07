import { CreateProductInput } from './create-product.input';
import { InputType, Field, Int, PartialType } from '@nestjs/graphql';

@InputType('UpdateUserInput')
export class UpdateProductInput extends PartialType(CreateProductInput) {}
