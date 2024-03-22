import { Injectable } from '@nestjs/common';

@Injectable()
export class RemixService {
  public readonly getHello = (): string => {
    return 'Cette stack est incroyable !';
  };
  public readonly getHello2 = (): string => {
    return 'Cette stack est incroyable !';
  };
}
