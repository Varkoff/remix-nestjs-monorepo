import { type AppLoadContext } from "@remix-run/node";
import { type z } from "zod";
import { type OfferSchema, TransactionMessageStatus } from "~/routes/_public+/transactions.$transactionId";


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
            stripePaymentIntentId: true,
            user: {
                select: {
                    name: true,
                    id: true,
                    avatarFileKey: true,
                },
            },
            offer: {
                select: {
                    id: true,
                    title: true,
                    price: true,
                    imageFileKey: true,
                    user: {
                        select: {
                            name: true,
                            id: true,
                            avatarFileKey: true,
                        },
                    },
                },
            },
        },
    });

    // Get image URLs for all offers and avatar URLs for all users
    const transactionsWithImagesAndAvatars = await Promise.all(
        transactions.map(async (transaction) => {
            let imageUrl = "";
            if (transaction.offer.imageFileKey) {
                imageUrl = await context.remixService.aws.getFileUrl({
                    fileKey: transaction.offer.imageFileKey
                });
            }

            // Get avatar URL for transaction user
            let transactionUserAvatarUrl = "";
            if (transaction.user.avatarFileKey) {
                transactionUserAvatarUrl = await context.remixService.aws.getFileUrl({
                    fileKey: transaction.user.avatarFileKey
                });
            }

            // Get avatar URL for offer user
            let offerUserAvatarUrl = "";
            if (transaction.offer.user.avatarFileKey) {
                offerUserAvatarUrl = await context.remixService.aws.getFileUrl({
                    fileKey: transaction.offer.user.avatarFileKey
                });
            }

            return {
                ...transaction,
                user: {
                    ...transaction.user,
                    avatarUrl: transactionUserAvatarUrl,
                },
                offer: {
                    ...transaction.offer,
                    imageUrl,
                    user: {
                        ...transaction.offer.user,
                        avatarUrl: offerUserAvatarUrl,
                    },
                },
            };
        })
    );

    const myRequestedTransactions = transactionsWithImagesAndAvatars.filter(
        (transaction) => transaction.user.id === userId,
    );
    const myOfferedTransactions = transactionsWithImagesAndAvatars.filter(
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
                    avatarFileKey: true,
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
                            avatarFileKey: true,
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
                    id: true,
                    title: true,
                    price: true,
                    description: true,
                    user: {
                        select: {
                            name: true,
                            id: true,
                            avatarFileKey: true,
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

    // Generate avatar URLs for all users
    const messagesWithAvatars = await Promise.all(
        transaction.messages.map(async (message) => {
            let avatarUrl = "";
            if (message.user.avatarFileKey) {
                avatarUrl = await context.remixService.aws.getFileUrl({
                    fileKey: message.user.avatarFileKey
                });
            }
            return {
                ...message,
                user: {
                    ...message.user,
                    avatarUrl,
                },
            };
        })
    );

    // Generate avatar URL for transaction user
    let transactionUserAvatarUrl = "";
    if (transaction.user.avatarFileKey) {
        transactionUserAvatarUrl = await context.remixService.aws.getFileUrl({
            fileKey: transaction.user.avatarFileKey
        });
    }

    // Generate avatar URL for offer user
    let offerUserAvatarUrl = "";
    if (transaction.offer.user.avatarFileKey) {
        offerUserAvatarUrl = await context.remixService.aws.getFileUrl({
            fileKey: transaction.offer.user.avatarFileKey
        });
    }

    return {
        ...transaction,
        messages: messagesWithAvatars,
        user: {
            ...transaction.user,
            avatarUrl: transactionUserAvatarUrl,
        },
        offer: {
            ...transaction.offer,
            user: {
                ...transaction.offer.user,
                avatarUrl: offerUserAvatarUrl,
            },
        },
    };
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

