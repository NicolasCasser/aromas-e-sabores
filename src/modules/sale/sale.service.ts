import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateSaleInput } from './dto/create-sale.input';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Sale } from './entities/sale.entity';
import { SaleItem } from './entities/sale-item.entity';
import { ProductService } from '../product/product.service';
import { StockTransactionService } from '../stock-transaction/stock-transaction.service';
import { SaleStatus } from './enum/sale-status.enum';
import { TransactionType } from '../stock-transaction/enum/transaction-type.enum';

@Injectable()
export class SaleService {
  constructor(
    @InjectRepository(Sale)
    private readonly repository: Repository<Sale>,
    @InjectRepository(SaleItem)
    private readonly saleItemRepository: Repository<SaleItem>,

    private readonly productService: ProductService,
    private readonly stockTransactionService: StockTransactionService,
  ) {}

  async create(data: CreateSaleInput): Promise<Sale> {
    if (!data.items || data.items.length === 0) {
      throw new BadRequestException('A venda precisa ter pelo menos um item');
    }

    let totalAmount = 0;
    const itemsProcessed: {
      productId: string;
      quantity: number;
      unitPrice: number;
      subTotal: number;
    }[] = [];

    // Validar produtos, calcular subtotais e o total geral
    for (const item of data.items) {
      const product = await this.productService.findById(item.productId);

      // Checa se tem estoque antes de vender
      if (product.currentStock < item.quantity) {
        throw new BadRequestException(
          `Estoque insuficiente para o produto: ${product.name}`,
        );
      }

      const subTotal = product.price * item.quantity;
      totalAmount += subTotal;

      itemsProcessed.push({
        productId: product.id,
        quantity: item.quantity,
        unitPrice: product.price,
        subTotal: subTotal,
      });
    }

    // Criar a venda
    const newSale = this.repository.create({
      paymentMethod: data.paymentMethod,
      totalAmount: totalAmount,
      status: SaleStatus.COMPLETED,
    });

    const savedSale = await this.repository.save(newSale);

    // Salvar os items no banco de dados e dar baixa no estoque
    for (const item of itemsProcessed) {
      const newSaleItem = this.saleItemRepository.create({
        ...item,
        saleId: savedSale.id,
      });
      await this.saleItemRepository.save(newSaleItem);

      await this.stockTransactionService.create({
        productId: item.productId,
        quantity: item.quantity,
        type: TransactionType.OUT,
      });
    }

    // Retorna a venda completa com os items atrelados
    return await this.repository.findOneOrFail({
      where: { id: savedSale.id },
      relations: ['saleItens'],
    });
  }

  async findAll(): Promise<Sale[]> {
    return await this.repository.find({
      relations: ['saleItens'],
      order: { createdAt: 'DESC' },
    });
  }
}
