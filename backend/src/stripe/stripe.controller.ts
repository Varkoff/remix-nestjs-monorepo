import { Body, Controller, Headers, Post, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { StripeService } from './stripe.service';

@Controller()
export class StripeController {
  constructor(
    private readonly stripeService: StripeService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('/webhooks/stripe')
  async handleWebhook(
    @Req() req: Request,
    @Res() res: Response,
    @Headers('stripe-signature') sig?: string,
    @Body() _body?: unknown, // parsed ignored; we use raw
  ) {
    try {
      const event = this.stripeService.constructEventFromPayload(sig, req.body as unknown as Buffer);

      if (event.type === 'account.updated') {
        const account = event.data.object ;
        const user = await this.prisma.user.findFirst({
          where: { stripeAccountId: account.id },
          select: { id: true },
        });
        if (user) {
          await this.prisma.user.update({
            where: { id: user.id },
            data: {
              chargesEnabled: Boolean(account.charges_enabled),
              payoutsEnabled: Boolean(account.payouts_enabled),
              detailsSubmitted: Boolean(account.details_submitted),
            },
          });
        }
      }

      if (event.type === 'checkout.session.completed' || event.type === 'payment_intent.succeeded') {
        await this.stripeService.handleWebhookEvent(event);
      }

      res.status(200).send({ received: true });
    } catch (err) {
      console.error('Stripe webhook error', err);
      res.status(400).send(`Webhook Error`);
    }
  }
}