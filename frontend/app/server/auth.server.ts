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

export const getNotificationStats = async ({
    context,
    userId,
}: {
    context: AppLoadContext;
    userId: string;
}) => {
    // Compter les offres en attente que l'utilisateur doit accepter/refuser
    const pendingOffers = await context.remixService.prisma.message.count({
        where: {
            status: 10, // PENDING_OFFER
            transaction: {
                offer: {
                    userId: userId, // L'utilisateur est le propriétaire de l'offre
                },
            },
        },
    });

    // Compter les transactions actives (où l'utilisateur est impliqué)
    const activeTransactions = await context.remixService.prisma.transaction.count({
        where: {
            OR: [
                { userId: userId }, // L'utilisateur a initié la transaction
                { offer: { userId: userId } }, // L'utilisateur possède l'offre
            ],
        },
    });

    // Compter les offres actives de l'utilisateur
    const activeOffers = await context.remixService.prisma.offer.count({
        where: {
            userId: userId,
            active: true,
        },
    });

    // Compter les messages récents où l'utilisateur doit répondre
    // (messages dans les transactions où l'utilisateur est impliqué mais n'est pas le dernier à avoir écrit)
    const transactionsWithLastMessage = await context.remixService.prisma.transaction.findMany({
        where: {
            OR: [
                { userId: userId },
                { offer: { userId: userId } },
            ],
        },
        include: {
            messages: {
                orderBy: { createdAt: 'desc' },
                take: 1,
                include: {
                    user: true,
                },
            },
        },
    });

    const pendingReplies = transactionsWithLastMessage.filter(transaction => {
        const lastMessage = transaction.messages[0];
        return lastMessage && lastMessage.userId !== userId && lastMessage.status === 0; // Message normal, pas une offre
    }).length;

    return {
        pendingOffers,
        activeTransactions,
        activeOffers,
        pendingReplies,
    };
};

export const getNotifications = async ({
    context,
    userId,
}: {
    context: AppLoadContext;
    userId: string;
}) => {
    // Récupérer les offres en attente avec détails
    const pendingOffers = await context.remixService.prisma.message.findMany({
        where: {
            status: 10, // PENDING_OFFER
            transaction: {
                offer: {
                    userId: userId, // L'utilisateur est le propriétaire de l'offre
                },
            },
        },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                },
            },
            transaction: {
                include: {
                    offer: {
                        select: {
                            id: true,
                            title: true,
                        },
                    },
                },
            },
        },
        orderBy: {
            createdAt: 'desc',
        },
        take: 10,
    });

    // Récupérer les messages récents où l'utilisateur doit répondre
    const recentMessages = await context.remixService.prisma.message.findMany({
        where: {
            status: 0, // Messages normaux
            transaction: {
                OR: [
                    { userId: userId },
                    { offer: { userId: userId } },
                ],
            },
            NOT: {
                userId: userId, // Exclure les messages de l'utilisateur lui-même
            },
        },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                },
            },
            transaction: {
                include: {
                    offer: {
                        select: {
                            id: true,
                            title: true,
                        },
                    },
                },
            },
        },
        orderBy: {
            createdAt: 'desc',
        },
        take: 10,
    });

    // Récupérer les transactions récemment créées
    const recentTransactions = await context.remixService.prisma.transaction.findMany({
        where: {
            offer: {
                userId: userId, // L'utilisateur possède l'offre
            },
        },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                },
            },
            offer: {
                select: {
                    id: true,
                    title: true,
                },
            },
        },
        orderBy: {
            createdAt: 'desc',
        },
        take: 5,
    });

    // Combiner et trier toutes les notifications par date
    const allNotifications = [
        ...pendingOffers.map(offer => ({
            id: offer.id,
            type: 'pending_offer' as const,
            title: `Offre de ${offer.price}€ reçue`,
            description: `${offer.user.name} vous a fait une offre pour "${offer.transaction.offer.title}"`,
            createdAt: offer.createdAt,
            transactionId: offer.transaction.id,
            urgent: true,
        })),
        ...recentMessages.map(message => ({
            id: message.id,
            type: 'message' as const,
            title: 'Nouveau message',
            description: `${message.user.name} a écrit concernant "${message.transaction.offer.title}"`,
            createdAt: message.createdAt,
            transactionId: message.transaction.id,
            urgent: false,
        })),
        ...recentTransactions.map(transaction => ({
            id: transaction.id,
            type: 'transaction' as const,
            title: 'Nouvelle demande',
            description: `${transaction.user.name} s'intéresse à "${transaction.offer.title}"`,
            createdAt: transaction.createdAt,
            transactionId: transaction.id,
            urgent: false,
        })),
    ];

    // Trier par date décroissante et limiter à 15 notifications
    return allNotifications
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 15);
};
