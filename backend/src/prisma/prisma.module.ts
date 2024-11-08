import { Global, Module } from "@nestjs/common";
import { PrismaService } from "./prisma.service";

// This module is global, it is imported without Dependency Injection :)
@Global()
@Module({
  controllers: [],
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
