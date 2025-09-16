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
import { ArrowLeft, Calendar, User } from "lucide-react";
import { z } from "zod";
import { ErrorList } from "~/components/forms";
import { Button, buttonVariants } from "~/components/ui/button";
import { formatDate, formatPrice } from "~/lib/utils";
import { useOptionalUser } from "~/root";
import { getOptionalUser, requireUser } from "~/server/auth.server";
import { getExistingTransaction, getOffer } from "~/server/offers.server";
import { createCheckoutSessionForOffer, getConnectStatus } from "~/server/stripe.server";
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

    // Check if user is logged in and has existing transaction
    const user = await getOptionalUser({ context });
    let existingTransaction: Awaited<ReturnType<typeof getExistingTransaction>> | null = null;

    if (user) {
        existingTransaction = await getExistingTransaction({
            offerId,
            userId: user.id,
            context,
        });
    }

    // Determine if offer is directly purchasable via Stripe Checkout
    const sellerConnect = await getConnectStatus({
        context,
        userId: foundOffer.user.id,
    });
    const canBuyNow = Boolean(foundOffer.isStripeSynced && sellerConnect.chargesEnabled);

    return json({
        offer: foundOffer,
        existingTransaction,
        canBuyNow,
    });
};

const CreateTransactionSchema = z.object({
    action: z.enum(["create-transaction", "buy-now"]),
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
        schema: CreateTransactionSchema.superRefine(async (data, ctx) => {
            const existingOffer = await context.remixService.prisma.offer.findUnique({
                where: {
                    id: offerId,
                    active: true,
                },
                select: {
                    userId: true,
                    id: true,
                    stripeProductId: true,
                    stripePriceId: true,
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

            // Only block on existing conversation for the conversation flow
            if (data.action === "create-transaction") {
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

    const actionType = submission.value.action;

    if (actionType === "buy-now") {
        try {
            const { url } = await createCheckoutSessionForOffer({
                context,
                offerId,
                buyerUserId: user.id,
                requestUrl: request.url,
            });
            return redirect(url);
        } catch (error) {
            return json(
                { result: submission.reply({ formErrors: ["Impossible de créer le paiement Stripe."] }) },
                { status: 400 },
            );
        }
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
    const { offer, existingTransaction, canBuyNow } = useLoaderData<typeof loader>();

    const user = useOptionalUser();
    const isOwner = user?.id === offer.userId;

    return (
        <div className="min-h-screen bg-gradient-to-br from-extraLightTurquoise to-white">
            <div className="max-w-4xl mx-auto px-4 py-8">
                {/* Back Button */}
                <Link
                    to="/"
                    className="inline-flex items-center gap-2 text-bleu hover:text-bleu/80 transition-colors mb-6"
                >
                    <ArrowLeft className="size-4" />
                    Retour aux annonces
                </Link>

                {/* Main Content */}
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                    {/* Header Section */}
                    <div className="relative">
                        <div className="h-64 bg-gradient-to-r from-bleuClair to-lightTurquoise flex items-center justify-center">
                            <img
                                className="max-w-full max-h-full object-cover rounded-lg shadow-lg"
                                src={offer.imageUrl ? offer.imageUrl : "https://placehold.co/1200x400?text=Pas%20d%27image"}
                                alt={offer.title}
                            />
                        </div>

                        {/* Price Badge */}
                        <div className="absolute top-4 right-4">
                            <div className="bg-persianIndigo text-white px-4 py-2 rounded-full font-semibold text-lg shadow-lg">
                                {formatPrice({ price: offer.price ?? 0 })}
                            </div>
                        </div>

                        {/* Owner Badge */}
                        {isOwner && (
                            <div className="absolute top-4 left-4">
                                <div className="bg-vert text-white px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                                    <User className="size-3" />
                                    Votre offre
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Content Section */}
                    <div className="p-8">
                        <div className="grid lg:grid-cols-3 gap-8">
                            {/* Main Content */}
                            <div className="lg:col-span-2 space-y-6">
                                <div>
                                    <h1 className="text-4xl font-bold text-bleu mb-4">{offer.title}</h1>
                                    <p className="text-lg text-gray-700 leading-relaxed">{offer.description}</p>
                                </div>

                                {/* Metadata */}
                                <div className="flex flex-wrap gap-4 py-4 border-t border-gray-200">
                                    <div className="flex items-center gap-2 text-gray-600">
                                        <Calendar className="size-4" />
                                        <span className="text-sm">
                                            Publié le {formatDate({ date: offer.updatedAt ?? new Date() })}
                                        </span>
                                    </div>
                                    <div className="text-gray-600">
                                        <span className="text-sm">Prix fixe</span>
                                    </div>
                                </div>
                            </div>

                            {/* Sidebar */}
                            <div className="lg:col-span-1">
                                <div className="bg-gray-50 rounded-xl p-6 space-y-6">
                                    {/* Provider Info */}
                                    <div className="text-center">
                                        <div className="w-16 h-16 bg-bleuClair rounded-full flex items-center justify-center mx-auto mb-3 overflow-hidden">
                                            {offer.user.avatarUrl ? (
                                                <img
                                                    src={offer.user.avatarUrl}
                                                    alt={offer.user.name || "Prestataire"}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <User className="size-8 text-bleu" />
                                            )}
                                        </div>
                                        <h3 className="font-semibold text-bleu">
                                            {offer.user.name || "Prestataire"}
                                        </h3>
                                    </div>

                                    {/* Action Section */}
                                    <div className="space-y-4">
                                        {isOwner ? (
                                            <div className="space-y-3">
                                                <Link
                                                    className={buttonVariants({
                                                        variant: 'primary',
                                                        className: 'w-full'
                                                    })}
                                                    to={`/my-services/${offer.id}`}
                                                >
                                                    Modifier mon offre
                                                </Link>
                                                {!offer.isStripeSynced ? (
                                                    <p className="text-xs text-red-600 text-center">
                                                        ● Non synchronisée avec Stripe
                                                    </p>
                                                ) : null}
                                                <p className="text-sm text-gray-600 text-center">
                                                    Vous êtes le propriétaire de cette offre
                                                </p>
                                            </div>
                                        ) : existingTransaction ? (
                                            <div className="space-y-3">
                                                <Link
                                                    className={buttonVariants({
                                                        variant: 'primary',
                                                        className: 'w-full py-3 text-lg font-semibold bg-gradient-to-r from-bleu to-persianIndigo hover:from-bleu/90 hover:to-persianIndigo/90 shadow-lg hover:shadow-xl transition-all duration-200'
                                                    })}
                                                    to={`/transactions/${existingTransaction.id}`}
                                                >
                                                    Voir ma conversation
                                                </Link>
                                                <p className="text-sm text-gray-600 text-center">
                                                    Vous avez déjà une conversation active pour cette offre
                                                </p>
                                            </div>
                                        ) : canBuyNow ? (
                                            <Form
                                                className="space-y-4"
                                                {...getFormProps(form)}
                                                method="POST"
                                            >
                                                <Button
                                                    name="action"
                                                    value="buy-now"
                                                    type="submit"
                                                    variant="primary"
                                                    className="w-full py-3 text-lg font-semibold bg-gradient-to-r from-bleu to-persianIndigo hover:from-bleu/90 hover:to-persianIndigo/90 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]"
                                                >
                                                    🛒 Acheter maintenant
                                                </Button>
                                                {existingTransaction ? (
                                                    <Link
                                                        className={buttonVariants({
                                                            variant: 'secondary',
                                                            className: 'w-full',
                                                        })}
                                                        to={`/transactions/${existingTransaction?.id}`}
                                                    >
                                                        Voir ma conversation
                                                    </Link>
                                                ) : null}
                                                <ErrorList errors={form.errors} />
                                                <p className="text-xs text-gray-500 text-center">
                                                    Paiement sécurisé avec Stripe
                                                </p>
                                            </Form>
                                        ) : (
                                            <Form
                                                className="space-y-4"
                                                {...getFormProps(form)}
                                                method="POST"
                                            >
                                                <Button
                                                    name="action"
                                                    value="create-transaction"
                                                    type="submit"
                                                    variant="primary"
                                                    className="w-full py-3 text-lg font-semibold bg-gradient-to-r from-bleu to-persianIndigo hover:from-bleu/90 hover:to-persianIndigo/90 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]"
                                                >
                                                    ✨ Cette offre m'intéresse
                                                </Button>
                                                <ErrorList errors={form.errors} />
                                                <p className="text-xs text-gray-500 text-center">
                                                    En cliquant, vous démarrez une conversation avec le prestataire
                                                </p>
                                            </Form>
                                        )}
                                    </div>

                                    {/* Additional Info */}
                                    <div className="pt-4 border-t border-gray-200">
                                        <div className="space-y-3 text-sm text-gray-600">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 bg-vert rounded-full"></div>
                                                <span>Réponse rapide</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 bg-vert rounded-full"></div>
                                                <span>Service de qualité</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 bg-vert rounded-full"></div>
                                                <span>Satisfaction garantie</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export const ErrorBoundary = () => {
    const { offerId } = useParams();
    return (
        <div className="min-h-screen bg-gradient-to-br from-extraLightTurquoise to-white flex items-center justify-center px-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
                <div className="w-16 h-16 bg-khmerCurry/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-khmerCurry" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                </div>
                <h2 className="text-2xl font-bold text-bleu mb-4">Annonce introuvable</h2>
                <p className="text-gray-600 mb-6">
                    Il semblerait que l'annonce{" "}
                    <span className="font-semibold text-bleu">{offerId}</span> que vous cherchez
                    n'existe pas ou a été supprimée.
                </p>
                <Link
                    to="/"
                    className={buttonVariants({
                        variant: "primary",
                        className: "w-full"
                    })}
                >
                    Retourner à la liste des annonces
                </Link>
            </div>
        </div>
    );
};
