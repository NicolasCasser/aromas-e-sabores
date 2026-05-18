import { InputType, Int, Field } from '@nestjs/graphql';
import { TransactionType } from '../enum/transaction-type.enum';
import { IsEnum, IsInt, IsNotEmpty, IsOptional, Min } from 'class-validator';

@InputType('CreateStockTransactionInput')
export class CreateStockTransactionInput {
  @Field(() => TransactionType)
  @IsEnum(TransactionType)
  @IsNotEmpty({ message: 'O tipo de transação é obrigatório.' })
  type!: TransactionType;

  @Field(() => Int)
  @IsInt({ message: 'A quantidade deve ser um número inteiro.' })
  @IsNotEmpty({ message: 'Quantidade é um campo obrigatório.' })
  @Min(1, { message: 'Quantidade não pode ser 0 ou negativo' })
  quantity!: number;

  @Field(() => String, { nullable: true })
  @IsOptional()
  description?: string;

  @Field(() => String)
  @IsNotEmpty({ message: 'Id do produto é obrigatório.' })
  productId!: string;
}
