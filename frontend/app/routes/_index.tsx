import { json, type LoaderFunctionArgs, type SerializeFrom } from "@remix-run/node";
import { Link, useLoaderData, useNavigation } from "@remix-run/react";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { createSerializer, parseAsInteger, parseAsString, useQueryStates } from "nuqs";
import { createLoader } from "nuqs/server";
import { useCallback, useMemo } from "react";
import { Input } from "~/components/ui/input";
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink } from "~/components/ui/pagination";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { formatDate, formatPrice } from "~/lib/utils";
import { useOptionalUser } from "~/root";
import { getOptionalUser } from "~/server/auth.server";
import { getOffers } from "~/server/offers.server";

const filtersParams = {
  q: parseAsString.withDefault("").withOptions({
    limitUrlUpdates: {
      method: 'throttle',
      timeMs: 400
    }
  }),
  page: parseAsInteger.withDefault(1),
  perPage: parseAsInteger.withDefault(10),
} as const


export const filtersLoader = createLoader(filtersParams)


export const loader = async ({ context, request }: LoaderFunctionArgs) => {
  const user = await getOptionalUser({ context });
  const filters = await filtersLoader(request)

  const offers = await getOffers({
    context,
    userId: user?.id,
    filters
  });
  return json({ offers, });
};


export default function Index() {
  const { offers } = useLoaderData<typeof loader>();
  const { page, pageCount, hasPreviousPage, hasNextPage, perPage, total } = offers.pageInfo;

  const navigation = useNavigation()
  const isLoading = navigation.state === 'loading'

  const [filters, setFilters] = useQueryStates(filtersParams, {
    shallow: false
  })

  const perPageOptions = useMemo(() => [10, 20, 30, 50], []);
  const handlePerPageChange = useCallback(
    (value: string) => {
      setFilters({ page: 1, perPage: Number(value) })
    },
    [filters]
  );


  const makeHref = (p: number) => {
    const serializer = createSerializer(filtersParams)
    return serializer("/", { ...filters, page: p })
  }


  const pagesToShow = (() => {
    const pages: Array<number | "ellipsis"> = [];
    const add = (p: number) => {
      if (p >= 1 && p <= pageCount && !pages.includes(p)) pages.push(p);
    };
    add(1);
    add(pageCount);
    for (let p = page - 2; p <= page + 2; p++) add(p);
    const sorted = pages
      .filter((v): v is number => typeof v === "number")
      .sort((a, b) => a - b);
    const withEllipsis: Array<number | "ellipsis"> = [];
    for (let i = 0; i < sorted.length; i++) {
      const current = sorted[i];
      const prev = sorted[i - 1];
      if (i > 0 && prev !== undefined && current - prev > 1) {
        withEllipsis.push("ellipsis");
      }
      withEllipsis.push(current);
    }
    return withEllipsis;
  })();
  return (
    <div className="min-h-screen bg-gradient-to-br from-extraLightTurquoise to-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-bleu mb-2">Découvrez nos services</h1>
          <p className="text-bleu/80 text-lg">
            Explorez les dernières annonces et trouvez le service qui vous convient
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-6 flex items-center gap-3">
          <Input
            type="search"
            name="q"
            defaultValue={filters.q}
            placeholder="Rechercher un service..."
            className="max-w-md"
            onChange={(e) => setFilters({ q: e.target.value })}
          />
          <span className="text-sm text-bleu/80">Total&nbsp;: {total}</span>
          {isLoading ? (
            <Loader2 aria-label="Chargement" className="h-4 w-4 animate-spin text-bleu" />
          ) : null}
        </div>

        {/* Services Grid */}
        {offers.items.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <h2 className="text-xl font-bold text-bleu mb-2">Aucun service disponible</h2>
            <p className="text-gray-600">
              Revenez plus tard pour découvrir de nouveaux services
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {offers.items.map((offer) => (
              <ServiceCard offer={offer} key={offer.id} />
            ))}
          </div>
        )}

        {/* Pagination */}
        <div className="mt-8 flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between text-sm text-bleu/80">
            <div className="flex items-center gap-2">
              <span>Résultats par page</span>
              <Select value={String(perPage)} onValueChange={handlePerPageChange}>
                <SelectTrigger className="w-[112px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {perPageOptions.map((opt) => (
                    <SelectItem key={opt} value={String(opt)}>
                      {opt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>Page {page} / {pageCount}</div>
            <div>Total&nbsp;: {total}</div>
          </div>
          <div className="flex items-center justify-center gap-2">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationLink
                    aria-label="Page précédente"
                    href={hasPreviousPage ? makeHref(page - 1) : undefined}
                    className={!hasPreviousPage ? "pointer-events-none opacity-50" : undefined}
                    size="default"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span>Précédent</span>
                  </PaginationLink>
                </PaginationItem>
                {pagesToShow.map((p, idx) => (
                  <PaginationItem key={`${p}-${idx}`}>
                    {p === "ellipsis" ? (
                      <PaginationEllipsis />
                    ) : (
                      <PaginationLink href={makeHref(p)} isActive={p === page}>
                        {p}
                      </PaginationLink>
                    )}
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationLink
                    aria-label="Page suivante"
                    href={hasNextPage ? makeHref(page + 1) : undefined}
                    className={!hasNextPage ? "pointer-events-none opacity-50" : undefined}
                    size="default"
                  >
                    <span>Suivant</span>
                    <ChevronRight className="h-4 w-4" />
                  </PaginationLink>
                </PaginationItem>
              </PaginationContent>
            </Pagination>
            {isLoading ? (
              <Loader2 aria-label="Chargement des pages" className="h-4 w-4 animate-spin text-bleu" />
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

const ServiceCard = ({ offer }: { offer: SerializeFrom<typeof loader>["offers"]["items"][number] }) => {
  const { updatedAt, description, imageUrl, price, title, userId, hasActiveTransaction } = offer;
  const user = useOptionalUser()
  const isOwner = user?.id === userId;

  return (
    <Link
      to={`/offers/${offer.id}`}
      className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl"
    >
      {/* Image Section */}
      <div className="relative">
        <img
          src={imageUrl ? imageUrl : "https://placehold.co/400x128?text=Pas%20d%27image"}
          alt={title}
          className="w-full h-32 object-cover"
        />
        {isOwner && (
          <div className="absolute top-2 right-2 bg-vert text-white px-2 py-1 rounded-md text-xs font-medium">
            Votre offre
          </div>
        )}
        {!isOwner && hasActiveTransaction && (
          <div className="absolute top-2 right-2 bg-bleu text-white px-2 py-1 rounded-md text-xs font-medium">
            Conversation active
          </div>
        )}
        {/* Price Badge */}
        <div className="absolute bottom-2 left-2">
          <div className="bg-persianIndigo/90 backdrop-blur-sm text-white px-2 py-1 rounded-md">
            <span className="font-semibold text-xs">
              {formatPrice({ price: price })}
            </span>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-4">
        <h3 className="font-bold text-base text-bleu mb-2 line-clamp-2">
          {title}
        </h3>

        <p className="text-gray-600 text-xs leading-relaxed mb-3 line-clamp-2">
          {description}
        </p>

        {/* Footer */}
        <div className="pt-2 border-t border-gray-100">
          <span className="text-xs text-gray-500">
            {formatDate({ date: updatedAt })}
          </span>
        </div>
      </div>
    </Link>
  );
};

// Prix
// Libéllé
// Lieu
// Heure de publication
