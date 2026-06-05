import { Injectable } from '@nestjs/common';
import { chromium } from 'playwright';
import * as fs from 'fs';

@Injectable()
export class NoonService {
    async search(query: string) {
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

        const products = await page.$$eval('a[href*="/egypt-en/"]', items => {
            return items.slice(0, 30).map(item => {
                const text = item.textContent?.trim() || '';

                const title =
                    item.querySelector('div[title]')?.getAttribute('title') ||
                    item.querySelector('img')?.getAttribute('alt') ||
                    text;

                const priceText =
                    text.match(/[\d,.]+\s?EGP|EGP\s?[\d,.]+/)?.[0] || '';

                const image =
                    item.querySelector('img')?.getAttribute('src') || '';

                const relativeUrl =
                    item.getAttribute('href') || '';

                const cleanPrice = Number(
                    priceText.replace(/[^\d.]/g, ''),
                );

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

        fs.writeFileSync(
            'noon-page.html',
            await page.content(),
        );

        console.log('NOON HTML FILE CREATED');

        await browser.close();

        return products.filter(
            product =>
                product.title &&
                product.url &&
                !Number.isNaN(product.price) &&
                product.price > 0,
        );
    }
}