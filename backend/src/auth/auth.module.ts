import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from './auth.service';
import { CookieSerializer } from './cookie-serializer';
import { LocalAuthGuard } from './local-auth.guard';
import { LocalStrategy } from './local.strategy';

@Module({
    imports: [
        PassportModule.register({
            defaultStrategy: 'local',
            property: 'user',
            session: true
        })
    ],
    controllers: [],
    providers: [LocalStrategy, LocalAuthGuard, CookieSerializer, PrismaService, AuthService],
    exports: [AuthService]
})
export class AuthModule { }
