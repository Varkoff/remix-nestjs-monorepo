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
    let imageFileKey : string | null = null;
    if (offerData.image) {
        const { fileKey } = await context.remixService.aws.uploadFile({
            file: {
                size: offerData.image.size,
                mimetype: offerData.image.type,
                originalname: offerData.image.name,
                buffer: Buffer.from(await offerData.image.arrayBuffer()),
            },
        })
        imageFileKey = fileKey;
    }
    return await context.remixService.prisma.offer.create({
        data: {
            title: offerData.title,
            description: offerData.description,
            price: offerData.price,
            ...(imageFileKey && { imageFileKey }),
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
    const offer = await context.remixService.prisma.offer.findUnique({
        select: {
            id: true,
            title: true,
            description: true,
            price: true,
            updatedAt: true,
            active: true,
            recurring: true,
            imageFileKey: true,
        },
        where: {
            id: offerId,
            userId,
        },
    });
    let imageUrl = "";
    if (offer?.imageFileKey) {
        imageUrl = await context.remixService.aws.getFileUrl({fileKey: offer.imageFileKey})
    }
    return {
        ...offer,
        imageUrl,
    }
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
    let imageFileKey : string | null = null;
    if (offerData.image) {
        const { fileKey } = await context.remixService.aws.uploadFile({
            file: {
                size: offerData.image.size,
                mimetype: offerData.image.type,
                originalname: offerData.image.name, 
                buffer: Buffer.from(await offerData.image.arrayBuffer()),
            },
        })
        imageFileKey = fileKey;
    }
    return await context.remixService.prisma.offer.update({
        where: {
            id: offerId,
            userId,
        },
        data: {
            title: offerData.title,
            description: offerData.description,
            price: offerData.price,
            ...(imageFileKey && { imageFileKey }),
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
