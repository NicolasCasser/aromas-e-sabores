import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Between,
  FindOptionsWhere,
  LessThanOrEqual,
  MoreThanOrEqual,
  Repository,
} from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Sale } from './entities/sale.entity';
import { SaleItem } from './entities/sale-item.entity';
import { StockTransactionService } from '../stock-transaction/stock-transaction.service';
import { SaleStatus } from './enum/sale-status.enum';
import { TransactionType } from '../stock-transaction/enum/transaction-type.enum';
import { UnitType } from '../product/enum/unit-type.enum';
import { Product } from '../product/entities/product.entity';
import { PaymentMethod } from './enum/payment-methods.enum';
import { FindAllSalesArgs } from './dto/find-all-sales.args';

@Injectable()
export class SaleService {
  constructor(
    @InjectRepository(Sale)
    private readonly repository: Repository<Sale>,

    private readonly stockTransactionService: StockTransactionService,
  ) {}

  async create(): Promise<Sale> {
    // Cria uma venda vazia, com status OPEN e total zerado
    const newSale = this.repository.create({
      status: SaleStatus.OPEN,
      totalAmount: 0,
    });

    return await this.repository.save(newSale);
  }

  async findAll(
    args: FindAllSalesArgs,
  ): Promise<{ items: Sale[]; totalCount: number }> {
    // Desestruturação dos argumentos e definição de valores padrão para paginação
    const {
      skip = 0,
      take = 20,
      startDate,
      endDate,
      status,
      paymentMethod,
    } = args;

    // Cria um objeto where que começa vazio
    // O TypeORM só vai filtrar o que for colocado dentro do objeto
    const where: FindOptionsWhere<Sale> = {};

    if (status) {
      where.status = status;
    }

    if (paymentMethod) {
      where.paymentMethod = paymentMethod;
    }

    // Lógica de filtro por período
    if (startDate && endDate) {
      // Retorna todas as vendas realizadas entre as datas
      where.createdAt = Between(startDate, endDate);
    } else if (startDate) {
      // Retorna as vendas realizadas a partir da data de ínicio
      where.createdAt = MoreThanOrEqual(startDate);
    } else if (endDate) {
      // Retorna as venda realizadas até a data de fim
      where.createdAt = LessThanOrEqual(endDate);
    }

    // Executa o findAndCount passando o where dinâmico
    const [items, totalCount] = await this.repository.findAndCount({
      where: where,
      skip: skip,
      take: take,
      order: { createdAt: 'DESC' },
    });

    return {
      items,
      totalCount,
    };
  }

  async cancel(id: string): Promise<Sale> {
    return await this.repository.manager.transaction(async (manager) => {
      const sale = await manager.findOne(Sale, {
        where: { id },
        relations: ['saleItens'],
      });

      if (!sale) {
        throw new NotFoundException('Venda não encontrada');
      }

      if (sale.status === SaleStatus.CANCELED) {
        throw new BadRequestException(
          `A venda com id ${sale.id} já está cancelada`,
        );
      }

      sale.status = SaleStatus.CANCELED;
      await manager.save(sale);

      for (const item of sale.saleItens) {
        await this.stockTransactionService.create(
          {
            type: TransactionType.IN,
            quantity: item.quantity,
            productId: item.productId,
          },
          manager,
        );
      }

      return sale;
    });
  }

  async addItemByBarcode(
    saleId: string,
    scannedBarcode: string,
  ): Promise<SaleItem> {
    return await this.repository.manager.transaction(async (manager) => {
      const sale = await manager.findOne(Sale, {
        where: { id: saleId },
      });

      if (!sale) {
        throw new NotFoundException('Venda não encontrada');
      }

      if (sale.status !== SaleStatus.OPEN) {
        throw new BadRequestException(
          'Apenas vendas abertas podem ter itens adicionados',
        );
      }

      let product: Product | null = null;
      let isScaleBarcode = false;
      let scaleTotalPrice = 0;

      if (scannedBarcode.startsWith('2') && scannedBarcode.length === 13) {
        const productCode = scannedBarcode.substring(1, 6);
        scaleTotalPrice = Number(scannedBarcode.substring(6, 12));

        product = await manager.getRepository(Product).findOne({
          where: { barcode: productCode },
        });

        if (product) {
          isScaleBarcode = true;
        } else {
          product = await manager.getRepository(Product).findOne({
            where: { barcode: scannedBarcode },
          });
        }
      } else {
        product = await manager.getRepository(Product).findOne({
          where: { barcode: scannedBarcode },
        });
      }

      if (!product) {
        throw new NotFoundException('Produto não encontrado');
      }

      let quantity = 0;
      let subTotal = 0;

      if (isScaleBarcode) {
        if (product.unitType === UnitType.UN) {
          throw new BadRequestException(
            'Conflito: Produto lido pela balança está cadastrado como unitário no sistema',
          );
        }

        subTotal = scaleTotalPrice;
        quantity = Number((subTotal / product.price).toFixed(3));
      } else {
        quantity = 1;
        subTotal = product.price;
      }

      await this.stockTransactionService.create(
        {
          productId: product.id,
          quantity,
          type: TransactionType.OUT,
        },
        manager,
      );

      const transactionalSaleItemRepo = manager.getRepository(SaleItem);

      const saleItem = transactionalSaleItemRepo.create({
        saleId: sale.id,
        productId: product.id,
        quantity,
        unitPrice: product.price,
        subTotal,
      });

      return await transactionalSaleItemRepo.save(saleItem);
    });
  }

  async completeSale(
    saleId: string,
    paymentMethod: PaymentMethod,
  ): Promise<Sale> {
    return await this.repository.manager.transaction(async (manager) => {
      const sale = await manager.findOne(Sale, {
        where: { id: saleId },
        relations: ['saleItens'],
      });

      if (!sale) {
        throw new NotFoundException('Venda não encontrada');
      }

      if (sale.status !== SaleStatus.OPEN) {
        throw new BadRequestException(
          'Apenas vendas abertas podem ser finalizadas',
        );
      }

      if (!sale.saleItens || sale.saleItens.length === 0) {
        throw new BadRequestException('Não é possível uma venda sem produtos');
      }

      const calculatedTotal = sale.saleItens.reduce(
        (acc, item) => acc + item.subTotal,
        0,
      );

      sale.totalAmount = calculatedTotal;
      sale.paymentMethod = paymentMethod;
      sale.status = SaleStatus.COMPLETED;

      return await manager.save(sale);
    });
  }
}
