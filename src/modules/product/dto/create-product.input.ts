import { InputType, Int, Field } from '@nestjs/graphql';
import { UnitType } from '../enum/unit-type.enum';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

@InputType('CreateProductInput')
export class CreateProductInput {
  @Field(() => String)
  @IsString()
  @IsNotEmpty({ message: 'O nome do produto é obrigatório.' })
  name!: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  barcode?: string;

  @Field(() => UnitType)
  @IsEnum(UnitType)
  @IsNotEmpty({ message: 'O tipo do produto é obrigatório.' })
  unitType!: UnitType;

  @Field(() => Int)
  @IsInt({ message: 'O preço deve ser um número inteiro' })
  @IsNotEmpty({ message: 'O preço do produto é obrigatório.' })
  @Min(0, { message: 'O preço não pode ser negativo' })
  price!: number;

  @Field(() => Int)
  @IsInt({ message: 'O estoque deve ser um número inteiro' })
  @IsNotEmpty({ message: 'O estoque é obrigatório' })
  @Min(0, { message: 'Estoque não pode ser negativo' })
  currentStock!: number;
}
