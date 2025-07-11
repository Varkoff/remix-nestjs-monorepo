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

// Avatar component that shows either the user's avatar or initials
const Avatar = ({ user, className = "w-6 h-6" }: { 
    user: { name: string | null; avatarUrl?: string }, 
    className?: string 
}) => {
    const getInitials = (name: string | null) => {
        if (!name) return "?";
        return name
            .split(' ')
            .map(word => word.charAt(0))
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    if (user.avatarUrl) {
        return (
            <img
                className={`${className} rounded-full object-cover`}
                src={user.avatarUrl}
                alt={`Avatar de ${user.name || "Utilisateur"}`}
            />
        );
    }

    return (
        <div className={`${className} rounded-full bg-bleuClair flex items-center justify-center text-bleu font-semibold text-xs`}>
            {getInitials(user.name)}
        </div>
    );
};

export const Chatbox = ({ messages, transaction }: { messages: Message[], transaction: SerializeFrom<Awaited<ReturnType<typeof getTransaction>>> }) => {
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

    // Group messages by consecutive sender
    const groupedMessages = messages.reduce((groups, message, index) => {
        const prevMessage = messages[index - 1];
        const isNewGroup = !prevMessage || prevMessage.userId !== message.userId;
        
        if (isNewGroup) {
            groups.push([message]);
        } else {
            groups[groups.length - 1].push(message);
        }
        
        return groups;
    }, [] as Message[][]);

    return (
        <div className="space-y-4">
            {/* Messages */}
            <div
                ref={divRef}
                className="space-y-4 max-h-[400px] overflow-y-auto p-4 bg-gray-50 rounded-lg"
            >
                {groupedMessages.map((group, groupIndex) => (
                    <MessageGroup 
                        key={groupIndex} 
                        messages={group} 
                        transaction={transaction} 
                    />
                ))}
            </div>

            {/* Message Form */}
            <sendMessageFetcher.Form
                {...getFormProps(form)}
                method="POST"
                className="space-y-3"
            >
                <TextareaField
                    textareaProps={{
                        ...getTextareaProps(fields.content),
                        placeholder: "Tapez votre message...",
                        rows: 3,
                    }}
                    labelProps={{
                        children: "Nouveau message",
                        className: "sr-only",
                    }}
                    errors={fields.content.errors}
                />

                <div className="flex justify-end">
                    <Button
                        variant="primary"
                        disabled={sendMessageFetcher.state === "submitting"}
                        type="submit"
                        name="action"
                        value="message"
                        size="sm"
                    >
                        {sendMessageFetcher.state === "submitting" ? "Envoi..." : "Envoyer"}
                    </Button>
                </div>
            </sendMessageFetcher.Form>

            {/* Offer Form */}
            <div className="border-t pt-4">
                <sendOfferFetcher.Form
                    {...getFormProps(offerForm)}
                    method="POST"
                    className="bg-green-50 rounded-lg p-4 space-y-3"
                >
                    <h3 className="font-medium text-green-800 text-sm">Faire une offre de prix</h3>
                    <div className="flex gap-3 items-end">
                        <div className="flex-1">
                            <Field
                                inputProps={{
                                    ...getInputProps(offerFields.price, {
                                        type: "number",
                                    }),
                                    step: "0.01",
                                    min: "0",
                                    placeholder: "0.00",
                                }}
                                labelProps={{
                                    children: "Prix (€)",
                                    className: "text-sm font-medium text-green-800",
                                }}
                                errors={offerFields.price.errors}
                            />
                        </div>
                        <Button
                            variant="greenOutline"
                            disabled={sendOfferFetcher.state === "submitting"}
                            type="submit"
                            name="action"
                            value="offer"
                            size="sm"
                        >
                            {sendOfferFetcher.state === "submitting" ? "Envoi..." : "Proposer"}
                        </Button>
                    </div>
                </sendOfferFetcher.Form>
            </div>
        </div>
    );
};

const MessageGroup = ({ messages, transaction }: { 
    messages: Message[], 
    transaction: SerializeFrom<Awaited<ReturnType<typeof getTransaction>>> 
}) => {
    const user = useUser();
    const firstMessage = messages[0];
    const isOwnMessage = firstMessage.userId === user.id;

    if (isOwnMessage) {
        // Messages envoyés - alignés à droite
        return (
            <div className="space-y-2">
                {/* Premier message avec avatar à droite */}
                <div className="flex gap-3 items-start justify-end">
                    <div className="flex-1 space-y-1 flex flex-col items-end">
                        <div className="text-xs text-gray-500">
                            {firstMessage.user.name}
                        </div>
                        <MessageBubble 
                            message={firstMessage} 
                            transaction={transaction}
                            isOwnMessage={isOwnMessage}
                        />
                    </div>
                    <div className="flex-shrink-0">
                        <Avatar user={firstMessage.user} className="w-8 h-8" />
                    </div>
                </div>

                {/* Messages suivants alignés à droite */}
                {messages.slice(1).map((message) => (
                    <div key={message.id} className="flex justify-end">
                        <MessageBubble 
                            message={message} 
                            transaction={transaction}
                            isOwnMessage={isOwnMessage}
                        />
                    </div>
                ))}
            </div>
        );
    }

    // Messages reçus - alignés à gauche
    return (
        <div className="space-y-2">
            {/* Premier message avec avatar à gauche */}
            <div className="flex gap-3 items-start">
                <div className="flex-shrink-0">
                    <Avatar user={firstMessage.user} className="w-8 h-8" />
                </div>
                <div className="flex-1 space-y-1">
                    <div className="text-xs text-gray-500">
                        {firstMessage.user.name}
                    </div>
                    <MessageBubble 
                        message={firstMessage} 
                        transaction={transaction}
                        isOwnMessage={isOwnMessage}
                    />
                </div>
            </div>

            {/* Messages suivants alignés à gauche */}
            {messages.slice(1).map((message) => (
                <div key={message.id}>
                    <MessageBubble 
                        message={message} 
                        transaction={transaction}
                        isOwnMessage={isOwnMessage}
                    />
                </div>
            ))}
        </div>
    );
};

const MessageBubble = ({ message, transaction, isOwnMessage }: { 
    message: Message, 
    transaction: SerializeFrom<Awaited<ReturnType<typeof getTransaction>>>,
    isOwnMessage: boolean
}) => {
    const user = useUser();
    const acceptOfferFetcher = useFetcher<typeof action>();
    const declineOfferFetcher = useFetcher<typeof action>();

    const UserAction = () => {
        if (!message.price) return null;
        
        if (message.status === TransactionMessageStatus.PENDING_OFFER) {
            if (user.id !== transaction.offer.user.id) return null;
            
            return (
                <div className="flex items-center gap-2 mt-2">
                    <acceptOfferFetcher.Form method="POST" className="inline">
                        <input type='hidden' name='messageId' value={message.id} />
                        <Button
                            name="action"
                            value="accept"
                            type="submit"
                            size="sm"
                            variant="greenOutline"
                        >
                            Accepter
                        </Button>
                    </acceptOfferFetcher.Form>
                    <declineOfferFetcher.Form method="POST" className="inline">
                        <input type='hidden' name='messageId' value={message.id} />
                        <Button
                            name="action"
                            value="decline"
                            type="submit"
                            size="sm"
                            variant="redOutline"
                        >
                            Refuser
                        </Button>
                    </declineOfferFetcher.Form>
                </div>
            );
        }
        
        if (message.status === TransactionMessageStatus.ACCEPTED_OFFER) {
            return <div className="text-green-600 text-xs mt-1 font-medium">✓ Offre acceptée</div>;
        }

        if (message.status === TransactionMessageStatus.REJECTED_OFFER) {
            return <div className="text-gray-500 text-xs mt-1">✗ Offre refusée</div>;
        }
        
        return null;
    };

    const getBubbleStyle = () => {
        if (message.price) {
            // Offer message - keep some distinction but subtle
            if (message.status === TransactionMessageStatus.ACCEPTED_OFFER) {
                return "bg-gray-100 border border-gray-200 text-gray-800";
            }
            if (message.status === TransactionMessageStatus.REJECTED_OFFER) {
                return "bg-gray-100 border border-gray-200 text-gray-600";
            }
            return "bg-gray-100 border border-gray-300 text-gray-800 font-medium";
        }
        
        // Regular message - simple gray background
        return "bg-gray-100 border border-gray-200 text-gray-900";
    };

    return (
        <div className="space-y-1">
            <div className={`rounded-lg px-3 py-2 ${getBubbleStyle()} break-words`}>
                <div className="text-sm">
                    {message.content}
                </div>
            </div>
            
            <div className={`flex items-center ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                <div className="text-xs text-gray-500">
                    {formatDate({ date: message.createdAt })}
                </div>
            </div>
            
            <UserAction />
        </div>
    );
};
