import { InputType, Field, ID } from '@nestjs/graphql';

@InputType('AddSaleItemByBarcodeInput')
export class AddSaleItemByBarcodeInput {
  @Field(() => ID)
  saleId!: string;

  @Field()
  barcode!: string;
}
