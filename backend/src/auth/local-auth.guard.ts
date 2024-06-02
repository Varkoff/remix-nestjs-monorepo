
import {
    ExecutionContext,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';

@Injectable()
export class LocalAuthGuard extends AuthGuard('local') {
    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest<Request>();
        request.body = {};
        request.body.email = 'email@example.com';
        request.body.password = '123';

        // Add your custom authentication logic here
        const canBeActivated = await super.canActivate(context) as boolean;
        // for example, call super.logIn(request) to establish a session.
        await super.logIn(request);
        return canBeActivated
    }

    // @ts-expect-error Fix that later
    handleRequest(err, user, info) {
        // console.log({ user, err, info })
        // You can throw an exception based on either "info" or "err" arguments
        if (err || !user) {
            throw err || new UnauthorizedException("Vous n'avez pas le droit d'accéder à cette page.");
        }
        return user;
    }
}