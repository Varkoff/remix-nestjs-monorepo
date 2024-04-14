import { Controller, Get, Next, Post, Redirect, Req, Res, UseGuards } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { LocalAuthGuard } from './local-auth.guard';

@Controller()
export class AuthController {
    @UseGuards(LocalAuthGuard)
    @Get('/authenticate')
    @Redirect('/')
    async login(@Req() req: Request) {
        console.log({ requestUser: req.user });
        // return req.user;
    }

    @Post('auth/logout')
    async logout(
        @Req() request: Express.Request,
        @Res() response: Response,
        @Next() next: NextFunction,
    ) {
        // this will ensure that re-using the old session id
        // does not have a logged in user
        request.logOut(function (err) {
            if (err) {
                return next(err);
            }
            // Ensure the session is destroyed and the user is redirected.
            request.session.destroy(() => {
                response.clearCookie('connect.sid'); // The name of the cookie where express/connect stores its session_id
                response.redirect('/'); // Redirect to website after logout
            });
        });
    }
}
