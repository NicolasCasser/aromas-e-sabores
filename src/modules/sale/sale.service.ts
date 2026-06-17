import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Sale } from './entities/sale.entity';
import { SaleItem } from './entities/sale-item.entity';
import { ProductService } from '../product/product.service';
import { StockTransactionService } from '../stock-transaction/stock-transaction.service';
import { SaleStatus } from './enum/sale-status.enum';
import { TransactionType } from '../stock-transaction/enum/transaction-type.enum';
import { UnitType } from '../product/enum/unit-type.enum';
import { Product } from '../product/entities/product.entity';
import { PaymentMethod } from './enum/payment-methods.enum';

@Injectable()
export class SaleService {
  constructor(
    @InjectRepository(Sale)
    private readonly repository: Repository<Sale>,
  
    private readonly productService: ProductService,
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

  async findAll(): Promise<Sale[]> {
    return await this.repository.find({
      relations: ['saleItens'],
      order: { createdAt: 'DESC' },
    });
  }

  async cancel(id: string): Promise<Sale> {
    // Necessário findOne por que findOneBy por padrão não trás os relacionamentos
    const sale = await this.repository.findOne({
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

    for (const item of sale.saleItens) {
      await this.stockTransactionService.create({
        type: TransactionType.IN,
        quantity: item.quantity,
        productId: item.productId,
      });
    }

    await this.repository.save(sale);

    return sale;
  }

  async addItemByBarcode(saleId: string, scannedBarcode: string): Promise<SaleItem> {
    // Verifica se a venda existe
    const sale = await this.repository.findOne({ where: { id: saleId } });
    
    if(!sale) {
      throw new NotFoundException('Venda não encontrada');
    }

    let product: Product | null = null;
    let isScaleBarcode = false;
    let scaleTotalPrice = 0;

    // Identifica se tem padrão de balança (começa com 2 e tem 13 dígitos)
    if (scannedBarcode.startsWith('2') && scannedBarcode.length === 13) {
      const productCode = scannedBarcode.substring(1, 6);
      scaleTotalPrice = Number(scannedBarcode.substring(6, 12)); 

      // Tenta buscar o produto pelo código interno de 5 dígitos fatiado
      product = await this.productService.findByBarcode(productCode);

      if (product) {
        isScaleBarcode = true;
      } else {
        // Não achou fatiado, tenta buscar pelo código inteiro original
        product = await this.productService.findByBarcode(scannedBarcode);
      }
    } else {
      // Se não for balança, busca o produto padrão de prateleira
      product = await this.productService.findByBarcode(scannedBarcode);
    }

    // Se após todas as tentativas não achar o produto, bloqueia a venda
    if (!product) {
      throw new NotFoundException('Produto não encontrado');
    }

    // Validação de Regras de Negócio e Cálculo
    let quantity = 0;
    let subTotal = 0;

    if (isScaleBarcode) {
      // Produto achado pelo fatiamento, mas cadastrado errado pela loja como UN
      if (product.unitType === UnitType.UN) {
        throw new BadRequestException('Conflito: Produto lido pela balança está cadastrado como unitário no sistema');
      }

      // Produto pesado (KG)
      subTotal = scaleTotalPrice; // Confia no valor que veio impresso na etiqueta
      quantity = Number((subTotal / product.price).toFixed(3)) // Calcula o peso fixo exato para baixar no estoque
    } else {
      // Produto unitário
      quantity = 1;
      subTotal = product.price; // Cobra o valor exato que está no banco de dados
    }

    return await this.repository.manager.transaction(async (transactionEntityManager) => {
      // Baixa o estoque registrando a transação
      await this.stockTransactionService.create({
        productId: product.id,
        quantity,
        type: TransactionType.OUT,
      }, transactionEntityManager);

      const transactionalSaleItemRepo = transactionEntityManager.getRepository(SaleItem);
  
      const saleItem = transactionalSaleItemRepo.create({
        saleId: sale.id,
        productId: product.id,
        quantity,
        unitPrice: product.price,
        subTotal,
      });
    
      return await transactionalSaleItemRepo.save(saleItem);;
    });
  }

  async completeSale(saleId: string, paymentMethod: PaymentMethod): Promise<Sale> {
    // Busca a venda e já traz os itens athis.repository.manager.transaction.ssociados a ela para poder somar
    const sale = await this.repository.findOne({
      where: { id: saleId },
      relations: ['saleItens'],
    });

    if (!sale) {
      throw new NotFoundException('Venda não encontrada');
    }

    if (sale.status !== SaleStatus.OPEN) {
      throw new BadRequestException('Apenas vendas abertas podem ser finalizadas');
    }
    
    if (!sale.saleItens || sale.saleItens.length === 0) {
      throw new BadRequestException('Não é possível uma venda sem produtos');
    }

    // Soma o subtotal de todos os itens bipados no caixa
    const calculatedTotal = sale.saleItens.reduce((acc, item) => acc + item.subTotal, 0);

    sale.totalAmount = calculatedTotal;
    sale.paymentMethod = paymentMethod;
    sale.status = SaleStatus.COMPLETED;

    return await this.repository.save(sale);
  }
}
