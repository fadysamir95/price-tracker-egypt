import { Injectable } from '@nestjs/common';
import { chromium } from 'playwright';
import * as fs from 'fs';
import { Product, StoreSearchService } from './product-search.types';

@Injectable()
export class NoonService implements StoreSearchService {
  async search(query: string): Promise<Product[]> {
    console.log('NOON SERVICE CALLED');
    const browser = await chromium.launch({
      headless: true,
    });

    const page = await browser.newPage();

    const searchUrl = `https://www.noon.com/egypt-en/search/?q=${encodeURIComponent(query)}`;

    await page.setExtraHTTPHeaders({
      'accept-language': 'en-EG,en;q=0.9',
    });

    await page.goto(searchUrl, {
      waitUntil: 'load',
      timeout: 90000,
    });

    await page.waitForTimeout(5000);

    const products = await page.$$eval('a[href*="/p/"]', (items): Product[] => {
      return items.slice(0, 30).map((item) => {
        const text = item.textContent?.replace(/\s+/g, ' ').trim() || '';

        const title =
          item.querySelector('div[title]')?.getAttribute('title') ||
          item.querySelector('img')?.getAttribute('alt') ||
          text;

        const priceText = text.match(/[\d,.]+\s?EGP|EGP\s?[\d,.]+/)?.[0] || '';

        const image = item.querySelector('img')?.getAttribute('src') || '';

        const relativeUrl = item.getAttribute('href') || '';

        const cleanPrice = Number(priceText.replace(/[^\d.]/g, ''));

        return {
          title,
          price: cleanPrice,
          image,
          url: relativeUrl.startsWith('http')
            ? relativeUrl
            : `https://www.noon.com${relativeUrl}`,
          store: 'Noon Egypt',
        };
      });
    });

    fs.writeFileSync('noon-page.html', await page.content());

    console.log('NOON HTML FILE CREATED');

    await browser.close();

    const searchWords = query.toLowerCase().split(' ').filter(Boolean);

    return products.filter((product) => {
      const title = product.title.toLowerCase();

      return (
        product.title &&
        product.url &&
        searchWords.every((word) => title.includes(word)) &&
        !Number.isNaN(product.price) &&
        product.price > 5000
      );
    });
  }
}
