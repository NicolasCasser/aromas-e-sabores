import { Field, ObjectType } from "@nestjs/graphql";
import { BaseDTO } from "src/modules/bases/dto/base.dto";
import { UnitType } from "../enum/unit-type.enum";

@ObjectType('Product')
export class ProductDTO extends BaseDTO {
    @Field()
    name!: string;

    @Field({ nullable: true })
    barcode?: string;

    @Field()
    unitType!: UnitType;

    @Field()
    price!: number;

    @Field()
    currentStock!: number;
}