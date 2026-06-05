import { Injectable } from '@nestjs/common';
import { AmazonService } from './amazon.service';
import { NoonService } from './noon.service';
import { BtechService } from './btech.service';
import { TwobService } from './twob.service';

type Product = {
    title: string;
    price: number;
    image: string;
    url: string;
    store: string;
};

@Injectable()
export class ProductsService {
    constructor(
        private readonly amazonService: AmazonService,
        private readonly noonService: NoonService,
        private readonly btechService: BtechService,
        private readonly twobService: TwobService,
    ) { }

    async searchProducts(query: string) {
        console.log('PRODUCTS SERVICE CALLED');
        console.log('QUERY:', query);

        const amazonResults = await this.amazonService.search(query);
        console.log('AMAZON COUNT:', amazonResults.length);

        let noonResults: Product[] = [];
        let btechResults: Product[] = [];
        let twobResults: Product[] = [];

        try {
            noonResults = await this.noonService.search(query);
            console.log('NOON COUNT:', noonResults.length);
        } catch (error) {
            console.log('NOON FAILED');
            console.log((error as Error).message);
        }

        try {
            btechResults = await this.btechService.search(query);
            console.log('BTECH COUNT:', btechResults.length);
        } catch (error) {
            console.log('BTECH FAILED');
            console.log((error as Error).message);
        }

        try {
            twobResults = await this.twobService.search(query);
            console.log('2B COUNT:', twobResults.length);
        } catch (error) {
            console.log('2B FAILED');
            console.log((error as Error).message);
        }

        return [...amazonResults, ...noonResults, ...btechResults, ...twobResults].sort(
            (a, b) => a.price - b.price,
        );
    }
}