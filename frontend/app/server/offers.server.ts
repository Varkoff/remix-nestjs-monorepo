import { type AppLoadContext } from "@remix-run/node";

export const getOffers = async ({ context }: { context: AppLoadContext }) => {
    const offers = await context.remixService.prisma.offer.findMany({
        select: {
            id: true,
            title: true,
            description: true,
            price: true,
            updatedAt: true,
            userId: true,
            imageFileKey: true
        },
        where: {
            active: true,
        },
    });
    const offersWithImages = await Promise.all(offers.map(async (offer) => {
        let imageUrl = '';
        const { imageFileKey, ...offerProps } = offer;
        if (imageFileKey) {
            imageUrl = await context.remixService.aws.getFileUrl({fileKey: imageFileKey})
        }
        return {...offerProps, imageUrl};
    }))
    return offersWithImages;
};

export const getOffer = async ({
    offerId,
    context,
}: { offerId: string; context: AppLoadContext }) => {
    return await context.remixService.prisma.offer.findUnique({
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
            userId: true
        },
    });
};