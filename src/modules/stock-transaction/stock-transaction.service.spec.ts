import { Test, TestingModule } from '@nestjs/testing';
import { StockTransactionService } from './stock-transaction.service';
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { getRepositoryToken } from '@nestjs/typeorm';
import { StockTransaction } from './entities/stock-transaction.entity';
import { Product } from '../product/entities/product.entity';
import { DataSource } from 'typeorm';
import { TransactionType } from './enum/transaction-type.enum';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('StockTransactionService', () => {
  let service: StockTransactionService;

  // Falso manager do TypeORM para simular as respostas do banco
  const mockEntityManager: any = {
    findOneBy: jest.fn() as jest.Mock<any>,
    create: jest.fn().mockImplementation((dto) => dto),
    save: jest.fn() as jest.Mock<any>,
  };

  mockEntityManager.getRepository = jest.fn().mockReturnValue(mockEntityManager);

  // Falso DataSource que apenas executa o que tem dentro da transação passando o mockManager
  const mockDataSource = {
    transaction: jest.fn(
      async (cb: (manager: typeof mockEntityManager) => Promise<unknown>) => {
        return cb(mockEntityManager);
      },
    ),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StockTransactionService,
        // Injetando as dependências falsas para o Service não tentar conectar no SQLite real
        {
          provide: getRepositoryToken(StockTransaction),
          useValue: {},
        },
        {
          provide: getRepositoryToken(Product),
          useValue: {},
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<StockTransactionService>(StockTransactionService);

    // Limpa o histórico dos mocks antes de cada teste
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('deve somar o estoque e registrar a transação quando for do tipo IN', async () => {
      // Arrange
      const mockProduct = {
        id: 'uuid-do-produto',
        currentStock: 10,
      } as Product; // "as Product" é usado para não precisar preencher todos os campos exigidos pela entidade

      const input = {
        productId: 'uuid-do-produto',
        type: TransactionType.IN,
        quantity: 5,
      };

      // Diz para o falso manager que quando ele buscar o produto deve retornar o mockProduct de estoque 10
      mockEntityManager.findOneBy.mockResolvedValue(mockProduct);
      // Finge que o save da transação retorna a própria transação com um ID falso gerado
      mockEntityManager.save.mockResolvedValue({
        id: 'uuid-da-transacao',
        ...input,
      });

      // Act
      const result = await service.create(input);

      // Assert
      // Garante que o produto foi salvo e que a matématica de 10 + 5 funcionou
      expect(mockEntityManager.save).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'uuid-do-produto',
          currentStock: 15,
        }),
      );
      // Garante que a função retornou a transação criada
      expect(result.id).toBe('uuid-da-transacao');
    });

    it('deve subtrair o estoque e registrar a transação quando for do tipo OUT', async () => {
      // Arrange
      const mockProduct = {
        id: 'uuid-do-produto',
        currentStock: 10,
      } as Product;

      const input = {
        productId: 'uuid-do-produto',
        type: TransactionType.OUT,
        quantity: 5,
      };

      mockEntityManager.findOneBy.mockResolvedValue(mockProduct);
      mockEntityManager.save.mockResolvedValue({
        id: 'uuid-da-transacao',
        ...input,
      });

      // Act
      const result = await service.create(input);

      // Assert
      expect(mockEntityManager.save).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'uuid-do-produto',
          currentStock: 5,
        }),
      );
      expect(result.id).toBe('uuid-da-transacao');
    });
  });

  it('deve lançar NotFoundException se o produto não for encontrado', async () => {
    // Arrange
    const input = {
      productId: 'id-inexistente',
      type: TransactionType.IN,
      quantity: 5,
    };

    // Simula o banco retornando null
    mockEntityManager.findOneBy.mockResolvedValue(null);

    // Act & Assert
    // Espera que ao chamar o create a promessa seja rejeitada com o erro NotFoundException
    await expect(service.create(input)).rejects.toThrow(NotFoundException);
    // Garante que o manager.save nunca foi chamado
    expect(mockEntityManager.save).not.toHaveBeenCalled();
  });

  it('deve lançar BadRequestException ao tentar registrar uma saída (OUT) maior que o currentStock do produto', async () => {
    // Arrange
    const mockProduct = {
      id: 'uuid-do-produto',
      currentStock: 5,
    } as Product;

    const input = {
      productId: 'uuid-do-produto',
      type: TransactionType.OUT,
      quantity: 10,
    };

    mockEntityManager.findOneBy.mockResolvedValue(mockProduct);

    // Act & Assert
    await expect(service.create(input)).rejects.toThrow(BadRequestException);
    expect(mockEntityManager.save).not.toHaveBeenCalled();
  });
});
