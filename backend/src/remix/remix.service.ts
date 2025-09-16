import { Injectable } from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { AwsS3Service } from '../aws/aws-s3.service';
import { PrismaService } from '../prisma/prisma.service';
import { StripeService } from '../stripe/stripe.service';

// http://localhost:3000/webhooks/stripe
@Injectable()
export class RemixService {
  constructor(
    public readonly prisma: PrismaService,
    public readonly auth: AuthService,
    public readonly aws: AwsS3Service,
    public readonly stripe: StripeService,
  ) { }
  public readonly getUser = async ({ userId }: { userId: string }) => {
    return await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });
  };
}
