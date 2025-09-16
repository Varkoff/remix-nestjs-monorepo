import { type AppLoadContext } from "@remix-run/node";
import { getPagination } from "~/lib/utils";

export type CertifiedProvider = {
  id: string;
  name: string | null;
  avatarUrl: string;
  counts: {
    offers: number;
    transactions: number;
  };
};

export const getCertifiedProviders = async ({
  context,
  page,
  perPage,
}: {
  context: AppLoadContext;
  page?: number | string | null;
  perPage?: number | string | null;
}) => {
  const { skip, take, page: currentPage, perPage: safePerPage } = getPagination({
    page,
    perPage,
    maxPerPage: 50,
  });

  const where = {
    chargesEnabled: true as const,
    payoutsEnabled: true as const,
    detailsSubmitted: true as const,
  };

  const [users, total] = await Promise.all([
    context.remixService.prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take,
      select: {
        id: true,
        name: true,
        avatarFileKey: true,
        _count: {
          select: {
            offers: true,
            transactions: true,
          },
        },
      },
    }),
    context.remixService.prisma.user.count({ where }),
  ]);

  const items: CertifiedProvider[] = await Promise.all(
    users.map(async (u) => {
      let avatarUrl = "";
      if (u.avatarFileKey) {
        avatarUrl = await context.remixService.aws.getFileUrl({ fileKey: u.avatarFileKey });
      }
      return {
        id: u.id,
        name: u.name ?? null,
        avatarUrl,
        counts: {
          offers: u._count.offers,
          transactions: u._count.transactions,
        },
      };
    }),
  );

  const pageCount = Math.max(Math.ceil(total / safePerPage), 1);

  return {
    items,
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


