import { type AppLoadContext } from "@remix-run/node";
import { type z } from "zod";
import { type CreateOfferSchema } from "~/routes/_public+/my-services.$offerId";
import { type EditProfileSchema } from "~/routes/_public+/profile";

export const getUserOffers = async ({
    userId,
    context,
}: { context: AppLoadContext; userId: string }) => {
    return await context.remixService.prisma.offer.findMany({
        select: {
            id: true,
            title: true,
            description: true,
            price: true,
            updatedAt: true,
            active: true,
            recurring: true,
        },
        where: {
            userId,
        },
        orderBy: {
            createdAt: "asc",
        },
    });
};

export const createOffer = async ({
    context,
    offerData,
    userId,
}: {
    context: AppLoadContext;
    offerData: z.infer<typeof CreateOfferSchema>;
    userId: string;
}) => {
    return await context.remixService.prisma.offer.create({
        data: {
            title: offerData.title,
            description: offerData.description,
            price: offerData.price,
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

export const getUserOffer = async ({
    userId,
    context,
    offerId,
}: { context: AppLoadContext; userId: string; offerId: string }) => {
    return await context.remixService.prisma.offer.findUnique({
        select: {
            id: true,
            title: true,
            description: true,
            price: true,
            updatedAt: true,
            active: true,
            recurring: true,
        },
        where: {
            id: offerId,
            userId,
        },
    });
};

export const editOffer = async ({
    context,
    offerId,
    offerData,
    userId,
}: {
    context: AppLoadContext;
    offerData: z.infer<typeof CreateOfferSchema>;
    userId: string;
    offerId: string;
}) => {
    return await context.remixService.prisma.offer.update({
        where: {
            id: offerId,
            userId,
        },
        data: {
            title: offerData.title,
            description: offerData.description,
            price: offerData.price,
            user: {
                connect: {
                    id: userId,
                },
            },
            active: offerData.active,
        },
        select: {
            id: true,
        },
    });
};



export const editProfile = async ({
    context,
    profileData,
    userId,
}: {
    context: AppLoadContext;
    profileData: z.infer<typeof EditProfileSchema>;
    userId: string;
}) => {
    return await context.remixService.prisma.user.update({
        where: {
            id: userId,
        },
        data: {
            email: profileData.email,
            name: profileData.name,
        },
        select: {
            id: true,
        },
    });
};
