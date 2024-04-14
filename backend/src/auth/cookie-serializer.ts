/* eslint-disable @typescript-eslint/ban-types */
import { Injectable } from '@nestjs/common';
import { PassportSerializer } from '@nestjs/passport';

@Injectable()
export class CookieSerializer extends PassportSerializer {
  deserializeUser(payload: any, done: Function) {
    // console.log('deserializeUser', { payload });
    done(null, payload);
  }
  serializeUser(user: any, done: Function) {
    // console.log('serializeUser', { user });
    done(null, user);
  }
}