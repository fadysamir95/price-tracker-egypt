import { Test, TestingModule } from '@nestjs/testing';
import { ProductsService } from './products.service';
import { AmazonService } from './amazon.service';
import { NoonService } from './noon.service';
import { BtechService } from './btech.service';
import { TwobService } from './twob.service';
import { StoreSearchService } from './product-search.types';

describe('ProductsService', () => {
  let service: ProductsService;
  let amazonService: jest.Mocked<StoreSearchService>;
  let noonService: jest.Mocked<StoreSearchService>;
  let btechService: jest.Mocked<StoreSearchService>;
  let twobService: jest.Mocked<StoreSearchService>;

  const createStoreSearchService = (): jest.Mocked<StoreSearchService> => ({
    search: jest.fn(),
  });

  beforeEach(async () => {
    amazonService = createStoreSearchService();
    noonService = createStoreSearchService();
    btechService = createStoreSearchService();
    twobService = createStoreSearchService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        { provide: AmazonService, useValue: amazonService },
        { provide: NoonService, useValue: noonService },
        { provide: BtechService, useValue: btechService },
        { provide: TwobService, useValue: twobService },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('returns products from every store sorted by price', async () => {
    amazonService.search.mockResolvedValue([
      {
        title: 'iPhone 16 Pro',
        price: 70000,
        image: 'amazon.jpg',
        url: 'https://amazon.eg/product',
        store: 'Amazon Egypt',
      },
    ]);
    noonService.search.mockResolvedValue([
      {
        title: 'iPhone 16',
        price: 60000,
        image: 'noon.jpg',
        url: 'https://noon.com/product',
        store: 'Noon Egypt',
      },
    ]);
    btechService.search.mockResolvedValue([]);
    twobService.search.mockResolvedValue([
      {
        title: 'iPhone 16 Plus',
        price: 65000,
        image: '2b.jpg',
        url: 'https://2b.com.eg/product',
        store: '2B',
      },
    ]);

    await expect(service.searchProducts('iphone 16')).resolves.toEqual([
      expect.objectContaining({ store: 'Noon Egypt', price: 60000 }),
      expect.objectContaining({ store: '2B', price: 65000 }),
      expect.objectContaining({ store: 'Amazon Egypt', price: 70000 }),
    ]);
  });

  it('continues searching when one store fails', async () => {
    amazonService.search.mockRejectedValue(new Error('blocked'));
    noonService.search.mockResolvedValue([]);
    btechService.search.mockResolvedValue([
      {
        title: 'iPhone 16',
        price: 62000,
        image: 'btech.jpg',
        url: 'https://btech.com/product',
        store: 'B.TECH',
      },
    ]);
    twobService.search.mockResolvedValue([]);

    await expect(service.searchProducts('iphone 16')).resolves.toEqual([
      expect.objectContaining({ store: 'B.TECH', price: 62000 }),
    ]);
  });
});
