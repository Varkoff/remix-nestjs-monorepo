import { Injectable } from '@nestjs/common';
import Stripe from 'stripe';
import { PrismaService } from '../prisma/prisma.service';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? '', {
  apiVersion: '2025-08-27.basil',
});

@Injectable()
export class StripeService {
  constructor(private readonly prisma: PrismaService) {}

  async getOrCreateConnectAccount(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, stripeAccountId: true },
    });
    if (!user) throw new Error('User not found');

    if (user.stripeAccountId) return user.stripeAccountId;

    const account = await stripe.accounts.create({
      type: 'express',
      email: user.email ?? undefined,
      business_type: 'individual',
      capabilities: {
        transfers: { requested: true },
        card_payments: { requested: true },
      },
      metadata: { userId: user.id },
    });

    await this.prisma.user.update({
      where: { id: userId },
      data: { stripeAccountId: account.id },
    });

    return account.id;
  }

  async createAccountLink(params: {
    userId: string;
    refreshUrl: string;
    returnUrl: string;
  }) {
    const accountId = await this.getOrCreateConnectAccount(params.userId);
    const link = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: params.refreshUrl,
      return_url: params.returnUrl,
      type: 'account_onboarding',
    });
    return link.url;
  }

  async refreshAccountStatus(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { stripeAccountId: true },
    });
    if (!user?.stripeAccountId) return null;

    const acct = await stripe.accounts.retrieve(user.stripeAccountId);
    const chargesEnabled = Boolean((acct as any).charges_enabled);
    const payoutsEnabled = Boolean((acct as any).payouts_enabled);
    const detailsSubmitted = Boolean((acct as any).details_submitted);

    await this.prisma.user.update({
      where: { id: userId },
      data: { chargesEnabled, payoutsEnabled, detailsSubmitted },
    });

    return { chargesEnabled, payoutsEnabled, detailsSubmitted };
  }

  async upsertOfferProduct(offerId: string) {
    const offer = await this.prisma.offer.findUnique({
      where: { id: offerId },
      select: {
        id: true,
        title: true,
        description: true,
        price: true,
        // currency: true,
        active: true,
        userId: true,
        stripeProductId: true,
        stripePriceId: true,
      },
    });
    if (!offer) throw new Error('Offer not found');

    const unitAmount = Math.round(offer.price * 100);
    const currency = 'eur'

    let productId = offer.stripeProductId;
    let priceId = offer.stripePriceId;

    if (!productId) {
      const product = await stripe.products.create({
        name: offer.title,
        description: offer.description,
        active: offer.active,
        metadata: { offerId: offer.id, userId: offer.userId },
      });
      productId = product.id;
    } else {
      await stripe.products.update(productId, {
        name: offer.title,
        description: offer.description,
        active: offer.active,
      });
    }

    let needNewPrice = true;
    if (priceId) {
      try {
        const existing = await stripe.prices.retrieve(priceId);
        if (
          existing &&
          existing.unit_amount === unitAmount &&
          existing.currency === currency
        ) {
          needNewPrice = false;
        }
      } catch {
        // priceId stale or not found -> create new
        needNewPrice = true;
      }
    }

    if (needNewPrice) {
      const oldPriceId = priceId ?? null;
      const newPrice = await stripe.prices.create({
        product: productId!,
        unit_amount: unitAmount,
        currency,
        // one-time price (default). For recurring, pass recurring: {interval: 'month'} etc.
      });
      priceId = newPrice.id;

      // Set default price on product
      await stripe.products.update(productId!, { default_price: priceId });

      // Archive previous price if it existed
      if (oldPriceId) {
        try {
          await stripe.prices.update(oldPriceId, { active: false });
        } catch (e) {
          // ignore if already inactive or not found
        }
      }
    }

    await this.prisma.offer.update({
      where: { id: offerId },
      data: {
        stripeProductId: productId!,
        stripePriceId: priceId!,
      },
    });

    return { productId, priceId };
  }

  async createCheckoutSessionForOffer(params: {
    offerId: string;
    buyerUserId: string;
    successUrl: string;
    cancelUrl: string;
  }) {
    const offer = await this.prisma.offer.findUnique({
      where: { id: params.offerId },
      select: {
        id: true,
        title: true,
        description: true,
        price: true,
        userId: true,
        stripePriceId: true,
        stripeProductId: true,
      },
    });
    if (!offer) throw new Error('Offer not found');

    if (offer.userId === params.buyerUserId) {
      throw new Error('Seller cannot buy own offer');
    }

    // Ensure product/price exist and are up to date
    const { priceId } = await this.upsertOfferProduct(offer.id);

    // Fetch seller account id
    const seller = await this.prisma.user.findUnique({
      where: { id: offer.userId },
      select: { stripeAccountId: true, chargesEnabled: true },
    });
    if (!seller?.stripeAccountId || !seller.chargesEnabled) {
      throw new Error('Seller not eligible for Checkout');
    }

    // Optionally ensure buyer has a customer
    let customerId: string | undefined;
    const buyer = await this.prisma.user.findUnique({
      where: { id: params.buyerUserId },
      select: { stripeCustomerId: true, email: true },
    });
    if (buyer?.stripeCustomerId) {
      customerId = buyer.stripeCustomerId;
    } else {
      const customer = await stripe.customers.create({
        email: buyer?.email ?? undefined,
        metadata: { userId: params.buyerUserId },
      });
      customerId = customer.id;
      await this.prisma.user.update({
        where: { id: params.buyerUserId },
        data: { stripeCustomerId: customerId },
      });
    }

    // Create Checkout Session in destination (seller) account via on_behalf_of/transfer_data
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          price: priceId!,
          quantity: 1,
        },
      ],
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
      customer: customerId,
      payment_intent_data: {
        transfer_data: {
          destination: seller.stripeAccountId,
        },
        on_behalf_of: seller.stripeAccountId,
      },
      metadata: {
        offerId: offer.id,
        sellerUserId: offer.userId,
        buyerUserId: params.buyerUserId,
      },
    });

    // Create or upsert Transaction record marking Stripe Checkout ID for tracking
    const transaction = await this.prisma.transaction.upsert({
      where: {
        offerId_userId: { offerId: offer.id, userId: params.buyerUserId },
      },
      create: {
        offerId: offer.id,
        userId: params.buyerUserId,
        stripeCheckoutSessionId: session.id,
      },
      update: {
        stripeCheckoutSessionId: session.id,
      },
      select: { id: true },
    });

    // Create a pending offer message to reflect the intent
    try {
      const priceAsFloat = Number.parseFloat((offer.price ?? 0).toFixed(2));
      await this.prisma.message.create({
        data: {
          transaction: { connect: { id: transaction.id } },
          content: `A initié un achat de ${priceAsFloat}€ via Stripe Checkout`,
          price: priceAsFloat,
          status: 10, // PENDING_OFFER
          user: { connect: { id: params.buyerUserId } },
        },
      });
    } catch {
      // non-blocking; message creation failure should not break checkout
    }

    return { url: session.url!, transactionId: transaction.id };
  }

  async handleWebhookEvent(event: Stripe.Event) {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const sessionId = session.id;
      const paymentIntentId = typeof session.payment_intent === 'string'
        ? session.payment_intent
        : session.payment_intent?.id;

      // Attach PI to transaction and create accepted message
      const tx = await this.prisma.transaction.findFirst({
        where: { stripeCheckoutSessionId: sessionId },
        select: { id: true, userId: true, offerId: true, stripePaymentIntentId: true },
      });
      if (tx) {
        if (!tx.stripePaymentIntentId && paymentIntentId) {
          await this.prisma.transaction.update({
            where: { id: tx.id },
            data: { stripePaymentIntentId: paymentIntentId },
          });
        }

        // Fetch offer price
        const offer = await this.prisma.offer.findUnique({
          where: { id: tx.offerId },
          select: { price: true },
        });
        const priceAsFloat = Number.parseFloat((offer?.price ?? 0).toFixed(2));

        // Record accepted offer message to mark it paid in UI
        try {
          await this.prisma.message.create({
            data: {
              transaction: { connect: { id: tx.id } },
              content: `Paiement confirmé: ${priceAsFloat}€`,
              price: priceAsFloat,
              status: 20, // ACCEPTED_OFFER
              user: { connect: { id: tx.userId } }, // buyer
            },
          });
        } catch {
          // ignore duplicate or race
        }
      }
    } else if (event.type === 'payment_intent.succeeded') {
      const pi = event.data.object as Stripe.PaymentIntent;
      const paymentIntentId = pi.id;
      // Backfill if needed
      const tx = await this.prisma.transaction.findFirst({
        where: { stripePaymentIntentId: null, stripeCheckoutSessionId: { not: null } },
        orderBy: { createdAt: 'desc' },
        select: { id: true },
      });
      if (tx) {
        await this.prisma.transaction.update({
          where: { id: tx.id },
          data: { stripePaymentIntentId: paymentIntentId },
        });
      }
    }
  }

  // Webhook verification helper
  constructEventFromPayload(sig: string | string[] | undefined, rawBody: Buffer) {
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!endpointSecret) {
      throw new Error('STRIPE_WEBHOOK_SECRET not set');
    }
    return stripe.webhooks.constructEvent(rawBody, sig as string, endpointSecret);
  }

  async getConnectStatus(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        stripeAccountId: true,
      },
    });

    if (!user) throw new Error('User not found');

    if (!user.stripeAccountId) {
      return {
        stripeAccountId: null,
        chargesEnabled: false,
        payoutsEnabled: false,
        detailsSubmitted: false,
        requirements: {
          currentlyDue: [] as string[],
          eventuallyDue: [] as string[],
          pastDue: [] as string[],
          disabledReason: null as string | null,
        },
      };
    }

    const account = await stripe.accounts.retrieve(user.stripeAccountId);
    const chargesEnabled = Boolean((account as any).charges_enabled);
    const payoutsEnabled = Boolean((account as any).payouts_enabled);
    const detailsSubmitted = Boolean((account as any).details_submitted);
    const requirements = (account as any).requirements ?? {};

    await this.prisma.user.update({
      where: { id: userId },
      data: { chargesEnabled, payoutsEnabled, detailsSubmitted },
    });

    return {
      stripeAccountId: user.stripeAccountId,
      chargesEnabled,
      payoutsEnabled,
      detailsSubmitted,
      requirements: {
        currentlyDue: Array.isArray(requirements.currently_due)
          ? (requirements.currently_due as string[])
          : [],
        eventuallyDue: Array.isArray(requirements.eventually_due)
          ? (requirements.eventually_due as string[])
          : [],
        pastDue: Array.isArray(requirements.past_due)
          ? (requirements.past_due as string[])
          : [],
        disabledReason:
          typeof requirements.disabled_reason === 'string'
            ? (requirements.disabled_reason as string)
            : null,
      },
    };
  }

  async createDashboardLoginLink(params: {
    userId: string;
    redirectUrl?: string;
  }) {
    const accountId = await this.getOrCreateConnectAccount(params.userId);
    const link = await stripe.accounts.createLoginLink(accountId);
    return link.url;
  }
}