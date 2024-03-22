import { All, Controller, Next, Req, Res } from '@nestjs/common';
import { createRequestHandler } from '@remix-run/express';
import { getServerBuild } from '@virgile/frontend';
import { NextFunction, Request, Response } from 'express';
import { RemixService } from './remix.service';

@Controller()
export class RemixController {
  constructor(private remixService: RemixService) {}

  @All('*')
  async handler(
    @Req() request: Request,
    @Res() response: Response,
    @Next() next: NextFunction,
  ) {
    //
    return createRequestHandler({
      build: await getServerBuild(),
      getLoadContext: () => ({
        toto: 'Cette stack est géniale',
        remixService: this.remixService,
      }),
    })(request, response, next);
  }
}
