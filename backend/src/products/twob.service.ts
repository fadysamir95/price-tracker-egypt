import { Injectable } from '@nestjs/common';
import { chromium } from 'playwright';
import { Product, StoreSearchService } from './product-search.types';

@Injectable()
export class TwobService implements StoreSearchService {
  async search(query: string): Promise<Product[]> {
    console.log('2B SERVICE CALLED');

    const browser = await chromium.launch({
      headless: true,
    });

    const page = await browser.newPage();

    const searchUrl = `https://2b.com.eg/en/catalogsearch/result/?q=${encodeURIComponent(query)}`;

    await page.goto(searchUrl, {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });

    await page.waitForTimeout(3000);

    const products = await page.$$eval('.product-item', (items): Product[] => {
      return items.slice(0, 10).map((item) => {
        const title =
          item.querySelector('.product-item-link')?.textContent?.trim() || '';

        const priceText =
          item.querySelector('.price')?.textContent?.trim() || '';

        const image = item.querySelector('img')?.getAttribute('src') || '';

        const url =
          item.querySelector('.product-item-link')?.getAttribute('href') || '';

        const cleanPrice = Number(priceText.replace(/[^\d.]/g, ''));

        return {
          title,
          price: cleanPrice,
          image,
          url,
          store: '2B',
        };
      });
    });

    await browser.close();

    const excludedWords = [
      'case',
      'cover',
      'جراب',
      'كفر',
      'protector',
      'screen protector',
      'charger',
      'cable',
      'adapter',
      'headphone',
      'earbuds',
      'سماعة',
      'شاحن',
      'كابل',
      'وصلة',
      'اسكرينة',
      'screen',
    ];

    return products.filter((product) => {
      const title = product.title.toLowerCase();

      const isAccessory = excludedWords.some((word) =>
        title.includes(word.toLowerCase()),
      );

      const hasIphone = title.includes('iphone') || title.includes('ايفون');
      const hasModel = title.includes('16');

      return (
        product.title &&
        product.url &&
        !Number.isNaN(product.price) &&
        product.price > 5000 &&
        !isAccessory &&
        hasIphone &&
        hasModel
      );
    });
  }
}
