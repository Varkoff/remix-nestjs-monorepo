import { json, type LoaderFunctionArgs, type SerializeFrom } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { formatDate, formatPrice } from "~/lib/utils";
import { requireUser } from "~/server/auth.server";
import { getTransactions } from "~/server/transactions.server";

export const loader = async ({ context }: LoaderFunctionArgs) => {
    const user = await requireUser({ context });
    const { myOfferedTransactions, myRequestedTransactions } =
        await getTransactions({ context, userId: user.id });
    return json({ myOfferedTransactions, myRequestedTransactions });
};

export default function MyTransactions() {
    const { myOfferedTransactions, myRequestedTransactions } = useLoaderData<typeof loader>();
    return (
        <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-3">
                <h2 className="text-xl font-bold">Mes demandes</h2>

                <div className="flex flex-row flex-wrap gap-8">
                    {myRequestedTransactions.map((transaction) => (
                        <TransactionCard transaction={transaction} key={transaction.id} />
                    ))}
                </div>
            </div>
            <div className="flex flex-col gap-3">
                <h2 className="text-xl font-bold">Mes offres</h2>

                <div className="flex flex-row flex-wrap gap-8">
                    {myOfferedTransactions.map((transaction) => (
                        <TransactionCard transaction={transaction} key={transaction.id} />
                    ))}
                </div>
            </div>
        </div>
    );
}

const TransactionCard = ({
    transaction,
}: { transaction: SerializeFrom<Awaited<ReturnType<typeof getTransactions>>>["myRequestedTransactions"][0] }) => {

    return (
        <Link
            to={`/transactions/${transaction.id}`}
            className="max-w-[300px] w-full flex bg-slate-50 items-center gap-1 rounded-sm overflow-hidden"
        >
            <img className="max-w-[40px]" src="https://via.placeholder.com/150" alt="service" />
            <div className="flex flex-col gap-2 px-2 pt-1 pb-2">
                <div className="text-xs flex justify-between gap-2">
                    <span className="font-bold ">{transaction.offer.title}</span>
                    <p className="text-persianIndigo">
                        {formatPrice({ price: transaction.offer.price })}
                    </p>
                </div>


                <p className="text-[10px] italic">
                    Mise à jour le {formatDate({ date: transaction.updatedAt })}
                </p>
            </div>
        </Link>
    );
};
