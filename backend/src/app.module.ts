import { Module } from '@nestjs/common';
import { RemixController } from './remix/remix.controller';
import { RemixService } from './remix/remix.service';

@Module({
  imports: [],
  controllers: [RemixController],
  providers: [RemixService],
})
export class AppModule { }
