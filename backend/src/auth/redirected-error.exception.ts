import { HttpException, HttpStatus } from '@nestjs/common';

export class RedirectException extends HttpException {
    constructor(
        public readonly message: string,
        public readonly redirectUrl: string,
    ) {
        super(message, HttpStatus.PERMANENT_REDIRECT);
    }
}
