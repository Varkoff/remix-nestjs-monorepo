import { Module } from '@nestjs/common';
import { AuthController } from './auth/auth.controller';
import { AuthModule } from './auth/auth.module';
import { AwsS3Service } from './aws/aws-s3.service';
import { PrismaService } from './prisma/prisma.service';
import { RemixController } from './remix/remix.controller';
import { RemixService } from './remix/remix.service';
import { StripeController } from './stripe/stripe.controller';
import { StripeService } from './stripe/stripe.service';

@Module({
  imports: [AuthModule],
  controllers: [AuthController, StripeController, RemixController],
  providers: [PrismaService, RemixService, AwsS3Service, StripeService],
})
export class AppModule { }
