import {
    getFormProps,
    getInputProps,
    getTextareaProps,
    useForm,
} from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod";
import {
    json,
    type ActionFunctionArgs,
    type LoaderFunctionArgs,
    type SerializeFrom,
} from "@remix-run/node";
import { Link, useFetcher, useLoaderData, useParams } from "@remix-run/react";
import { Star } from "lucide-react";
import { useEffect, useRef } from "react";
import { z } from "zod";
import { Field, TextareaField } from "~/components/forms";
import { Button, buttonVariants } from "~/components/ui/button";
import { formatDate, formatPrice } from "~/lib/utils";
import { useUser } from "~/root";
import { requireUser } from "~/server/auth.server";
import {
    TransactionMessageStatus,
    acceptTransactionOffer,
    declineTransactionOffer,
    getTransaction,
    sendMessage,
    sendOffer,
} from "~/server/transactions.server";

export const OfferSchema = z.object({
    price: z
        .number({
            required_error: "Le prix est requis",
        })
        .min(1, "Le prix doit être supérieur à 0"),
    action: z.literal("offer"),
});

const MessageSchema = z.object({
    content: z.string({
        required_error: "Le contenu du message est requis",
    }),
    action: z.literal("message"),
});

const DeclineOfferSchema = z.object({
    action: z.literal("decline"),
    messageId: z.string({ required_error: "Vous devez fournir le message Id" }),
});

const AcceptOfferSchema = z.object({
    action: z.literal("accept"),
    messageId: z.string({ required_error: "Vous devez fournir le message Id" }),
});

const OfferMessageSchema = z.union([
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

type Message = SerializeFrom<
    Awaited<ReturnType<typeof getTransaction>>
>["messages"][0];

const Chatbox = ({ messages }: { messages: Message[] }) => {
    const user = useUser();
    const sendMessageFetcher = useFetcher<typeof action>();
    const sendOfferFetcher = useFetcher<typeof action>();
    const [form, fields] = useForm({
        constraint: getZodConstraint(MessageSchema),
        onValidate({ formData }) {
            return parseWithZod(formData, {
                schema: MessageSchema,
            });
        },
        lastResult: sendMessageFetcher.data?.result,
    });

    const [offerForm, offerFields] = useForm({
        constraint: getZodConstraint(OfferSchema),
        onValidate({ formData }) {
            return parseWithZod(formData, {
                schema: OfferSchema,
            });
        },
        lastResult: sendOfferFetcher.data?.result,
    });

    const divRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (!divRef.current) return;

        divRef.current.scrollTop = divRef.current.scrollHeight;
    }, [messages]);

    return (
        <>
            <div
                ref={divRef}
                className="flex flex-col px-3 py-2 gap-2 bg-slate-50 max-h-[200px] overflow-y-scroll"
            >
                {messages.map((message) => (
                    <MessageItem message={message} key={message.id} />
                ))}
            </div>
            <sendMessageFetcher.Form
                {...getFormProps(form)}
                method="POST"
                className="flex flex-col gap-2 mt-2"
            >
                <TextareaField
                    textareaProps={getTextareaProps(fields.content)}
                    labelProps={{
                        children: "Nouveau message",
                    }}
                    errors={fields.content.errors}
                />

                <div className="flex items-center gap-2 ml-auto">
                    <Button
                        variant={"primary"}
                        disabled={sendMessageFetcher.state === "submitting"}
                        type="submit"
                        name="action"
                        value={"message"}
                    >
                        Envoyer un message
                    </Button>
                </div>
            </sendMessageFetcher.Form>

            <hr />
            <sendOfferFetcher.Form
                {...getFormProps(offerForm)}
                method="POST"
                className="flex items-center justify-between gap-1"
            >
                <Field
                    inputProps={{
                        ...getInputProps(offerFields.price, {
                            type: "number",
                        }),
                    }}
                    labelProps={{
                        children: "votre offre (en €)",
                    }}
                    errors={offerFields.price.errors}
                />
                <Button
                    variant={"greenOutline"}
                    disabled={sendMessageFetcher.state === "submitting"}
                    type="submit"
                    form={getFormProps(offerForm).id}
                    name="action"
                    value="offer"
                >
                    Faire une offre
                </Button>
            </sendOfferFetcher.Form>
        </>
    );
};

const MessageItem = ({ message }: { message: Message }) => {
    const user = useUser();
    const acceptOfferFetcher = useFetcher<typeof action>();
    const declineOfferFetcher = useFetcher<typeof action>();

    const UserAction = () => {
        if (message.userId !== user.id) return null
        if (!message.price) return null
        if (message.status === TransactionMessageStatus.PENDING_OFFER) {
            return <div className="flex items-center gap-1 text-xs">
                <acceptOfferFetcher.Form method="POST">
                    <input type='hidden' name='messageId' value={message.id} />
                    <Button
                        name="action"
                        value="accept"
                        type="submit"
                        size={"sm"}
                        variant="greenOutline"
                    >
                        Accepter
                    </Button>
                </acceptOfferFetcher.Form>
                <declineOfferFetcher.Form method="POST">
                    <input type='hidden' name='messageId' value={message.id} />
                    <Button
                        name="action"
                        value="decline"
                        type="submit"
                        size={"sm"}
                        variant="redOutline"
                    >
                        Refuser
                    </Button>
                </declineOfferFetcher.Form>
            </div>
        }
        if (message.status === TransactionMessageStatus.ACCEPTED_OFFER) {
            return <span className={"text-green-700 text-xs"}>Offre acceptée</span>
        }

        if (message.status === TransactionMessageStatus.REJECTED_OFFER) {
            return <span className={"text-slate-500 text-xs"}>Offre refusée</span>
        }
        return <span className="text-xs text-red-600">Statut inconnu
        </span>
    }
    return (
        <div
            key={message.id}
            className={`flex ${message.userId === user.id ? "flex-row-reverse" : "flex-row"
                } gap-1 border bg-white border-slate-300 rounded-md px-1 py-1`}
        >
            <div className="flex w-fit flex-col gap-0.5 items-center justify-start basis-[50px]">
                <span className="text-[10px] text-gray-500 text-ellipsis overflow-hidden max-w-[10ch]">
                    {message.user.name}
                </span>
                <img
                    className="max-w-[24px] w-full h-auto rounded-full"
                    src="https://thispersondoesnotexist.com/"
                    alt="service"
                />
            </div>
            <div className="flex flex-col gap-1 grow">
                <span className="text-sm px-0.5 py-1 text-gray-800">
                    {message.content}
                </span>

                <div className="flex items-center gap-2">
                    <span
                        className={`${message.userId !== user.id ? "ml-auto" : ""
                            } text-[10px] text-gray-400`}
                    >
                        {formatDate({ date: message.createdAt })}
                    </span>
                    <UserAction />
                </div>
            </div>
        </div>
    );
};
