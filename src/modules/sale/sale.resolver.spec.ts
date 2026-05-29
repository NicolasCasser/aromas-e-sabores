import { Test, TestingModule } from '@nestjs/testing';
import { SaleResolver } from './sale.resolver';
import { SaleService } from './sale.service';
import { PaymentMethod } from './enum/payment-methods.enum';
import { SaleStatus } from './enum/sale-status.enum';

describe('SaleResolver', () => {
  let resolver: SaleResolver;
  let service: jest.Mocked<SaleService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SaleResolver,
        {
          provide: SaleService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            cancel: jest.fn(),
          },
        },
      ],
    }).compile();

    resolver = module.get<SaleResolver>(SaleResolver);
    service = module.get(SaleService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  describe('createSale', () => {
    it('deve chamar o SaleService.create com os dados de entrada e retornar a venda criada', async () => {
      // Arrange
      const input = {
        paymentMethod: PaymentMethod.MONEY,
        items: [{ productId: '1', quantity: 2 }],
      };

      const expectedSale = {
        id: '1',
        totalAmount: 1000,
        paymentMethod: PaymentMethod.MONEY,
        status: SaleStatus.COMPLETED,
        createdAt: new Date(),
        saleItens: [],
      };

      service.create.mockResolvedValue(expectedSale);

      // Act
      const result = await resolver.createSale(input);

      // Assert
      expect(result).toEqual(expectedSale);
      expect(service.create).toHaveBeenCalledTimes(1);
      expect(service.create).toHaveBeenCalledWith(input);
    });
  });

  describe('findAllSales', () => {
    it('deve chamar o SaleService.findAll e retornar o histórico de vendas', async () => {
      // Arrange
      const expectedList = [
        {
          id: 'sale-1',
          totalAmount: 1000,
          paymentMethod: PaymentMethod.PIX,
          status: SaleStatus.COMPLETED,
          createdAt: new Date(),
          saleItens: [],
        },
        {
          id: 'sale-2',
          totalAmount: 500,
          paymentMethod: PaymentMethod.MONEY,
          status: SaleStatus.COMPLETED,
          createdAt: new Date(),
          saleItens: [],
        },
      ];

      service.findAll.mockResolvedValue(expectedList);

      // Act
      const result = await resolver.findAllSales();

      // Assert
      expect(result).toEqual(expectedList);
      expect(service.findAll).toHaveBeenCalledTimes(1);
    });
  });

  describe('cancelSale', () => {
    it('deve chamar o SaleService.cancel com o ID fornecido e retornar a venda cancelada', async () => {
      // Arrange
      const mockSale = {
        id: 'venda-123',
        status: SaleStatus.CANCELED,
      };

      service.cancel.mockResolvedValue(mockSale as any);

      // Act
      const result = await resolver.cancelSale('venda-123');

      // Assert
      expect(result).toEqual(mockSale);
      expect(service.cancel).toHaveBeenCalledTimes(1);
      expect(service.cancel).toHaveBeenCalledWith('venda-123');
    });
  });
});
