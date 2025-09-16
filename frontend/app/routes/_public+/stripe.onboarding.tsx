import { type LoaderFunctionArgs, redirect } from "@remix-run/node";
import { requireUser } from "~/server/auth.server";
import { createOnboardingLink } from "~/server/stripe.server";

export const loader = async ({ context, request }: LoaderFunctionArgs) => {
    const user = await requireUser({ context, redirectTo: "/stripe/onboarding" });
    const url = await createOnboardingLink({
        context,
        userId: user.id,
        requestUrl: request.url,
    });
    throw redirect(url);
};