import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateStockTransactionInput } from './dto/create-stock-transaction.input';
import { InjectRepository } from '@nestjs/typeorm';
import { StockTransaction } from './entities/stock-transaction.entity';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { Product } from '../product/entities/product.entity';
import { TransactionType } from './enum/transaction-type.enum';

@Injectable()
export class StockTransactionService {
  constructor(
    @InjectRepository(StockTransaction)
    private readonly repository: Repository<StockTransaction>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    private readonly dataSource: DataSource,
  ) {}

  async create(data: CreateStockTransactionInput, manager?: EntityManager): Promise<StockTransaction> {
    // Se recebeu um manager de fora, usa ele para rodar na mesma transação.
    if (manager) {
      return await this.processStockMovement(data, manager);
    }

    // Se não recebeu, abre uma transação própria e isolada.
    return await this.dataSource.transaction(async (transactionalEntityManager) => {
      return await this.processStockMovement(data, transactionalEntityManager);
    });
  }

  // Regra de Negócio Isolada (Método Privado)
  private async processStockMovement(data: CreateStockTransactionInput, manager: EntityManager): Promise<StockTransaction> {
    // Pega os repositórios diretamente do manager que está controlando o contexto atual
    const productRepository = manager.getRepository(Product);
    const stockTransactionRepository = manager.getRepository(StockTransaction);

    const product = await productRepository.findOneBy({ id: data.productId });

    if (!product) {
      throw new NotFoundException(`Produto com id ${data.productId} não encontrado`);
    }

    if (data.type === TransactionType.IN) {
      product.currentStock += data.quantity;
    } else {
      if (data.quantity > product.currentStock) {
        throw new BadRequestException('Estoque insuficiente.');
      }
      product.currentStock -= data.quantity;
    }

    // Salva as alterações usando os repositórios do manager
    await productRepository.save(product);

    const stockTransaction = stockTransactionRepository.create(data);
    return await stockTransactionRepository.save(stockTransaction);
  }

  async extractByProduct(id: string): Promise<StockTransaction[]> {
    const product = await this.productRepository.findOneBy({ id });

    if (!product) {
      throw new NotFoundException(`Produto com id ${id} não encontrado`);
    }

    return await this.repository.find({
      where: { productId: id }, // Filtra apenas as transações do produto solicitado
      order: { createdAt: 'DESC' }, // Ordena da data mais recente para a mais antiga
    });
  }
}
