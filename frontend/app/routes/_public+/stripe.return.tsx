import { type LoaderFunctionArgs, redirect } from "@remix-run/node";
import { requireUser } from "~/server/auth.server";
import { refreshAccountStatus } from "~/server/stripe.server";

export const loader = async ({ context }: LoaderFunctionArgs) => {
    const user = await requireUser({ context, redirectTo: "/stripe/return" });
    await refreshAccountStatus({ context, userId: user.id });
    return redirect("/profile"); // or wherever makes sense
};