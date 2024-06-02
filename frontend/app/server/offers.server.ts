import { type AppLoadContext } from "@remix-run/node";

export const getOffers = async ({ context }: { context: AppLoadContext }) => {
    return await context.remixService.prisma.offer.findMany({
        select: {
            id: true,
            title: true,
            description: true,
            price: true,
            updatedAt: true,
            userId: true
        },
        where: {
            active: true,
        },
    });
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