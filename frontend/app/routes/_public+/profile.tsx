import { getFormProps, getInputProps, useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod";
import {
    json,
    unstable_createMemoryUploadHandler,
    unstable_parseMultipartFormData,
    type ActionFunctionArgs,
    type LoaderFunctionArgs
} from "@remix-run/node";
import { Form, useActionData, useLoaderData, useNavigation } from "@remix-run/react";
import { User } from "lucide-react";
import { z } from "zod";
import { ErrorList, Field } from "~/components/forms";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { requireUser } from "~/server/auth.server";
import { editProfile, getUserWithAvatar } from "~/server/profile.server";

export const loader = async ({ context }: LoaderFunctionArgs) => {
    const user = await requireUser({ context })
    const userWithAvatar = await getUserWithAvatar({ context, userId: user.id });
    return json({ user: userWithAvatar });
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
    const { user } = useLoaderData<typeof loader>()
    const actionData = useActionData<typeof action>();
    const isLoading = useNavigation().state === "submitting";
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
