import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { requireUser } from "~/server/auth.server";
import { refreshAccountStatus } from "~/server/stripe.server";

export const loader = async ({ context }: LoaderFunctionArgs) => {
    const user = await requireUser({ context, redirectTo: "/profile" });
    const status = await refreshAccountStatus({ context, userId: user.id });
    return json({ ok: true, status });
};


