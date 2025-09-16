import { type AppLoadContext } from "@remix-run/node";
import { type z } from "zod";
import { type CreateOfferSchema } from "~/routes/_public+/my-services.$offerId";
import { type EditProfileSchema } from "~/routes/_public+/profile";

export const getUserOffers = async ({
    userId,
    context,
}: { context: AppLoadContext; userId: string }) => {
    const offers = await context.remixService.prisma.offer.findMany({
        select: {
            id: true,
            title: true,
            description: true,
            price: true,
            updatedAt: true,
            active: true,
            recurring: true,
            imageFileKey: true,
            stripeProductId: true,
            stripePriceId: true,
        },
        where: {
            userId,
        },
        orderBy: {
            createdAt: "asc",
        },
    });

    // Get image URLs for all offers
    const offersWithImages = await Promise.all(
        offers.map(async (offer) => {
            let imageUrl = "";
            if (offer.imageFileKey) {
                imageUrl = await context.remixService.aws.getFileUrl({
                    fileKey: offer.imageFileKey
                });
            }
            return {
                ...offer,
                imageUrl,
                isStripeSynced: Boolean(offer.stripeProductId && offer.stripePriceId),
            };
        })
    );

    return offersWithImages;
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
    const created = await context.remixService.prisma.offer.create({
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
    await context.remixService.stripe.upsertOfferProduct(created.id);
    return created;
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
    const updated = await context.remixService.prisma.offer.update({
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
    await context.remixService.stripe.upsertOfferProduct(updated.id);
    return updated;
};

export const getUserWithAvatar = async ({
    userId,
    context,
}: { context: AppLoadContext; userId: string }) => {
    const user = await context.remixService.prisma.user.findUnique({
        select: {
            id: true,
            email: true,
            name: true,
            avatarFileKey: true,
        },
        where: {
            id: userId,
        },
    });

    if (!user) {
        throw new Error("User not found");
    }

    let avatarUrl = "";
    if (user.avatarFileKey) {
        avatarUrl = await context.remixService.aws.getFileUrl({
            fileKey: user.avatarFileKey
        });
    }

    return {
        ...user,
        avatarUrl,
    };
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
    let avatarFileKey: string | null = null;
    if (profileData.avatar) {
        const { fileKey } = await context.remixService.aws.uploadFile({
            file: {
                size: profileData.avatar.size,
                mimetype: profileData.avatar.type,
                originalname: profileData.avatar.name,
                buffer: Buffer.from(await profileData.avatar.arrayBuffer()),
            },
        });
        avatarFileKey = fileKey;
    }

    return await context.remixService.prisma.user.update({
        where: {
            id: userId,
        },
        data: {
            email: profileData.email,
            name: profileData.name,
            ...(avatarFileKey && { avatarFileKey }),
        },
        select: {
            id: true,
        },
    });
};
