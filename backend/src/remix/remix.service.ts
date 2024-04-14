import { Injectable } from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RemixService {
  constructor(
    public readonly prisma: PrismaService,
    public readonly auth: AuthService,
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
