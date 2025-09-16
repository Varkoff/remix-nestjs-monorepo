import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { Link, useLoaderData, useSearchParams } from "@remix-run/react";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "~/components/ui/pagination";
import { getCertifiedProviders } from "~/server/providers.server";

export const loader = async ({ request, context }: LoaderFunctionArgs) => {
    const url = new URL(request.url);
    const page = url.searchParams.get("page");
    const perPage = url.searchParams.get("perPage");
    const data = await getCertifiedProviders({ context, page, perPage });
    return json(data);
};

export default function PrestatairesPage() {
    const { items, pageInfo } = useLoaderData<typeof loader>();
    const [params] = useSearchParams();
    const pageParam = params.get("page") ?? "1";
    const page = Math.max(Number(pageParam) || 1, 1);

    return (
        <div className="min-h-screen py-4">
            <div className="max-w-5xl mx-auto px-4">
                <div className="mb-4">
                    <h1 className="text-xl font-bold text-bleu">Prestataires</h1>
                    <p className="text-sm text-gray-600">Professionnels avec compte Connect vérifié</p>
                </div>

                {items.length === 0 ? (
                    <div className="bg-white border border-gray-100 rounded-lg p-6 text-center text-gray-600">Aucun prestataire pour le moment.</div>
                ) : (
                    <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {items.map((u) => (
                            <li key={u.id} className="bg-white border border-gray-100 rounded-lg p-4 shadow-sm">
                                <Link to={`/prestataires/${u.id}`} className="flex items-center gap-3 group">
                                    <img src={u.avatarUrl || "/_assets/avatar-placeholder.png"} alt="Avatar" className="w-12 h-12 rounded-full object-cover bg-gray-100" />
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="font-medium text-gray-900 truncate group-hover:text-bleu">{u.name ?? "Utilisateur"}</span>
                                            <span className="text-xs bg-vert text-bleu px-2 py-0.5 rounded-full">prestataire certifié</span>
                                        </div>
                                        <div className="text-xs text-gray-600 mt-1 flex items-center gap-3">
                                            <span>{u.counts.offers} offre{u.counts.offers > 1 ? "s" : ""}</span>
                                            <span>•</span>
                                            <span>{u.counts.transactions} transaction{u.counts.transactions > 1 ? "s" : ""}</span>
                                        </div>
                                    </div>
                                </Link>
                            </li>
                        ))}
                    </ul>
                )}

                <div className="mt-6">
                    <Pagination>
                        <PaginationContent>
                            <PaginationItem>
                                <PaginationPrevious
                                    href={`?page=${Math.max(page - 1, 1)}`}
                                    aria-disabled={!pageInfo.hasPreviousPage}
                                    className={!pageInfo.hasPreviousPage ? "pointer-events-none opacity-50" : ""}
                                />
                            </PaginationItem>
                            <PaginationItem>
                                <PaginationLink isActive>{pageInfo.page}</PaginationLink>
                            </PaginationItem>
                            <PaginationItem>
                                <PaginationNext
                                    href={`?page=${page + 1}`}
                                    aria-disabled={!pageInfo.hasNextPage}
                                    className={!pageInfo.hasNextPage ? "pointer-events-none opacity-50" : ""}
                                />
                            </PaginationItem>
                        </PaginationContent>
                    </Pagination>
                </div>

                <div className="mt-4 text-right">
                    <Link to="/" className="text-sm text-bleu hover:text-bleuClair">Retour à l’accueil</Link>
                </div>
            </div>
        </div>
    );
}


