import { Injectable } from '@nestjs/common';
import { chromium } from 'playwright';

@Injectable()
export class AmazonService {
  async search(query: string) {
    const browser = await chromium.launch({
      headless: true,
    });

    const page = await browser.newPage();

    const searchUrl = `https://www.amazon.eg/s?k=${encodeURIComponent(query)}`;

    await page.goto(searchUrl, {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });

    const products = await page.$$eval(
      '[data-component-type="s-search-result"]',
      items => {
        return items.slice(0, 10).map(item => {
          const title =
            item.querySelector('h2 span')?.textContent?.trim() || '';

          const priceText =
            item.querySelector('.a-price .a-offscreen')?.textContent?.trim() || '';

          const image =
            item.querySelector('img')?.getAttribute('src') || '';

          const relativeUrl =
            item.querySelector('a.a-link-normal')?.getAttribute('href') || '';

          const cleanPrice = Number(
            priceText.replace(/[^\d.]/g, ''),
          );

          const match = relativeUrl.match(/\/dp\/([A-Z0-9]+)/);

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

    await browser.close();

    const searchWords = query
      .toLowerCase()
      .split(' ')
      .filter(Boolean);

    return products.filter(product => {
      const title = product.title.toLowerCase();

      const containsAllWords = searchWords.every(word =>
        title.includes(word),
      );

      return (
        containsAllWords &&
        product.price > 5000
      );
    });
  }
}