import { Test, TestingModule } from '@nestjs/testing';
import { SaleResolver } from './sale.resolver';
import { SaleService } from './sale.service';
import { PaymentMethod } from './enum/payment-methods.enum';
import { SaleStatus } from './enum/sale-status.enum';
import { SaleItem } from './entities/sale-item.entity';
import { Sale } from './entities/sale.entity';

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
            addItemByBarcode: jest.fn(),
            completeSale: jest.fn(),
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
      const expectedSale = {
        id: '1',
        totalAmount: 0,
        status: SaleStatus.OPEN,
        createdAt: new Date(),
        saleItens: [],
      };

      service.create.mockResolvedValue(expectedSale);

      // Act
      const result = await resolver.createSale();

      // Assert
      expect(result).toEqual(expectedSale);
      expect(service.create).toHaveBeenCalledTimes(1);
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

  describe('addItemByBarcode', () => {
    it('deve repassar o saleId e o barcode para o SaleService e retornar o item salvo', async () => {
      // Arrange
      const mockSaleItem = {
        id: 'item-1',
        saleId: 'sale-1',
        productId: 'prod-1',
        quantity: 1.55,
        unitPrice: 1000,
        subTotal: 1550,
      } as SaleItem;

      service.addItemByBarcode.mockResolvedValue(mockSaleItem);

      // Act
      const result = await resolver.addItemByBarcode({
        saleId: 'sale-1',
        barcode: '2000450015509',
      });

      // Assert
      expect(result).toEqual(mockSaleItem);
      expect(service.addItemByBarcode).toHaveBeenCalledTimes(1);
      expect(service.addItemByBarcode).toHaveBeenCalledWith(
        'sale-1',
        '2000450015509',
      );
    });
  });

  describe('completeSale', () => {
    it('deve repassar o saleId e o método de pagamento para o SaleService e retornar a venda finalizada', async () => {
      // Arrange
      const mockCompletedSale = {
        id: 'sale-1',
        totalAmount: 4050,
        paymentMethod: PaymentMethod.PIX,
        status: SaleStatus.COMPLETED,
      } as Sale;

      service.completeSale.mockResolvedValue(mockCompletedSale);

      // Act
      const result = await resolver.completeSale({
        saleId: 'sale-1',
        paymentMethod: PaymentMethod.PIX,
      });

      // Assert
      expect(result).toEqual(mockCompletedSale);
      expect(service.completeSale).toHaveBeenCalledTimes(1);
      expect(service.completeSale).toHaveBeenCalledWith(
        'sale-1',
        PaymentMethod.PIX,
      );
    });
  });
});
