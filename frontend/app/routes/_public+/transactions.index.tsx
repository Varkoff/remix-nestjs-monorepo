import { json, type LoaderFunctionArgs, type SerializeFrom } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { ArrowRight, Inbox, MessageCircle, User } from "lucide-react";
import { formatDate, formatPrice } from "~/lib/utils";
import { requireUser } from "~/server/auth.server";
import { getTransactions } from "~/server/transactions.server";

export const loader = async ({ context }: LoaderFunctionArgs) => {
    const user = await requireUser({ context });
    const { myOfferedTransactions, myRequestedTransactions } = await getTransactions({ 
        context, 
        userId: user.id 
    });
    
    return json({ 
        myOfferedTransactions, 
        myRequestedTransactions 
    });
};

export default function MyTransactions() {
    const { myOfferedTransactions, myRequestedTransactions } = useLoaderData<typeof loader>();
    
    const hasTransactions = myOfferedTransactions.length > 0 || myRequestedTransactions.length > 0;
    
    return (
        <div className="bg-gradient-to-br from-extraLightTurquoise to-white min-h-screen">
            <div className="max-w-7xl mx-auto px-4 py-4">
                {/* Compact Header */}
                <div className="flex items-center gap-2 mb-4">
                    <MessageCircle className="size-5 text-bleu" />
                    <h1 className="text-xl font-bold text-bleu">Mes transactions</h1>
                </div>

                {!hasTransactions ? (
                    <div className="bg-white rounded-lg shadow p-6 text-center">
                        <Inbox className="size-12 text-gray-400 mx-auto mb-3" />
                        <h2 className="text-lg font-bold text-gray-900 mb-2">Aucune transaction</h2>
                        <p className="text-sm text-gray-600 mb-4">Explorez les offres ou créez vos services</p>
                        <div className="flex gap-2 justify-center">
                            <Link to="/" className="bg-bleu text-white px-3 py-1.5 rounded text-sm font-medium hover:bg-bleu/90">
                                Voir les offres
                            </Link>
                            <Link to="/my-services" className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded text-sm font-medium hover:bg-gray-200">
                                Mes services
                            </Link>
                        </div>
                    </div>
                ) : (
                    <div className="grid lg:grid-cols-2 gap-4">
                        {/* My Requests */}
                        <div className="bg-white rounded-lg shadow overflow-hidden">
                            <div className="bg-gradient-to-r from-bleuClair to-lightTurquoise p-3">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h2 className="font-bold text-bleu">Mes demandes ({myRequestedTransactions.length})</h2>
                                        <p className="text-xs text-bleu/80">Services demandés</p>
                                    </div>
                                    <User className="size-4 text-bleu" />
                                </div>
                            </div>
                            
                            <div className="p-3 max-h-96 overflow-y-auto">
                                {myRequestedTransactions.length === 0 ? (
                                    <p className="text-sm text-gray-500 text-center py-4">Aucune demande</p>
                                ) : (
                                    <div className="space-y-2">
                                        {myRequestedTransactions.map((transaction) => (
                                            <TransactionCard 
                                                key={transaction.id} 
                                                transaction={transaction}
                                                type="request"
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* My Offers */}
                        <div className="bg-white rounded-lg shadow overflow-hidden">
                            <div className="bg-gradient-to-r from-lightTurquoise to-extraLightTurquoise p-3">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h2 className="font-bold text-bleu">Mes offres ({myOfferedTransactions.length})</h2>
                                        <p className="text-xs text-bleu/80">Demandes reçues</p>
                                    </div>

                                </div>
                            </div>
                            
                            <div className="p-3 max-h-96 overflow-y-auto">
                                {myOfferedTransactions.length === 0 ? (
                                    <p className="text-sm text-gray-500 text-center py-4">Aucune offre reçue</p>
                                ) : (
                                    <div className="space-y-2">
                                        {myOfferedTransactions.map((transaction) => (
                                            <TransactionCard 
                                                key={transaction.id} 
                                                transaction={transaction}
                                                type="offer"
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

const TransactionCard = ({
    transaction,
    type
}: { 
    transaction: SerializeFrom<Awaited<ReturnType<typeof getTransactions>>>["myRequestedTransactions"][0];
    type: "request" | "offer";
}) => {
    const isRequest = type === "request";
    const otherPartyName = isRequest ? transaction.offer.user.name : transaction.user.name;
    const otherPartyAvatar = isRequest ? transaction.offer.user.avatarUrl : transaction.user.avatarUrl;
    
    return (
        <Link
            to={`/transactions/${transaction.id}`}
            className="group flex items-center gap-3 p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200"
        >
            {/* Service Image and User Avatar */}
            <div className="relative flex-shrink-0">
                {/* Service Image */}
                <div className="w-12 h-12 bg-gradient-to-br from-bleuClair to-lightTurquoise rounded-md overflow-hidden">
                    {transaction.offer.imageUrl ? (
                        <img
                            src={transaction.offer.imageUrl}
                            alt={transaction.offer.title}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-200">
                            <span className="text-gray-400 text-xs">Service</span>
                        </div>
                    )}
                </div>
                {/* User Avatar - positioned in bottom right corner */}
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-white rounded-full p-0.5 shadow-sm">
                    <div className="w-full h-full bg-gradient-to-br from-bleuClair to-lightTurquoise rounded-full overflow-hidden">
                        {otherPartyAvatar ? (
                            <img
                                src={otherPartyAvatar}
                                alt={`Avatar de ${otherPartyName}`}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-bleuClair">
                                <span className="text-bleu font-semibold text-[8px]">
                                    {otherPartyName
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
                    {transaction.offer.title}
                </h3>
                <div className="flex items-center justify-between mt-1">
                    <span className="text-xs font-medium text-persianIndigo">
                        {formatPrice({ price: transaction.offer.price })}
                    </span>
                    <span className="text-xs text-gray-500">
                        {isRequest ? `Avec ${otherPartyName}` : `De ${otherPartyName}`}
                    </span>
                </div>
                <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-gray-500">
                        {formatDate({ date: transaction.updatedAt })}
                    </span>
                    <div className="flex items-center gap-1">
                        <div className={`w-1.5 h-1.5 rounded-full ${isRequest ? 'bg-bleu' : 'bg-vert'}`}></div>
                        <span className="text-xs text-gray-600">
                            {isRequest ? 'Envoyée' : 'Reçue'}
                        </span>
                    </div>
                </div>
            </div>
            
            <ArrowRight className="size-3 text-gray-400 group-hover:text-bleu transition-colors flex-shrink-0" />
        </Link>
    );
};
