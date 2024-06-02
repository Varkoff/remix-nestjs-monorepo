import { json, type LoaderFunctionArgs, type SerializeFrom } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { User } from "lucide-react";
import { formatDate, formatPrice } from "~/lib/utils";
import { useOptionalUser } from "~/root";
import { getOffers } from "~/server/offers.server";

export const loader = async ({ context }: LoaderFunctionArgs) => {
  const offers = await getOffers({ context });
  return json({ offers });
};

export default function Index() {
  const { offers } = useLoaderData<typeof loader>();
  return (
    <div className="flex flex-col gap-3 py-8">
      <article className="px-6 space-y-4">
        <h2 className="text-3xl font-bold">Nouvelles annonces</h2>
        <div className="flex flex-row flex-wrap gap-8">
          {offers.map((offer) => (
            <ServiceCard offer={offer} key={offer.id} />
          ))}
        </div>
      </article>
    </div>
  );
}

const ServiceCard = ({ offer }: { offer: SerializeFrom<Awaited<ReturnType<typeof getOffers>>>[0] }) => {
  const { updatedAt, description, price, title, userId } = offer;
  const user = useOptionalUser()
  const isOwner = user?.id === userId;
  return (
    <Link to={`/offers/${offer.id}`} className="max-w-[300px] w-full flex flex-col gap-1 border-4 border-black overflow-hidden hover:border-vert">
      <img src="https://via.placeholder.com/150" alt="service" />
      <div className="flex flex-col gap-2 px-2 pt-1 pb-2">
        <div className="flex justify-between items-center gap-1">
          <h2 className="font-bold">{title}</h2>
          {isOwner ? <User className="size-4 text-emerald-600" /> : null}
          <p className="text-white rounded-full px-2 py-0.5 ml-auto bg-persianIndigo">
            {formatPrice({ price: price })}
          </p>
        </div>
        <p className="text-sm ">{description}</p>
        <div className="flex justify-between gap-2">
          {/* <p className="text-xs text-slate-600">{place}</p> */}
          <p className="text-xs italic">
            publié le{" "}
            {formatDate({ date: updatedAt })}
          </p>
        </div>
      </div>
    </Link>
  );
};

// Prix
// Libéllé
// Lieu
// Heure de publication
