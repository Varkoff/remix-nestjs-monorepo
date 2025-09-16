import { parseWithZod } from "@conform-to/zod";
import {
    json,
    type ActionFunctionArgs,
    type LoaderFunctionArgs
} from "@remix-run/node";
import { Link, useLoaderData, useParams } from "@remix-run/react";
import { ArrowLeft, MessageCircle } from "lucide-react";
import { z } from "zod";
import { Chatbox } from "~/components/Chatbox";
import { buttonVariants } from "~/components/ui/button";
import { formatPrice } from "~/lib/utils";
import { requireUser } from "~/server/auth.server";
import {
    acceptTransactionOffer,
    declineTransactionOffer,
    getTransaction,
    sendMessage,
    sendOffer
} from "~/server/transactions.server";

export const OfferSchema = z.object({
    price: z
        .number({
            required_error: "Le prix est requis",
        })
        .min(1, "Le prix doit être supérieur à 0"),
    action: z.literal("offer"),
});

// 0 = message, 10 = offre en attente, 20 = offre acceptée, 90 = offre refusée
export enum TransactionMessageStatus {
    MESSAGE = 0,
    PENDING_OFFER = 10,
    ACCEPTED_OFFER = 20,
    REJECTED_OFFER = 90,
}


export const MessageSchema = z.object({
    content: z.string({
        required_error: "Le contenu du message est requis",
    }),
    action: z.literal("message"),
});

export const DeclineOfferSchema = z.object({
    action: z.literal("decline"),
    messageId: z.string({ required_error: "Vous devez fournir le message Id" }),
});

export const AcceptOfferSchema = z.object({
    action: z.literal("accept"),
    messageId: z.string({ required_error: "Vous devez fournir le message Id" }),
});

export const OfferMessageSchema = z.union([
    OfferSchema,
    MessageSchema,
    DeclineOfferSchema,
    AcceptOfferSchema,
]);
export const loader = async ({ context, params }: LoaderFunctionArgs) => {
    const user = await requireUser({ context });
    const transactionId = params.transactionId;
    if (!transactionId) {
        throw new Error("Transaction ID is required");
    }
    return json(
        await getTransaction({
            context,
            transactionId,
            userId: user.id,
        }),
    );
};

export const action = async ({
    context,
    params,
    request,
}: ActionFunctionArgs) => {
    const user = await requireUser({ context });
    const transactionId = params.transactionId;
    if (!transactionId) {
        throw new Error("Transaction ID is required");
    }

    const formData = await request.formData();
    const submission = parseWithZod(formData, {
        schema: OfferMessageSchema,
    });

    if (submission.status !== "success") {
        return json(
            { result: submission.reply() },
            {
                status: 400,
            },
        );
    }

    switch (submission.value.action) {
        case "message": {
            await sendMessage({
                context,
                transactionId,
                userId: user.id,
                content: submission.value.content,
            });
            return json({
                result: submission.reply({
                    resetForm: true,
                }),
            });
        }
        case "offer": {
            await sendOffer({
                context,
                transactionId,
                userId: user.id,
                offerData: submission.value,
            });
            return json({
                result: submission.reply({
                    resetForm: true,
                }),
            });
        }
        case "accept": {
            await acceptTransactionOffer({
                context,
                messageId: submission.value.messageId,
                userId: user.id,
                transactionId
            })
            return json({
                result: submission.reply({
                    resetForm: true,
                }),
            });
        }
        case "decline": {
            await declineTransactionOffer({
                context,
                messageId: submission.value.messageId,
                userId: user.id,
                transactionId
            })
            return json({
                result: submission.reply({
                    resetForm: true,
                }),
            });
        }
        default: {
            throw json({
                result: submission.reply({}),
            });
        }
    }
};

export default function TransactionDetail() {
    const data = useLoaderData<typeof loader>();
    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-4xl mx-auto px-4 py-4 sm:py-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <Link
                        to="/transactions"
                        className="inline-flex items-center gap-2 text-bleu hover:text-bleu/80 transition-colors"
                    >
                        <ArrowLeft className="size-4" />
                        <span className="hidden sm:inline">Retour</span>
                    </Link>
                    <Link
                        to={`/offers/${data.offer.id}`}
                        className="inline-flex items-center gap-2 text-bleu hover:text-bleu/80 transition-colors text-sm"
                    >
                        Voir l'offre
                        <ArrowLeft className="size-4 rotate-180" />
                    </Link>
                </div>

                {/* Main Content */}
                <div className="grid lg:grid-cols-4 gap-4">
                    {/* Offer Info - Compact */}
                    <div className="lg:col-span-1 order-2 lg:order-1">
                        <div className="bg-white rounded-lg shadow-sm border p-4 space-y-4">
                            {/* Provider */}
                            <div className="flex items-center gap-3">
                                {data.offer.user.avatarUrl ? (
                                    <img
                                        src={data.offer.user.avatarUrl}
                                        alt={`Avatar de ${data.offer.user.name}`}
                                        className="w-12 h-12 rounded-full object-cover"
                                    />
                                ) : (
                                    <div className="w-12 h-12 bg-bleuClair rounded-full flex items-center justify-center">
                                        <span className="text-bleu font-semibold text-sm">
                                            {data.offer.user.name
                                                ?.split(' ')
                                                .map(word => word.charAt(0))
                                                .join('')
                                                .toUpperCase()
                                                .slice(0, 2) || "?"}
                                        </span>
                                    </div>
                                )}
                                <div>
                                    <h3 className="font-semibold text-bleu text-sm">
                                        {data.offer.user.name}
                                    </h3>
                                    <p className="text-xs text-gray-500">Prestataire</p>
                                </div>
                            </div>

                            {/* Offer Details */}
                            <div className="pt-3 border-t border-gray-100">
                                <h4 className="font-medium text-gray-900 text-sm mb-2">
                                    {data.offer.title}
                                </h4>
                                <div className="text-lg font-bold text-persianIndigo mb-2">
                                    {formatPrice({ price: data.offer.price })}
                                </div>
                                <p className="text-xs text-gray-600 line-clamp-3">
                                    {data.offer.description}
                                </p>
                            </div>

                            {/* Status */}
                            <div className="pt-3 border-t border-gray-100">
                                <div className="flex items-center gap-2 text-xs text-gray-600">
                                    <div className="w-2 h-2 bg-vert rounded-full"></div>
                                    <span>Transaction active</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-gray-600 mt-1">
                                    <MessageCircle className="size-3" />
                                    <span>{data.messages.length} message{data.messages.length > 1 ? 's' : ''}</span>
                                </div>
                                {/* Paid indicator derives from presence of an accepted message */}
                                {data.messages.some(m => m.status === 20) ? (
                                    <div className="flex items-center gap-2 text-xs text-emerald-700 mt-1">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                        <span>Payée</span>
                                    </div>
                                ) : null}
                            </div>
                        </div>
                    </div>

                    {/* Chat Section */}
                    <div className="lg:col-span-3 order-1 lg:order-2">
                        <div className="bg-white rounded-lg shadow-sm border">
                            {/* Chat Header */}
                            <div className="p-4 border-b border-gray-100">
                                <div className="flex items-center gap-2">
                                    <MessageCircle className="size-5 text-bleu" />
                                    <h2 className="font-semibold text-bleu">Conversation</h2>
                                </div>
                            </div>

                            {/* Chat Content */}
                            <div className="p-4">
                                <Chatbox messages={data.messages} transaction={data} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export const ErrorBoundary = () => {
    const { transactionId } = useParams();
    return (
        <div className="min-h-screen bg-gradient-to-br from-extraLightTurquoise to-white flex items-center justify-center px-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
                <div className="w-16 h-16 bg-khmerCurry/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-khmerCurry" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                </div>
                <h2 className="text-2xl font-bold text-bleu mb-4">Transaction introuvable</h2>
                <p className="text-gray-600 mb-6">
                    Il semblerait que la transaction{" "}
                    <span className="font-semibold text-bleu">{transactionId}</span>{" "}
                    n'existe pas ou que vous n'y avez pas accès.
                </p>
                <Link
                    to="/transactions"
                    className={buttonVariants({
                        variant: "primary",
                        className: "w-full"
                    })}
                >
                    Retour à mes transactions
                </Link>
            </div>
        </div>
    );
};

