import { Injectable } from '@nestjs/common';
import { chromium } from 'playwright';
import * as fs from 'fs';
import { Product, StoreSearchService } from './product-search.types';

const DESKTOP_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

@Injectable()
export class AmazonService implements StoreSearchService {
  async search(query: string): Promise<Product[]> {
    const browser = await chromium.launch({
      headless: true,
      args: ['--disable-blink-features=AutomationControlled'],
    });

    try {
      const page = await browser.newPage({
        locale: 'en-US',
        userAgent: DESKTOP_USER_AGENT,
      });

      await page.setExtraHTTPHeaders({
        'accept-language': 'en-EG,en;q=0.9',
      });

      const searchUrl = `https://www.amazon.eg/s?k=${encodeURIComponent(query)}`;

      await page.goto(searchUrl, {
        waitUntil: 'domcontentloaded',
        timeout: 60000,
      });

      const pageTitle = await page.title();
      const resultCardsCount = await page
        .locator('[data-component-type="s-search-result"]')
        .count();

      console.log('AMAZON PAGE TITLE:', pageTitle);
      console.log('AMAZON RESULT CARDS:', resultCardsCount);

      if (resultCardsCount === 0) {
        fs.writeFileSync('amazon-page.html', await page.content());
        console.log('AMAZON HTML FILE CREATED');

        if (
          pageTitle.includes('عذر') ||
          pageTitle.toLowerCase().includes('sorry')
        ) {
          throw new Error('Amazon returned a blocked/sorry page');
        }
      }

      const products = await page.$$eval(
        '[data-component-type="s-search-result"]',
        (items): Product[] => {
          return items.slice(0, 10).map((item) => {
            const title =
              item.querySelector('h2 span')?.textContent?.trim() ||
              item.querySelector('h2')?.textContent?.trim() ||
              item
                .querySelector('[data-cy="title-recipe"]')
                ?.textContent?.trim() ||
              '';

            const priceText =
              item
                .querySelector('.a-price .a-offscreen')
                ?.textContent?.trim() ||
              item.querySelector('.a-price-whole')?.textContent?.trim() ||
              '';

            const image = item.querySelector('img')?.getAttribute('src') || '';

            const relativeUrl =
              item
                .querySelector('a[href*="/dp/"], a[href*="/gp/product/"]')
                ?.getAttribute('href') || '';

            const cleanPrice = Number(priceText.replace(/[^\d.]/g, ''));

            const match = relativeUrl.match(
              /\/(?:dp|gp\/product)\/([A-Z0-9]+)/,
            );

            const cleanUrl = match
              ? `https://www.amazon.eg/dp/${match[1]}`
              : '';

            return {
              title,
              price: cleanPrice,
              image,
              url: cleanUrl,
              store: 'Amazon Egypt',
            };
          });
        },
      );

      const searchWords = query.toLowerCase().split(' ').filter(Boolean);

      return products.filter((product) => {
        const title = product.title.toLowerCase();

        const containsAllWords = searchWords.every((word) =>
          title.includes(word),
        );

        return (
          product.title &&
          product.url &&
          containsAllWords &&
          !Number.isNaN(product.price) &&
          product.price > 5000
        );
      });
    } finally {
      await browser.close();
    }
  }
}
