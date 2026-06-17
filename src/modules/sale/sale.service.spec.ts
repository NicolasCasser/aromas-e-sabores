import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { SaleService } from './sale.service';
import { Sale } from './entities/sale.entity';
import { SaleItem } from './entities/sale-item.entity';
import { StockTransactionService } from '../stock-transaction/stock-transaction.service';
import { PaymentMethod } from './enum/payment-methods.enum';
import { TransactionType } from '../stock-transaction/enum/transaction-type.enum';
import { SaleStatus } from './enum/sale-status.enum';
import { UnitType } from '../product/enum/unit-type.enum';
import { Product } from '../product/entities/product.entity';

describe('SaleService', () => {
  let service: SaleService;
  let saleRepository: jest.Mocked<Repository<Sale>>;
  let stockTransactionService: jest.Mocked<StockTransactionService>;

  const mockEntityManager: any = {
    findOne: jest.fn(),
    save: jest.fn(),
    getRepository: jest.fn(),
  };

  beforeEach(async () => {
    const mockTransactionalSaleItemRepo = {
      create: jest.fn().mockImplementation((dto) => dto as SaleItem),
      save: jest.fn(),
    };

    const mockTransactionalProductRepo = {
      findOne: jest.fn(),
    };

    mockEntityManager.getRepository = jest.fn().mockImplementation((entity) => {
      if (entity === SaleItem) {
        return mockTransactionalSaleItemRepo;
      }
      if (entity === Product) {
        return mockTransactionalProductRepo;
      }
      return mockTransactionalSaleItemRepo;
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SaleService,
        {
          provide: getRepositoryToken(Sale),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
            manager: {
              transaction: jest.fn(
                async <T>(
                  cb: (manager: typeof mockEntityManager) => Promise<T>,
                ) => {
                  return cb(mockEntityManager);
                },
              ),
            },
          },
        },
        {
          provide: getRepositoryToken(SaleItem),
          useValue: {},
        },
        {
          provide: StockTransactionService,
          useValue: {
            create: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<SaleService>(SaleService);
    saleRepository = module.get(getRepositoryToken(Sale));
    stockTransactionService = module.get(StockTransactionService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('deve criar uma venda vazia com status OPEN e total zerado', async () => {
      // Arrange
      const mockSale = { status: SaleStatus.OPEN, totalAmount: 0 } as Sale;
      saleRepository.create.mockReturnValue(mockSale);
      saleRepository.save.mockResolvedValue({ ...mockSale, id: 'sale-id' });

      // Act
      const result = await service.create();

      // Assert
      expect(saleRepository.create).toHaveBeenCalledWith({
        status: SaleStatus.OPEN,
        totalAmount: 0,
      });
      expect(saleRepository.save).toHaveBeenCalledWith(mockSale);
      expect(result.id).toBe('sale-id');
    });
  });

  describe('cancel', () => {
    it('deve lançar NotFoundException se a venda não existir', async () => {
      mockEntityManager.findOne.mockResolvedValue(null);

      await expect(service.cancel('id-invalido')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.cancel('id-invalido')).rejects.toThrow(
        'Venda não encontrada',
      );
    });

    it('deve lançar BadRequestException se a venda já estiver cancelada', async () => {
      mockEntityManager.findOne.mockResolvedValue({
        id: 'venda-123',
        status: SaleStatus.CANCELED,
      });

      await expect(service.cancel('venda-123')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.cancel('venda-123')).rejects.toThrow(
        'A venda com id venda-123 já está cancelada',
      );
    });

    it('deve cancelar a venda e gerar transações de entrada no estoque para cada item', async () => {
      const mockSale = {
        id: 'venda-123',
        status: SaleStatus.COMPLETED,
        saleItens: [
          { productId: 'prod-1', quantity: 2 },
          { productId: 'prod-2', quantity: 5 },
        ],
      };

      mockEntityManager.findOne.mockResolvedValue(mockSale);
      mockEntityManager.save.mockResolvedValue(mockSale);
      stockTransactionService.create.mockResolvedValue({} as any);

      const result = await service.cancel('venda-123');

      expect(result.status).toBe(SaleStatus.CANCELED);
      expect(mockEntityManager.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: SaleStatus.CANCELED }),
      );

      expect(stockTransactionService.create).toHaveBeenCalledTimes(2);
      expect(stockTransactionService.create).toHaveBeenNthCalledWith(
        1,
        {
          type: TransactionType.IN,
          quantity: 2,
          productId: 'prod-1',
        },
        mockEntityManager,
      );
      expect(stockTransactionService.create).toHaveBeenNthCalledWith(
        2,
        {
          type: TransactionType.IN,
          quantity: 5,
          productId: 'prod-2',
        },
        mockEntityManager,
      );
    });
  });

  describe('addItemByBarcode', () => {
    it('Deve processar um produto pesado (KG) vindo da balança corretamente', async () => {
      const mockProduct = {
        id: 'prod-id',
        barcode: '00045',
        unitType: UnitType.KG,
        price: 1000,
      } as Product;

      mockEntityManager.findOne.mockResolvedValue({
        id: 'sale-1',
        status: SaleStatus.OPEN,
      });

      const mockTransactionalProductRepo = {
        findOne: jest.fn().mockResolvedValue(mockProduct),
      };

      const mockTransactionalSaleItemRepo = {
        create: jest.fn().mockImplementation((dto) => dto as SaleItem),
        save: jest.fn().mockResolvedValue({ id: 'item-1' }),
      };

      mockEntityManager.getRepository.mockImplementation((entity) => {
        if (entity === Product) {
          return mockTransactionalProductRepo;
        }
        if (entity === SaleItem) {
          return mockTransactionalSaleItemRepo;
        }
        return mockTransactionalSaleItemRepo;
      });

      const etiquetaBalanca = '2000450015509';
      await service.addItemByBarcode('sale-1', etiquetaBalanca);

      expect(mockEntityManager.findOne).toHaveBeenCalledWith(
        Sale,
        expect.objectContaining({
          where: { id: 'sale-1' },
          lock: { mode: 'pessimistic_write' },
        }),
      );

      expect(stockTransactionService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          productId: 'prod-id',
          quantity: 1.55,
          type: TransactionType.OUT,
        }),
        mockEntityManager,
      );
    });

    it('Deve processar um produto unitário (UN) de prateleira corretamente', async () => {
      const mockProduct = {
        id: 'prod-id',
        barcode: '7891020304050',
        unitType: UnitType.UN,
        price: 2500,
      } as Product;

      mockEntityManager.findOne.mockResolvedValue({
        id: 'sale-1',
        status: SaleStatus.OPEN,
      });

      const mockTransactionalProductRepo = {
        findOne: jest.fn().mockResolvedValue(mockProduct),
      };

      const mockTransactionalSaleItemRepo = {
        create: jest.fn().mockImplementation((dto) => dto as SaleItem),
        save: jest.fn().mockResolvedValue({ id: 'item-1' }),
      };

      mockEntityManager.getRepository.mockImplementation((entity) => {
        if (entity === Product) {
          return mockTransactionalProductRepo;
        }
        if (entity === SaleItem) {
          return mockTransactionalSaleItemRepo;
        }
        return mockTransactionalSaleItemRepo;
      });

      const etiquetaFabrica = '7891020304050';
      await service.addItemByBarcode('sale-1', etiquetaFabrica);

      expect(mockEntityManager.findOne).toHaveBeenCalledWith(
        Sale,
        expect.objectContaining({
          where: { id: 'sale-1' },
          lock: { mode: 'pessimistic_write' },
        }),
      );
    });

    it('Deve realizar fallback para UN se um código de fábrica começar com 2', async () => {
      mockEntityManager.findOne.mockResolvedValue({
        id: 'sale-1',
        status: SaleStatus.OPEN,
      });

      const mockTransactionalProductRepoFirstCall = {
        findOne: jest.fn().mockResolvedValue(null),
      };

      const mockTransactionalProductRepoSecondCall = {
        findOne: jest.fn().mockResolvedValue({
          id: 'prod-id',
          barcode: '2123456789012',
          unitType: UnitType.UN,
          price: 5000,
        }),
      };

      const mockTransactionalSaleItemRepo = {
        create: jest.fn().mockImplementation((dto) => dto as SaleItem),
        save: jest.fn().mockResolvedValue({ id: 'item-1' }),
      };

      let callCount = 0;
      mockEntityManager.getRepository.mockImplementation((entity) => {
        if (entity === Product) {
          callCount++;
          if (callCount === 1) {
            return mockTransactionalProductRepoFirstCall;
          }
          return mockTransactionalProductRepoSecondCall;
        }
        if (entity === SaleItem) {
          return mockTransactionalSaleItemRepo;
        }
        return mockTransactionalSaleItemRepo;
      });

      const etiquetaRara = '2123456789012';
      await service.addItemByBarcode('sale-1', etiquetaRara);

      expect(mockEntityManager.findOne).toHaveBeenCalledWith(
        Sale,
        expect.objectContaining({
          where: { id: 'sale-1' },
          lock: { mode: 'pessimistic_write' },
        }),
      );
    });

    it('Deve rejeitar a venda se a etiqueta da balança bater num produto cadastrado como UN', async () => {
      mockEntityManager.findOne.mockResolvedValue({
        id: 'sale-1',
        status: SaleStatus.OPEN,
      });

      const mockTransactionalProductRepo = {
        findOne: jest.fn().mockResolvedValue({
          id: 'prod-id',
          barcode: '00045',
          unitType: UnitType.UN,
          price: 1000,
        }),
      };

      const mockTransactionalSaleItemRepo = {
        create: jest.fn().mockImplementation((dto) => dto as SaleItem),
        save: jest.fn().mockResolvedValue({ id: 'item-1' }),
      };

      mockEntityManager.getRepository.mockImplementation((entity) => {
        if (entity === Product) {
          return mockTransactionalProductRepo;
        }
        if (entity === SaleItem) {
          return mockTransactionalSaleItemRepo;
        }
        return mockTransactionalSaleItemRepo;
      });

      const etiquetaBalanca = '2000450015509';
      await expect(
        service.addItemByBarcode('sale-1', etiquetaBalanca),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.addItemByBarcode('sale-1', etiquetaBalanca),
      ).rejects.toThrow(
        'Conflito: Produto lido pela balança está cadastrado como unitário no sistema',
      );
    });

    it('Deve rejeitar adição de item em venda que não está OPEN', async () => {
      mockEntityManager.findOne.mockResolvedValue({
        id: 'sale-1',
        status: SaleStatus.COMPLETED,
      });

      await expect(
        service.addItemByBarcode('sale-1', '7891020304050'),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.addItemByBarcode('sale-1', '7891020304050'),
      ).rejects.toThrow('Apenas vendas abertas podem ter itens adicionados');
    });
  });

  describe('completeSale', () => {
    it('Deve calcular o totalAmount corretamente somando os centavos e alterar o status', async () => {
      const mockSale = {
        id: 'sale-id',
        status: SaleStatus.OPEN,
        saleItens: [{ subTotal: 1550 }, { subTotal: 2500 }],
      };

      mockEntityManager.findOne.mockResolvedValue(mockSale);
      mockEntityManager.save.mockResolvedValue(mockSale);

      const result = await service.completeSale('sale-id', PaymentMethod.PIX);

      expect(result.totalAmount).toBe(4050);
      expect(result.status).toBe(SaleStatus.COMPLETED);
      expect(result.paymentMethod).toBe(PaymentMethod.PIX);
    });

    it('Deve rejeitar finalizar uma venda sem itens', async () => {
      mockEntityManager.findOne.mockResolvedValue({
        id: 'sale-id',
        status: SaleStatus.OPEN,
        saleItens: [],
      });

      await expect(
        service.completeSale('sale-id', PaymentMethod.PIX),
      ).rejects.toThrow(BadRequestException);
    });

    it('Deve rejeitar finalizar venda que não está OPEN', async () => {
      mockEntityManager.findOne.mockResolvedValue({
        id: 'sale-id',
        status: SaleStatus.COMPLETED,
        saleItens: [{ subTotal: 1000 }],
      });

      await expect(
        service.completeSale('sale-id', PaymentMethod.PIX),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.completeSale('sale-id', PaymentMethod.PIX),
      ).rejects.toThrow('Apenas vendas abertas podem ser finalizadas');
    });
  });
});
