import { getFormProps, getInputProps, getTextareaProps, useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod";
import { type SerializeFrom } from "@remix-run/node";
import { useFetcher } from "@remix-run/react";
import { useEffect, useRef } from "react";
import { formatDate } from "~/lib/utils";
import { useUser } from "~/root";
import { MessageSchema, OfferSchema, TransactionMessageStatus, type action } from "~/routes/_public+/transactions.$transactionId";
import { type getTransaction } from "~/server/transactions.server";
import { Field, TextareaField } from "./forms";
import { Button } from "./ui/button";

type Message = SerializeFrom<
    Awaited<ReturnType<typeof getTransaction>>
>["messages"][0];

export const Chatbox = ({ messages }: { messages: Message[] }) => {
    // const user = useUser();
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
