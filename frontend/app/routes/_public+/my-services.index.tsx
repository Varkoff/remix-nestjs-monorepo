import { json, type LoaderFunctionArgs, type SerializeFrom } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { Eye, EyeOff, Plus, Settings } from "lucide-react";
import { formatDate, formatPrice } from "~/lib/utils";
import { requireUser } from "~/server/auth.server";
import { getUserOffers, getUserWithAvatar } from "~/server/profile.server";

export const loader = async ({ context }: LoaderFunctionArgs) => {
    const user = await requireUser({ context });
    const [offers, userWithAvatar] = await Promise.all([
        getUserOffers({
            context,
            userId: user.id
        }),
        getUserWithAvatar({
            context,
            userId: user.id
        })
    ]);
    return json({ offers, user: userWithAvatar });
};

export default function MyServices() {
    const { offers, user } = useLoaderData<typeof loader>();

    const activeOffers = offers.filter(offer => offer.active);
    const inactiveOffers = offers.filter(offer => !offer.active);

    return (
        <div className="bg-gradient-to-br from-extraLightTurquoise to-white min-h-screen">
            <div className="max-w-7xl mx-auto px-4 py-4">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <Settings className="size-5 text-bleu" />
                        <h1 className="text-xl font-bold text-bleu">Mes services</h1>
                    </div>
                    <Link
                        to="/my-services/new"
                        className="bg-bleu text-white px-3 py-1.5 rounded text-sm font-medium hover:bg-bleu/90 flex items-center gap-1"
                    >
                        <Plus className="size-4" />
                        Ajouter
                    </Link>
                </div>

                {offers.length === 0 ? (
                    <div className="bg-white rounded-lg shadow p-6 text-center">
                        <Settings className="size-12 text-gray-400 mx-auto mb-3" />
                        <h2 className="text-lg font-bold text-gray-900 mb-2">Aucun service</h2>
                        <p className="text-sm text-gray-600 mb-4">Créez votre première offre de service</p>
                        <Link
                            to="/my-services/new"
                            className="bg-bleu text-white px-4 py-2 rounded text-sm font-medium hover:bg-bleu/90 inline-flex items-center gap-1"
                        >
                            <Plus className="size-4" />
                            Créer une offre
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {/* Active Services */}
                        {activeOffers.length > 0 && (
                            <div className="bg-white rounded-lg shadow overflow-hidden">
                                <div className="bg-gradient-to-r from-bleuClair to-lightTurquoise p-3">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h2 className="font-bold text-bleu">Services actifs ({activeOffers.length})</h2>
                                            <p className="text-xs text-bleu/80">Visibles par les autres utilisateurs</p>
                                        </div>
                                        <Eye className="size-4 text-bleu" />
                                    </div>
                                </div>

                                <div className="p-3">
                                    <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3">
                                        {activeOffers.map((offer) => (
                                            <ServiceCard key={offer.id} offer={offer} user={user} />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Inactive Services */}
                        {inactiveOffers.length > 0 && (
                            <div className="bg-white rounded-lg shadow overflow-hidden">
                                <div className="bg-gradient-to-r from-gray-100 to-gray-200 p-3">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h2 className="font-bold text-gray-700">Services inactifs ({inactiveOffers.length})</h2>
                                            <p className="text-xs text-gray-600">Non visibles par les autres utilisateurs</p>
                                        </div>
                                        <EyeOff className="size-4 text-gray-600" />
                                    </div>
                                </div>

                                <div className="p-3">
                                    <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3">
                                        {inactiveOffers.map((offer) => (
                                            <ServiceCard key={offer.id} offer={offer} user={user} />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

const ServiceCard = ({
    offer,
    user
}: {
    offer: SerializeFrom<Awaited<ReturnType<typeof getUserOffers>>>[0];
    user: SerializeFrom<Awaited<ReturnType<typeof getUserWithAvatar>>>;
}) => {
    const { updatedAt, description, price, title, active, imageUrl } = offer;

    return (
        <Link
            to={`/my-services/${offer.id}`}
            className="group flex items-center gap-3 p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200 w-full sm:basis-[320px] sm:grow sm:shrink-0"
        >
            {/* Service Image and User Avatar */}
            <div className="relative flex-shrink-0">
                {/* Service Image */}
                <div className="w-12 h-12 bg-gradient-to-br from-bleuClair to-lightTurquoise rounded-md overflow-hidden">
                    {imageUrl ? (
                        <img
                            src={imageUrl}
                            alt={title}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-200">
                            <Settings className="size-4 text-gray-400" />
                        </div>
                    )}
                </div>
                {/* User Avatar - positioned in bottom right corner */}
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-white rounded-full p-0.5 shadow-sm">
                    <div className="w-full h-full bg-gradient-to-br from-bleuClair to-lightTurquoise rounded-full overflow-hidden">
                        {user.avatarUrl ? (
                            <img
                                src={user.avatarUrl}
                                alt={`Avatar de ${user.name}`}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-bleuClair">
                                <span className="text-bleu font-semibold text-[8px]">
                                    {user.name
                                        ?.split(' ')
                                        .map(word => word.charAt(0))
                                        .join('')
                                        .toUpperCase()
                                        .slice(0, 2) || "?"}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <h3 className="font-medium text-sm text-gray-900 truncate group-hover:text-bleu transition-colors">
                    {title}
                </h3>
                <div className="flex items-center justify-between mt-1">
                    <span className="text-xs font-medium text-persianIndigo">
                        {formatPrice({ price })}
                    </span>
                    <div className="flex items-center gap-2">
                        {offer.isStripeSynced ? (
                            <span className="text-[10px] text-emerald-600">Stripe OK</span>
                        ) : (
                            <span className="text-[10px] text-red-600">Stripe à synchroniser</span>
                        )}
                        <div className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-emerald-500' : 'bg-gray-400'}`}></div>
                        <span className={`text-xs ${active ? 'text-emerald-600' : 'text-gray-500'}`}>
                            {active ? 'Actif' : 'Inactif'}
                        </span>
                    </div>
                </div>
                <div className="flex items-center justify-between mt-1">
                    <p className="text-xs text-gray-600 truncate flex-1 mr-2">
                        {description}
                    </p>
                    <span className="text-xs text-gray-500 whitespace-nowrap">
                        {formatDate({ date: updatedAt })}
                    </span>
                </div>
            </div>
        </Link>
    );
};