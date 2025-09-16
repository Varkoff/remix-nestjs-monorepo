import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { formatPrice } from "~/lib/utils";

export const loader = async ({ params, context }: LoaderFunctionArgs) => {
    const prestataireId = params.prestataireId;
    if (!prestataireId) {
        throw new Response("Missing provider id", { status: 400 });
    }

    const user = await context.remixService.prisma.user.findUnique({
        where: { id: prestataireId },
        select: {
            id: true,
            name: true,
            avatarFileKey: true,
            chargesEnabled: true,
            payoutsEnabled: true,
            detailsSubmitted: true,
            _count: { select: { offers: true, transactions: true } },
        },
    });
    if (!user) throw new Response("Not found", { status: 404 });

    let avatarUrl = "";
    if (user.avatarFileKey) {
        avatarUrl = await context.remixService.aws.getFileUrl({ fileKey: user.avatarFileKey });
    }

    const offers = await context.remixService.prisma.offer.findMany({
        where: { userId: prestataireId, active: true },
        orderBy: { updatedAt: "desc" },
        select: {
            id: true,
            title: true,
            description: true,
            price: true,
            imageFileKey: true,
        },
    });

    const offersWithImages = await Promise.all(
        offers.map(async (o) => {
            let imageUrl = "";
            if (o.imageFileKey) {
                imageUrl = await context.remixService.aws.getFileUrl({ fileKey: o.imageFileKey });
            }
            const { imageFileKey, ...rest } = o;
            return { ...rest, imageUrl };
        }),
    );

    return json({
        user: {
            id: user.id,
            name: user.name,
            avatarUrl,
            verified: Boolean(user.chargesEnabled && user.payoutsEnabled && user.detailsSubmitted),
            counts: user._count,
        },
        offers: offersWithImages,
    });
};

export default function PrestataireDetailPage() {
    const { user, offers } = useLoaderData<typeof loader>();
    return (
        <div className="min-h-screen py-4">
            <div className="max-w-5xl mx-auto px-4">
                <div className="mb-4 flex items-center gap-3">
                    <img src={user.avatarUrl || "/_assets/avatar-placeholder.png"} alt="Avatar" className="w-12 h-12 rounded-full object-cover bg-gray-100" />
                    <div>
                        <h1 className="text-xl font-bold text-bleu">{user.name ?? "Utilisateur"}</h1>
                        <div className="text-xs text-gray-600 flex items-center gap-3">
                            <span className="text-gray-700">ID: {user.id}</span>
                            {user.verified ? (
                                <span className="text-xs bg-vert text-bleu px-2 py-0.5 rounded-full">prestataire certifié</span>
                            ) : null}
                            <span>{user.counts.offers} offre{user.counts.offers > 1 ? "s" : ""}</span>
                            <span>•</span>
                            <span>{user.counts.transactions} transaction{user.counts.transactions > 1 ? "s" : ""}</span>
                        </div>
                    </div>
                </div>

                {offers.length === 0 ? (
                    <div className="bg-white border border-gray-100 rounded-lg p-6 text-center text-gray-600">Aucune offre publiée.</div>
                ) : (
                    <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {offers.map((o) => (
                            <li key={o.id} className="bg-white border border-gray-100 rounded-lg overflow-hidden">
                                {o.imageUrl ? (
                                    <img src={o.imageUrl} alt="Image de l’offre" className="w-full h-36 object-cover" />
                                ) : (
                                    <div className="w-full h-36 bg-gray-100" />
                                )}
                                <div className="p-3">
                                    <h3 className="font-semibold text-gray-900 line-clamp-1">{o.title}</h3>
                                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">{o.description}</p>
                                    <div className="text-sm font-medium text-bleu mt-2">{formatPrice({ price: o.price })}</div>
                                    <div className="mt-2 text-right">
                                        <Link to={`/offers/${o.id}`} className="text-sm text-bleu hover:text-bleuClair">Voir l’offre</Link>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}

                <div className="mt-6 text-right">
                    <Link to="/prestataires" className="text-sm text-bleu hover:text-bleuClair">← Retour aux prestataires</Link>
                </div>
            </div>
        </div>
    );
}


