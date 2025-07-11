import { type AppLoadContext } from "@remix-run/node";

export const getOffers = async ({ 
    context, 
    userId 
}: { 
    context: AppLoadContext; 
    userId?: string; 
}) => {
    const offers = await context.remixService.prisma.offer.findMany({
        select: {
            id: true,
            title: true,
            description: true,
            price: true,
            updatedAt: true,
            userId: true,
            imageFileKey: true,
            transactions: userId ? {
                where: {
                    userId: userId,
                },
                select: {
                    id: true,
                },
            } : false,
        },
        where: {
            active: true,
        },
    });
    
    const offersWithImagesAndTransactions = await Promise.all(offers.map(async (offer) => {
        let imageUrl = '';
        if (offer.imageFileKey) {
            imageUrl = await context.remixService.aws.getFileUrl({fileKey: offer.imageFileKey})
        }
        
        const { imageFileKey, transactions, ...offerProps } = offer;
        return {
            ...offerProps, 
            imageUrl,
            hasActiveTransaction: userId ? (transactions && transactions.length > 0) : false,
        };
    }))
    
    return offersWithImagesAndTransactions;
};

export const getOffer = async ({
    offerId,
    context,
}: { offerId: string; context: AppLoadContext }) => {
    const offer =  await context.remixService.prisma.offer.findUnique({
        where: {
            id: offerId,
            active: true,
        },
        select: {
            id: true,
            title: true,
            description: true,
            price: true,
            updatedAt: true,
            userId: true,
            imageFileKey: true,
            user: {
                select: {
                    id: true,
                    name: true,
                    avatarFileKey: true,
                },
            },
        },
    });
    
    if (!offer) {
        return null;
    }
    
    let imageUrl = "";
    if (offer.imageFileKey) {
        imageUrl = await context.remixService.aws.getFileUrl({fileKey: offer.imageFileKey})
    }
    
    let userAvatarUrl = "";
    if (offer.user.avatarFileKey) {
        userAvatarUrl = await context.remixService.aws.getFileUrl({fileKey: offer.user.avatarFileKey})
    }
    
    return {
        ...offer,
        imageUrl,
        user: {
            ...offer.user,
            avatarUrl: userAvatarUrl,
        },
    }
};

export const getExistingTransaction = async ({
    offerId,
    userId,
    context,
}: { offerId: string; userId: string; context: AppLoadContext }) => {
    return await context.remixService.prisma.transaction.findUnique({
        where: {
            offerId_userId: {
                offerId,
                userId,
            },
        },
        select: {
            id: true,
        },
    });
};