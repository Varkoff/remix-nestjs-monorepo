import { json, type LoaderFunctionArgs, type SerializeFrom } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { formatDate, formatPrice } from "~/lib/utils";
import { useOptionalUser } from "~/root";
import { getOptionalUser } from "~/server/auth.server";
import { getOffers } from "~/server/offers.server";

export const loader = async ({ context }: LoaderFunctionArgs) => {
  const user = await getOptionalUser({ context });
  const offers = await getOffers({ 
    context, 
    userId: user?.id 
  });
  return json({ offers });
};

export default function Index() {
  const { offers } = useLoaderData<typeof loader>();
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

        {/* Services Grid */}
        {offers.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <h2 className="text-xl font-bold text-bleu mb-2">Aucun service disponible</h2>
            <p className="text-gray-600">
              Revenez plus tard pour découvrir de nouveaux services
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {offers.map((offer) => (
              <ServiceCard offer={offer} key={offer.id} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const ServiceCard = ({ offer }: { offer: SerializeFrom<Awaited<ReturnType<typeof getOffers>>>[0] }) => {
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
          src={imageUrl ? imageUrl : "https://via.placeholder.com/250x150"} 
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
