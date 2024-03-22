import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RemixController } from './remix/remix.controller';
import { RemixService } from './remix/remix.service';

@Module({
  imports: [],
  controllers: [AppController, RemixController],
  providers: [AppService, RemixService],
})
export class AppModule {}
