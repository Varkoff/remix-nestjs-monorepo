import { type AppLoadContext } from "@remix-run/node";
import { type z } from "zod";
import { type OfferSchema } from "~/routes/_public+/transactions.$transactionId";

// 0 = message, 10 = offre en attente, 20 = offre acceptée, 90 = offre refusée
export enum TransactionMessageStatus {
    MESSAGE = 0,
    PENDING_OFFER = 10,
    ACCEPTED_OFFER = 20,
    REJECTED_OFFER = 90,
}
export const getTransactions = async ({
    context,
    userId,
}: {
    context: AppLoadContext;
    userId: string;
}) => {
    const transactions = await context.remixService.prisma.transaction.findMany({
        where: {
            OR: [
                {
                    user: {
                        id: userId,
                    },
                },
                {
                    offer: {
                        userId,
                    },
                },
            ],
        },
        select: {
            id: true,
            createdAt: true,
            updatedAt: true,
            user: {
                select: {
                    name: true,
                    id: true,
                },
            },
            offer: {
                select: {
                    title: true,
                    price: true,
                    user: {
                        select: {
                            name: true,
                            id: true,
                        },
                    },
                },
            },
        },
    });

    const myRequestedTransactions = transactions.filter(
        (transaction) => transaction.user.id === userId,
    );
    const myOfferedTransactions = transactions.filter(
        (transaction) => transaction.offer.user.id === userId,
    );
    return { myRequestedTransactions, myOfferedTransactions };
};

export const getTransaction = async ({
    transactionId,
    context,
    userId,
}: { transactionId: string; context: AppLoadContext; userId: string }) => {
    const transaction = await context.remixService.prisma.transaction.findUnique({
        where: {
            id: transactionId,
        },
        select: {
            id: true,
            user: {
                select: {
                    name: true,
                    id: true,
                },
            },
            messages: {
                select: {
                    userId: true,
                    content: true,
                    createdAt: true,
                    id: true,
                    user: {
                        select: {
                            name: true,
                        },
                    },
                    price: true,
                    status: true,
                },
                orderBy: {
                    createdAt: 'asc'
                }
            },
            offer: {
                select: {
                    title: true,
                    price: true,
                    description: true,
                    user: {
                        select: {
                            name: true,
                            id: true,
                        },
                    },
                },
            },
        },
    });

    if (!transaction) {
        throw new Error("La transaction n'a pas été trouvée");
    }

    if (transaction.user.id !== userId && transaction.offer.user.id !== userId) {
        throw new Error("Vous n'êtes pas autorisé à voir cette transaction");
    }

    return transaction;
};

export const createTransaction = async ({
    offerId,
    context,
    userId,
}: {
    offerId: string;
    context: AppLoadContext;
    userId: string;
}) => {
    return await context.remixService.prisma.transaction.create({
        data: {
            offer: {
                connect: {
                    id: offerId,
                },
            },
            user: {
                connect: {
                    id: userId,
                },
            },
        },
        select: {
            id: true,
        },
    });
};

export const sendMessage = async ({
    transactionId,
    context,
    userId,
    content,
}: {
    transactionId: string;
    context: AppLoadContext;
    userId: string;
    content: string;
}) => {
    const transaction = await getTransaction({
        context,
        transactionId,
        userId,
    });

    await context.remixService.prisma.message.create({
        data: {
            transaction: {
                connect: { id: transaction.id },
            },
            content,
            user: {
                connect: { id: userId },
            },
        },
    });
};


export const sendOffer = async ({
    transactionId,
    context,
    userId,
    offerData,
}: {
    transactionId: string;
    context: AppLoadContext;
    userId: string;
    offerData: z.infer<typeof OfferSchema>;
}) => {
    const transaction = await getTransaction({
        context,
        transactionId,
        userId,
    });

    const priceAsFloat = Number.parseFloat(offerData.price.toFixed(2));

    await context.remixService.prisma.message.create({
        data: {
            transaction: {
                connect: { id: transaction.id },
            },
            content: `${transaction.user.name} vous a fait une offre de ${priceAsFloat}€.`,
            price: priceAsFloat,
            status: TransactionMessageStatus.PENDING_OFFER,
            user: {
                connect: { id: userId },
            },
        },
    });
};

export const acceptTransactionOffer = async ({
    transactionId,
    messageId,
    context,
    userId,
}: {
    transactionId: string;
    messageId: string;
    context: AppLoadContext;
    userId: string;
}) => {
    const transaction = await getTransaction({
        context,
        transactionId,
        userId,
    });

    await context.remixService.prisma.message.update({
        data: {
            status: TransactionMessageStatus.ACCEPTED_OFFER,
        },
        where: {
            id: messageId,
            transactionId: transaction.id
        },
    });
};

export const declineTransactionOffer = async ({
    transactionId,
    messageId,
    context,
    userId,
}: {
    transactionId: string;
    messageId: string;
    context: AppLoadContext;
    userId: string;
}) => {
    const transaction = await getTransaction({
        context,
        transactionId,
        userId,
    });

    await context.remixService.prisma.message.update({
        data: {
            status: TransactionMessageStatus.REJECTED_OFFER,
        },
        where: {
            id: messageId,
            transactionId: transaction.id
        },
    });
};