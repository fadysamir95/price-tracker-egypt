import { Injectable } from '@nestjs/common';
import { chromium } from 'playwright';
import * as fs from 'fs';
import { Product, StoreSearchService } from './product-search.types';

@Injectable()
export class BtechService implements StoreSearchService {
  async search(query: string): Promise<Product[]> {
    console.log('BTECH SERVICE CALLED');

    const browser = await chromium.launch({
      headless: true,
    });

    const page = await browser.newPage();

    const searchUrl = `https://www.btech.com/en/catalogsearch/result/?q=${encodeURIComponent(query)}`;

    await page.goto(searchUrl, {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });

    await page.waitForTimeout(5000);

    const title = await page.title();

    if (title.includes('520')) {
      console.log('BTECH BLOCKED OR SERVER ERROR');
      await browser.close();
      return [];
    }

    fs.writeFileSync('btech-page.html', await page.content());

    console.log('BTECH HTML FILE CREATED');

    const linksCount = await page.locator('a').count();

    console.log('BTECH PAGE TITLE:', title);
    console.log('BTECH LINKS COUNT:', linksCount);

    const products = await page.$$eval('a[href]', (links): Product[] => {
      const productMap = new Map<string, Product>();

      links.forEach((link) => {
        const url = link.getAttribute('href') || '';
        const text = link.textContent?.replace(/\s+/g, ' ').trim() || '';
        const imageElement = link.querySelector('img');
        const title =
          imageElement?.getAttribute('alt')?.trim() ||
          link.getAttribute('title')?.trim() ||
          text;

        const priceText =
          text.match(/(?:EGP|ج\.م)\s*[\d,.]+|[\d,.]+\s*(?:EGP|ج\.م)/i)?.[0] ||
          '';
        const price = Number(priceText.replace(/[^\d.]/g, ''));

        if (
          !title.toLowerCase().includes('iphone') ||
          !title.includes('16') ||
          Number.isNaN(price) ||
          price <= 5000
        ) {
          return;
        }

        const absoluteUrl = url.startsWith('http')
          ? url
          : `https://www.btech.com${url.startsWith('/') ? url : `/${url}`}`;

        productMap.set(absoluteUrl, {
          title,
          price,
          image: imageElement?.getAttribute('src') || '',
          url: absoluteUrl,
          store: 'B.TECH',
        });
      });

      return [...productMap.values()].slice(0, 10);
    });

    await browser.close();

    return products;
  }
}
