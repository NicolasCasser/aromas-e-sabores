import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { SaleService } from './sale.service';
import { Sale } from './entities/sale.entity';
import { SaleDTO } from './dto/sale.dto';
import { AddSaleItemByBarcodeInput } from './dto/add-sale-item-by-barcode.input';
import { SaleItemDTO } from './dto/sale-item.dto';
import { CompleteSaleInput } from './dto/complete-sale.input';

@Resolver(() => Sale)
export class SaleResolver {
  constructor(private readonly saleService: SaleService) {}

  @Mutation(() => SaleDTO)
  async createSale(): Promise<SaleDTO> {
    return this.saleService.create();
  }

  @Mutation(() => SaleItemDTO)
  async addItemByBarcode(@Args('data') data: AddSaleItemByBarcodeInput): Promise<SaleItemDTO> {
    return this.saleService.addItemByBarcode(data.saleId, data.barcode);
  }

  @Mutation(() => SaleDTO)
  async completeSale(@Args('data') data: CompleteSaleInput): Promise<SaleDTO> {
    return this.saleService.completeSale(data.saleId, data.paymentMethod);
  }

  @Mutation(() => SaleDTO)
  async cancelSale(@Args('id') id: string): Promise<SaleDTO> {
    return this.saleService.cancel(id);
  }

  @Query(() => [SaleDTO])
  async findAllSales(): Promise<SaleDTO[]> {
    return await this.saleService.findAll();
  }
}
