import { type AppLoadContext } from "@remix-run/node";

export const createOnboardingLink = async ({
  context,
  userId,
  requestUrl,
}: {
  context: AppLoadContext;
  userId: string;
  requestUrl: string;
}) => {
  const origin = new URL(requestUrl).origin;
  const refreshUrl = `${origin}/stripe/onboarding`;
  const returnUrl = `${origin}/stripe/return`;

  const url = await context.remixService.stripe.createAccountLink({
    userId,
    refreshUrl,
    returnUrl,
  });
  return url;
};

export const refreshAccountStatus = async ({
  context,
  userId,
}: {
  context: AppLoadContext;
  userId: string;
}) => {
  return await context.remixService.stripe.refreshAccountStatus(userId);
};

export const createDashboardLoginLink = async ({
  context,
  userId,
  requestUrl,
}: {
  context: AppLoadContext;
  userId: string;
  requestUrl: string;
}) => {
  const origin = new URL(requestUrl).origin;
  const redirectUrl = `${origin}/profile`;
  const url = await context.remixService.stripe.createDashboardLoginLink({
    userId,
    redirectUrl,
  });
  return url;
};

export const getConnectStatus = async ({
  context,
  userId,
}: {
  context: AppLoadContext;
  userId: string;
}) => {
  return await context.remixService.stripe.getConnectStatus(userId);
};

export const createCheckoutSessionForOffer = async ({
  context,
  offerId,
  buyerUserId,
  requestUrl,
}: {
  context: AppLoadContext;
  offerId: string;
  buyerUserId: string;
  requestUrl: string;
}) => {
  const origin = new URL(requestUrl).origin;
  // Include a redirect to the transaction after success, using session_id
  // We'll resolve session_id -> transaction on server webhook and optionally client can fetch by session_id
  const successUrl = `${origin}/transactions?session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = `${origin}/offers/${encodeURIComponent(offerId)}`;
  return await context.remixService.stripe.createCheckoutSessionForOffer({
    offerId,
    buyerUserId,
    successUrl,
    cancelUrl,
  });
};