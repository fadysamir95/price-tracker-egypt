import { Injectable } from '@nestjs/common';
import { chromium } from 'playwright';
import * as fs from 'fs';

@Injectable()
export class BtechService {
    async search(query: string) {
        console.log('BTECH SERVICE CALLED');

        const browser = await chromium.launch({
            headless: true,
        });

        const page = await browser.newPage();

        const searchUrl = `https://www.btech.com/en/c/mobiles-tablets/mobile-phones/b/apple`;

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

        fs.writeFileSync(
            'btech-page.html',
            await page.content(),
        );

        console.log('BTECH HTML FILE CREATED');

        const linksCount = await page.locator('a').count();

        console.log('BTECH PAGE TITLE:', title);
        console.log('BTECH LINKS COUNT:', linksCount);

        await browser.close();

        return [];
    }
}