import { Link, Outlet, useFetcher, useLocation, useNavigation } from '@remix-run/react';
import { Loader2 } from 'lucide-react';
import { Button } from "~/components/ui/button";
import { useConnectStatus, useOptionalUser } from "~/root";

export default function Layout() {
    const user = useOptionalUser();
    const connectStatus = useConnectStatus();
    const location = useLocation();
    const navigation = useNavigation();
    const isRouteLoading = navigation.state === 'loading';
    const fetcher = useFetcher();
    const isRefreshing = fetcher.state !== 'idle';

    const requirementLabel = (key: string) => {
        if (key.includes('individual.verification.document')) return "Document d'identité";
        if (key.includes('individual.verification.additional_document')) return "Document d'identité supplémentaire";
        if (key.includes('company.verification.document')) return "Document de l'entreprise";
        if (key.includes('external_account')) return "Compte bancaire";
        if (key.includes('business_profile')) return "Profil d'activité";
        if (key.includes('tos_acceptance')) return "Acceptation des CGU";
        if (key.includes('representative')) return "Informations du représentant";
        if (key.includes('owners')) return "Informations sur les propriétaires";
        if (key.includes('directors')) return "Informations sur les directeurs";
        if (key.includes('person.verification')) return "Vérification d'identité";
        return key;
    };

    const currentlyDue = connectStatus?.requirements?.currentlyDue ?? [];
    const pastDue = connectStatus?.requirements?.pastDue ?? [];
    const dueCount = (currentlyDue?.length ?? 0) + (pastDue?.length ?? 0);

    const needsStripeAttention = Boolean(
        user &&
        connectStatus?.stripeAccountId &&
        (
            !connectStatus.detailsSubmitted ||
            !connectStatus.chargesEnabled ||
            !connectStatus.payoutsEnabled ||
            dueCount > 0 ||
            Boolean(connectStatus.requirements?.disabledReason)
        )
    );

    return (
        <main className='p-4'>
            {needsStripeAttention ? (
                <div className="mb-4 rounded-md border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-900">
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                            <p className="font-medium mb-1">Votre compte prestataire nécessite une action sur Stripe.</p>
                            {dueCount > 0 ? (
                                <div className="text-yellow-900/90">
                                    <p className="mb-1">Éléments requis: {dueCount}</p>
                                    <ul className="list-disc list-inside space-y-0.5">
                                        {[...pastDue, ...currentlyDue].slice(0, 4).map((k) => (
                                            <li key={k}>{requirementLabel(k)}</li>
                                        ))}
                                        {[...pastDue, ...currentlyDue].length > 4 ? (
                                            <li>…</li>
                                        ) : null}
                                    </ul>
                                </div>
                            ) : null}
                            {connectStatus?.requirements?.disabledReason ? (
                                <p className="mt-1 text-xs text-yellow-900/80">Raison: {connectStatus.requirements.disabledReason}</p>
                            ) : null}
                        </div>
                        <div className="flex items-center gap-2">
                            <Button asChild size="sm" variant="default" disabled={isRouteLoading || isRefreshing}>
                                <Link to="/stripe/onboarding">
                                    <span className="inline-flex items-center gap-2">
                                        {isRouteLoading || isRefreshing ? <Loader2 className="size-4 animate-spin" /> : null}
                                        Compléter
                                    </span>
                                </Link>
                            </Button>
                            <fetcher.Form method="get" action="/stripe/refresh">
                                <Button size="sm" variant="secondary" disabled={isRouteLoading || isRefreshing}>
                                    <span className="inline-flex items-center gap-2">
                                        {isRouteLoading || isRefreshing ? <Loader2 className="size-4 animate-spin" /> : null}
                                        Rafraîchir
                                    </span>
                                </Button>
                            </fetcher.Form>
                        </div>
                    </div>
                </div>
            ) : null}
            <Outlet />
        </main>
    );
}
