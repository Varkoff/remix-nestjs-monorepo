import { type LoaderFunctionArgs, redirect } from "@remix-run/node";
import { requireUser } from "~/server/auth.server";
import { createDashboardLoginLink } from "~/server/stripe.server";

export const loader = async ({ context, request }: LoaderFunctionArgs) => {
    const user = await requireUser({ context, redirectTo: "/stripe/dashboard" });
    const url = await createDashboardLoginLink({
        context,
        userId: user.id,
        requestUrl: request.url,
    });
    throw redirect(url);
};


