import { json, type LoaderFunctionArgs, type SerializeFrom } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { buttonVariants } from "~/components/ui/button";
import { formatDate, formatPrice } from "~/lib/utils";
import { requireUser } from "~/server/auth.server";
import { getUserOffers } from "~/server/profile.server";


export const loader = async ({ context }: LoaderFunctionArgs) => {
    const user = await requireUser({ context });
    const offers = await getUserOffers({
        context,
        userId: user.id
    })
    return json({ offers });
};


export default function MyServices() {
    const { offers } = useLoaderData<typeof loader>();
    return (
        <div className="flex flex-col gap-3">
            <h2 className="text-3xl font-bold">Mes services</h2>
            <Link to="/my-services/new" className={buttonVariants({
                variant: 'primary',
                className: 'w-fit'
            })}>Ajouter une annonce</Link>
            <div className="flex flex-row flex-wrap gap-8">
                {offers.map((offer) => (
                    <ServiceCard offer={offer} key={offer.id} />
                ))}
            </div>
        </div>
    );
}


const ServiceCard = ({ offer }: { offer: SerializeFrom<Awaited<ReturnType<typeof getUserOffers>>>[0] }) => {
    const { updatedAt, description, price, title, active } = offer;
    return (
        <Link to={`/my-services/${offer.id}`} className="max-w-[300px] w-full flex flex-col gap-1 border-4 border-black overflow-hidden hover:border-vert">
            <img src="https://via.placeholder.com/150" alt="service" />
            <div className="flex flex-col gap-2 px-2 pt-1 pb-2">
                {active ? <span className="text-xs text-emerald-500">Cette offre est active.</span> : <span className="text-xs text-gray-500">Cette offre est inactive.</span>}
                <div className="flex justify-between gap-2">
                    <h2 className="font-bold">{title}</h2>
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