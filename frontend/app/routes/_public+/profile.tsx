import { getFormProps, getInputProps, useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod";
import {
    json,
    unstable_createMemoryUploadHandler,
    unstable_parseMultipartFormData,
    type ActionFunctionArgs,
    type LoaderFunctionArgs
} from "@remix-run/node";
import { Form, Link, useActionData, useFetcher, useLoaderData, useNavigation, useRevalidator } from "@remix-run/react";
import { User } from "lucide-react";
import { z } from "zod";
import { ErrorList, Field } from "~/components/forms";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { requireUser } from "~/server/auth.server";
import { editProfile, getUserWithAvatar } from "~/server/profile.server";
import { getConnectStatus } from "~/server/stripe.server";

export const loader = async ({ context }: LoaderFunctionArgs) => {
    const user = await requireUser({ context })
    const userWithAvatar = await getUserWithAvatar({ context, userId: user.id });
    const connectStatus = await getConnectStatus({ context, userId: user.id });
    return json({ user: userWithAvatar, connectStatus });
};

export const EditProfileSchema = z.object({
    email: z
        .string({
            required_error: "L'email est obligatoire.",
        })
        .email({
            message: 'Cet email est invalide.',
        }),
    name: z.string({ required_error: 'Le prénom est obligatoire.' }),
    avatar: z.instanceof(File).optional().superRefine((file, ctx) => {
        if (file && file.size > 10_000_000) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "L'avatar est trop lourd (10Mo max)",
            });
            return false;
        }
    }),
});

export const action = async ({ request, context }: ActionFunctionArgs) => {
    const user = await requireUser({ context })
    const imageHandler = unstable_createMemoryUploadHandler({
        maxPartSize: 10_000_000,
    });
    const formData = await unstable_parseMultipartFormData(request, imageHandler);

    const submission = await parseWithZod(formData, {
        async: true,
        schema: EditProfileSchema
            .superRefine(async (data, ctx) => {
                const { email } = data;

                if (email !== user.email) {
                    const existingUser = await context.remixService.auth.checkIfUserExists({
                        email,
                        withPassword: false,
                        password: "",
                    });

                    if (existingUser.error === false) {
                        ctx.addIssue({
                            code: 'custom',
                            path: ['email'],
                            message: existingUser.message,
                        });
                        return false;
                    }
                }
            }),
    });

    if (submission.status !== 'success') {
        return json(
            { result: submission.reply() },
            {
                status: 400,
            }
        );
    }

    await editProfile({
        context,
        profileData: submission.value,
        userId: user.id
    })

    return json(
        { result: submission.reply() },
    );
};

export default function UserProfile() {
    const { user, connectStatus } = useLoaderData<typeof loader>()
    const actionData = useActionData<typeof action>();
    const isLoading = useNavigation().state === "submitting";
    const fetcher = useFetcher();
    const revalidator = useRevalidator();
    const isRefreshing = fetcher.state !== "idle";
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
    const dueCount = currentlyDue.length + pastDue.length;
    const [form, fields] = useForm({
        constraint: getZodConstraint(EditProfileSchema),
        onValidate({ formData }) {
            return parseWithZod(formData, {
                schema: EditProfileSchema,
            });
        },
        lastResult: actionData?.result,
        defaultValue: {
            email: user.email,
            name: user.name
        }
    });

    return (
        <div className="min-h-screen py-4">
            <div className="max-w-md mx-auto px-4">
                {/* Header */}
                <div className="flex items-center gap-2 mb-4">
                    <User className="size-5 text-bleu" />
                    <h1 className="text-xl font-bold text-bleu">Mon profil</h1>
                </div>

                {/* Stripe Connect status */}
                <div className="bg-white rounded-lg shadow p-4 border border-gray-100 mb-4">
                    <div className="flex items-center justify-between mb-2">
                        <h2 className="text-sm font-semibold text-gray-800">Prestataire</h2>
                        <div className="text-xs text-gray-500">Stripe Connect</div>
                    </div>
                    {connectStatus?.stripeAccountId ? (
                        <div className="space-y-2 text-sm">
                            <div className="flex items-center justify-between">
                                <span className="text-gray-600">Dossier complété</span>
                                <span className={connectStatus.detailsSubmitted ? "text-green-600" : "text-red-600"}>
                                    {connectStatus.detailsSubmitted ? "Oui" : "Non"}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-gray-600">Paiements activés</span>
                                <span className={connectStatus.chargesEnabled ? "text-green-600" : "text-red-600"}>
                                    {connectStatus.chargesEnabled ? "Oui" : "Non"}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-gray-600">Virements activés</span>
                                <span className={connectStatus.payoutsEnabled ? "text-green-600" : "text-red-600"}>
                                    {connectStatus.payoutsEnabled ? "Oui" : "Non"}
                                </span>
                            </div>
                            {dueCount > 0 ? (
                                <div className="mt-2 rounded border border-yellow-100 bg-yellow-50 p-2 text-yellow-900">
                                    <p className="text-xs font-medium mb-1">Éléments requis par Stripe ({dueCount})</p>
                                    <ul className="list-disc list-inside space-y-0.5">
                                        {[...pastDue, ...currentlyDue].slice(0, 6).map((k) => (
                                            <li key={k}>{requirementLabel(k)}</li>
                                        ))}
                                        {[...pastDue, ...currentlyDue].length > 6 ? (
                                            <li>…</li>
                                        ) : null}
                                    </ul>
                                </div>
                            ) : null}
                            {connectStatus?.requirements?.disabledReason ? (
                                <p className="text-xs text-yellow-900/90">Raison: {connectStatus.requirements.disabledReason}</p>
                            ) : null}
                            <div className="flex gap-2 pt-2">
                                {!connectStatus.detailsSubmitted || !connectStatus.chargesEnabled || !connectStatus.payoutsEnabled ? (
                                    <Button asChild size="sm" variant="default" disabled={isLoading}>
                                        <Link to="/stripe/onboarding">
                                            {isLoading ? "Chargement..." : "Compléter mes informations"}
                                        </Link>
                                    </Button>
                                ) : null}
                                <Button asChild size="sm" variant="outline" disabled={isLoading}>
                                    <Link to="/stripe/dashboard">{isLoading ? "Chargement..." : "Ouvrir mon dashboard"}</Link>
                                </Button>
                                <Button
                                    size="sm"
                                    variant="secondary"
                                    disabled={isLoading || isRefreshing}
                                    onClick={() => {
                                        fetcher.load("/stripe/refresh");
                                    }}
                                >
                                    {isRefreshing ? "Rafraîchissement..." : "Rafraîchir"}
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-gray-600">Vous n’êtes pas encore prestataire.</p>
                            <Button asChild size="sm" disabled={isLoading}>
                                <Link to="/stripe/onboarding">{isLoading ? "Chargement..." : "Devenir prestataire"}</Link>
                            </Button>
                        </div>
                    )}
                </div>

                {/* Profile Form */}
                <div className="bg-gray-50 rounded-lg shadow p-6 border border-gray-100">
                    <Form
                        {...getFormProps(form)}
                        method='POST'
                        reloadDocument
                        className='flex flex-col gap-4'
                        encType="multipart/form-data"
                    >
                        <Field
                            inputProps={getInputProps(fields.name, {
                                type: 'text',
                            })}
                            labelProps={{
                                children: 'Prénom',
                            }}
                            errors={fields.name.errors}
                        />
                        <Field
                            inputProps={getInputProps(fields.email, {
                                type: 'email',
                            })}
                            labelProps={{
                                children: 'Adresse e-mail',
                            }}
                            errors={fields.email.errors}
                        />

                        {/* Avatar Display */}
                        {user.avatarUrl ? (
                            <div className="flex flex-col gap-2">
                                <Label>Avatar actuel</Label>
                                <img
                                    src={user.avatarUrl}
                                    alt="Avatar"
                                    className="w-20 h-20 rounded-full object-cover"
                                />
                            </div>
                        ) : null}

                        {/* Avatar Upload */}
                        <div className="grid gap-1">
                            <Label htmlFor="avatar">
                                {user.avatarUrl ? "Changer d'avatar" : "Ajouter un avatar"}
                            </Label>
                            <Input
                                id="avatar"
                                name="avatar"
                                placeholder="Votre avatar"
                                type="file"
                                accept="image/*"
                                disabled={isLoading}
                            />
                            <ErrorList errors={fields.avatar.errors} />
                        </div>

                        <Button className='ml-auto' size="sm" type='submit' disabled={isLoading}>
                            {isLoading ? "Modification..." : "Modifier"}
                        </Button>
                    </Form>
                </div>
            </div>
        </div>
    );
}
