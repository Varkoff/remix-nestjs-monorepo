import { type AppLoadContext } from "@remix-run/node";
import { getPagination } from "~/lib/utils";
import { filtersLoader } from "~/routes/_index";

export const getOffers = async ({
  context,
  userId,
  filters,
}: {
  context: AppLoadContext;
  userId?: string;
  filters: Awaited<ReturnType<typeof filtersLoader>>;
}) => {
  const {
    skip,
    take,
    page: currentPage,
    perPage: safePerPage,
  } = getPagination({
    page: filters.page,
    perPage: filters.perPage,
    maxPerPage: 50,
  });

  const where = {
    active: true as const,
    ...(filters.q && filters.q.trim().length > 0
      ? {
          OR: [
            { title: { contains: filters.q, mode: "insensitive" as const } },
            {
              description: {
                contains: filters.q,
                mode: "insensitive" as const,
              },
            },
          ],
        }
      : {}),
  };

  const [offers, total] = await Promise.all([
    context.remixService.prisma.offer.findMany({
      select: {
        id: true,
        title: true,
        description: true,
        price: true,
        updatedAt: true,
        userId: true,
        imageFileKey: true,
        transactions: userId
          ? {
              where: {
                userId: userId,
              },
              select: {
                id: true,
              },
            }
          : false,
      },
      where,
      orderBy: { updatedAt: "desc" },
      skip,
      take,
    }),
    context.remixService.prisma.offer.count({ where }),
  ]);

  const offersWithImagesAndTransactions = await Promise.all(
    offers.map(async (offer) => {
      let imageUrl = "";
      if (offer.imageFileKey) {
        imageUrl = await context.remixService.aws.getFileUrl({
          fileKey: offer.imageFileKey,
        });
      }

      const { imageFileKey, transactions, ...offerProps } = offer;
      return {
        ...offerProps,
        imageUrl,
        hasActiveTransaction: userId
          ? Boolean(transactions && transactions.length > 0)
          : false,
      };
    }),
  );

  const pageCount = Math.max(Math.ceil(total / safePerPage), 1);

  return {
    items: offersWithImagesAndTransactions,
    pageInfo: {
      page: currentPage,
      perPage: safePerPage,
      total,
      pageCount,
      hasPreviousPage: currentPage > 1,
      hasNextPage: currentPage < pageCount,
    },
  };
};

export const getOffer = async ({
  offerId,
  context,
}: {
  offerId: string;
  context: AppLoadContext;
}) => {
  const offer = await context.remixService.prisma.offer.findUnique({
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
    imageUrl = await context.remixService.aws.getFileUrl({
      fileKey: offer.imageFileKey,
    });
  }

  let userAvatarUrl = "";
  if (offer.user.avatarFileKey) {
    userAvatarUrl = await context.remixService.aws.getFileUrl({
      fileKey: offer.user.avatarFileKey,
    });
  }

  return {
    ...offer,
    imageUrl,
    user: {
      ...offer.user,
      avatarUrl: userAvatarUrl,
    },
  };
};

export const getExistingTransaction = async ({
  offerId,
  userId,
  context,
}: {
  offerId: string;
  userId: string;
  context: AppLoadContext;
}) => {
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
