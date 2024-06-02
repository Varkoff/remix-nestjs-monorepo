import { getFormProps, useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod";
import {
    json,
    redirect,
    type ActionFunctionArgs,
    type LoaderFunctionArgs,
} from "@remix-run/node";
import {
    Form,
    Link,
    useActionData,
    useLoaderData,
    useParams,
} from "@remix-run/react";
import { z } from "zod";
import { ErrorList } from "~/components/forms";
import { Button, buttonVariants } from "~/components/ui/button";
import { formatDate, formatPrice } from "~/lib/utils";
import { useOptionalUser } from "~/root";
import { requireUser } from "~/server/auth.server";
import { getOffer } from "~/server/offers.server";
import { createTransaction } from "~/server/transactions.server";

export const loader = async ({ params, context }: LoaderFunctionArgs) => {
    const offerId = params.offerId;
    if (!offerId) {
        throw new Error("Did not find offerId");
    }

    const foundOffer = await getOffer({ offerId, context });
    if (!foundOffer) {
        throw new Error("Did not find offer");
    }

    return json({ offer: foundOffer });
};

const CreateTransactionSchema = z.object({
    action: z.literal("create-transaction"),
});

export const action = async ({
    request,
    params,
    context,
}: ActionFunctionArgs) => {
    const offerId = params.offerId;
    if (!offerId) {
        throw new Error("Did not find offerId");
    }

    const user = await requireUser({
        context,
        redirectTo: `/offers/${offerId}`,
    });

    const formData = await request.formData();
    const submission = await parseWithZod(formData, {
        async: true,
        schema: CreateTransactionSchema.superRefine(async (_data, ctx) => {
            const existingOffer = await context.remixService.prisma.offer.findUnique({
                where: {
                    id: offerId,
                    active: true,
                },
                select: {
                    userId: true,
                    id: true,
                },
            });

            if (!existingOffer) {
                ctx.addIssue({
                    code: "custom",
                    message: "Impossible de trouver l'offre",
                });
                return false;
            }

            if (existingOffer.userId === user.id) {
                ctx.addIssue({
                    code: "custom",
                    message: "Vous ne pouvez pas acheter votre propre offre",
                });
                return false;
            }

            const existingTransaction =
                await context.remixService.prisma.transaction.findUnique({
                    where: {
                        offerId_userId: {
                            offerId: existingOffer.id,
                            userId: user.id,
                        },
                    },
                });

            if (existingTransaction) {
                ctx.addIssue({
                    code: "custom",
                    message: "Vous avez déjà créé une transaction pour cette offre",
                });
            }
        }),
    });

    if (submission.status !== "success") {
        return json(
            { result: submission.reply() },
            {
                status: 400,
            },
        );
    }

    const { id } = await createTransaction({
        context,
        offerId,
        userId: user.id,
    });
    return redirect(`/transactions/${id}`);
};

export default function OfferPage() {
    const actionData = useActionData<typeof action>();
    const [form] = useForm({
        constraint: getZodConstraint(CreateTransactionSchema),
        onValidate({ formData }) {
            return parseWithZod(formData, {
                schema: CreateTransactionSchema,
            });
        },
        lastResult: actionData?.result,
    });
    const { offer } = useLoaderData<typeof loader>();

    const user = useOptionalUser();
    return (
        <div className="flex flex-col gap-3 py-8">
            <article className="px-6 space-y-4">
                <h2 className="text-3xl font-bold">{offer.title}</h2>
                <img
                    className="max-w-[300px] w-full h-auto"
                    src="https://via.placeholder.com/600"
                    alt="service"
                />
                <p className="text-lg">{offer.description}</p>
                <div className="flex flex-col gap-2">
                    <p>{formatDate({ date: offer.updatedAt })}</p>

                    <p className="text-white rounded-full px-2 py-0.5 w-fit bg-persianIndigo">
                        {formatPrice({ price: offer.price })}
                    </p>
                </div>
                {user?.id === offer.userId ? (
                    <Link className={buttonVariants({
                        variant: 'blueOutline'
                    })} to={`/my-services/${offer.id}`}>
                        Modifier mon offre
                    </Link>
                ) : (
                    <Form
                        className="flex flex-col gap-2 mt-2"
                        {...getFormProps(form)}
                        method="POST"
                    >
                        <Button
                            name="action"
                            value="create-transaction"
                            type="submit"
                            variant={"primary"}
                            className="w-fit"
                        >
                            Cette offre m'intéresse
                        </Button>
                        <ErrorList errors={form.errors} />
                    </Form>
                )}
            </article>
        </div>
    );
}

export const ErrorBoundary = () => {
    const { offerId } = useParams();
    return (
        <div className="flex flex-col gap-3 py-8">
            <article className="px-6 space-y-4">
                <h2 className="text-3xl font-bold">Annonce introuvable</h2>
                <div className="flex flex-row flex-wrap gap-8">
                    <p>
                        Il semblerait que l'annonce{" "}
                        <span className="font-bold">{offerId}</span> que vous cherchez
                        n'existe pas.
                    </p>
                </div>

                <Link
                    to="/"
                    className={buttonVariants({
                        variant: "primary",
                    })}
                >
                    Retourner à la liste des annonces
                </Link>
            </article>
        </div>
    );
};
