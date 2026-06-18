import { ArgsType, Field, Int } from '@nestjs/graphql';
import { PaymentMethod } from '../enum/payment-methods.enum';
import { SaleStatus } from '../enum/sale-status.enum';
import { IsDate, IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';

@ArgsType()
export class FindAllSalesArgs {
  // Paginação
  @Field(() => Int, { nullable: true, defaultValue: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  skip?: number;

  @Field(() => Int, { nullable: true, defaultValue: 20 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  take?: number;

  // Filtros
  @Field(() => Date, { nullable: true })
  @IsOptional()
  @IsDate()
  startDate?: Date;

  @Field(() => Date, { nullable: true })
  @IsOptional()
  @IsDate()
  endDate?: Date;

  @Field(() => SaleStatus, { nullable: true })
  @IsOptional()
  @IsEnum(SaleStatus)
  status?: SaleStatus;

  @Field(() => PaymentMethod, { nullable: true })
  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;
}
