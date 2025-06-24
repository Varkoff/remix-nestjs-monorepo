import { parseWithZod } from "@conform-to/zod";
import {
    json,
    type ActionFunctionArgs,
    type LoaderFunctionArgs
} from "@remix-run/node";
import { Link, useLoaderData, useParams } from "@remix-run/react";
import { Star } from "lucide-react";
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
        <div className="max-w-[600px] mx-auto flex flex-col gap-3">
            <div className="flex flex-row flex-wrap gap-4">
                <div className="flex text-xs flex-col items-center gap-1 rounded-sm bg-slate-50 w-fit px-3 py-2">
                    <span className="text-xs font-semibold">{data.offer.user.name}</span>
                    <img
                        className="max-w-[80px] w-full h-auto rounded-full"
                        src="https://thispersondoesnotexist.com/"
                        alt="service"
                    />
                    <div className="flex flex-col gap-1 mt-2 text-xs">
                        <span className="text-gray-400 font-normal">
                            Actif il y a 30 minutes
                        </span>
                        <span className="text-gray-700">2 annonces actives</span>
                        <div className="flex items-center gap-1">
                            {Array.from({ length: 5 }, (_, index) => (
                                <Star
                                    className="size-3 fill-amber-400 stroke-amber-800"
                                    key={index}
                                />
                            ))}
                            <span className="text-[10px] text-gray-400">(27 avis)</span>
                        </div>
                    </div>
                </div>
                <div className="flex grow text-xs flex-col gap-1 rounded-sm bg-slate-50 w-fit px-3 py-2">
                    <h2 className="text-lg font-bold">{data.offer.title}</h2>{" "}
                    <span className="text-lg">
                        {formatPrice({ price: data.offer.price })}
                    </span>
                    <p className="text-balance max-w-[70ch]">{data.offer.description}</p>
                </div>
            </div>

            <Chatbox messages={data.messages} />
        </div>
    );
}

export const ErrorBoundary = () => {
    const { transactionId } = useParams();
    return (
        <div className="flex flex-col gap-3 py-8">
            <article className="px-6 space-y-4">
                <h2 className="text-3xl font-bold">Transaction introuvable</h2>
                <div className="flex flex-row flex-wrap gap-8">
                    <p>
                        Il semblerait que la transaction{" "}
                        <span className="font-bold">{transactionId}</span>
                        n'existe pas.
                    </p>
                </div>

                <Link
                    to="/"
                    className={buttonVariants({
                        variant: "primary",
                    })}
                >
                    Liste de mes annonces
                </Link>
            </article>
        </div>
    );
};

