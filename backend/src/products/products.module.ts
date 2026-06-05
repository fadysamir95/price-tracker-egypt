import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { AmazonService } from './amazon.service';
import { NoonService } from './noon.service';
import { BtechService } from './btech.service';
import { TwobService } from './twob.service';

@Module({
  controllers: [ProductsController],
  providers: [
    ProductsService,
    AmazonService,
    NoonService,
    BtechService,
    TwobService,
  ],
})
export class ProductsModule {}
