import { redirect, type AppLoadContext } from "@remix-run/node";
import { z } from "zod";

const authenticatedUserSchema = z.object({
    id: z.string(),
    email: z.string(),
});
export const getOptionalUser = async ({
    context,
}: { context: AppLoadContext }) => {
    const user = authenticatedUserSchema
        .optional()
        .nullable()
        .parse(context.user);
    if (user) {
        return await context.remixService.getUser({
            userId: user.id,
        });
    }
    return null;
};

export const requireUser = async ({
    context,
    redirectTo = '/',
}: {
    context: AppLoadContext;
    redirectTo?: string;
}) => {
    const user = await getOptionalUser({ context });
    if (!user) {
        throw redirect(`/login?redirectTo=${redirectTo}`);
    }

    return user;
};
