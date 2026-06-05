import { Injectable } from '@nestjs/common';
import { AmazonService } from './amazon.service';
import { NoonService } from './noon.service';
import { BtechService } from './btech.service';
import { TwobService } from './twob.service';
import { Product, StoreSearchService } from './product-search.types';

type StoreSearchProvider = {
  name: string;
  service: StoreSearchService;
};

const STORE_SEARCH_TIMEOUT_MS = 45_000;

@Injectable()
export class ProductsService {
  private readonly storeSearchProviders: StoreSearchProvider[];

  constructor(
    private readonly amazonService: AmazonService,
    private readonly noonService: NoonService,
    private readonly btechService: BtechService,
    private readonly twobService: TwobService,
  ) {
    this.storeSearchProviders = [
      { name: 'AMAZON', service: this.amazonService },
      { name: 'NOON', service: this.noonService },
      { name: 'BTECH', service: this.btechService },
      { name: '2B', service: this.twobService },
    ];
  }

  async searchProducts(query: string): Promise<Product[]> {
    console.log('PRODUCTS SERVICE CALLED');
    console.log('QUERY:', query);

    const results = await Promise.all(
      this.storeSearchProviders.map((provider) =>
        this.searchStore(provider, query),
      ),
    );

    return results.flat().sort((a, b) => a.price - b.price);
  }

  private async searchStore(
    provider: StoreSearchProvider,
    query: string,
  ): Promise<Product[]> {
    let timeoutId: NodeJS.Timeout | undefined;

    try {
      const timeoutPromise = new Promise<Product[]>((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(
            new Error(
              `${provider.name} search timed out after ${
                STORE_SEARCH_TIMEOUT_MS / 1000
              }s`,
            ),
          );
        }, STORE_SEARCH_TIMEOUT_MS);
      });

      const results = await Promise.race([
        provider.service.search(query),
        timeoutPromise,
      ]);
      console.log(`${provider.name} COUNT:`, results.length);
      return results;
    } catch (error) {
      console.log(`${provider.name} FAILED`);
      console.log((error as Error).message);
      return [];
    } finally {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    }
  }
}
