import { Field, Int, ObjectType } from "@nestjs/graphql";
import { BaseDTO } from "src/modules/bases/dto/base.dto";
import { TransactionType } from "../enum/transaction-type.enum";

@ObjectType('StockTransaction')
export class StockTransactionDTO extends BaseDTO {
    @Field(() => TransactionType)
    type!: TransactionType;

    @Field(() => Int)
    quantity!: number;

    @Field({ nullable: true })
    description?: string;

    @Field()
    productId!: string;
}