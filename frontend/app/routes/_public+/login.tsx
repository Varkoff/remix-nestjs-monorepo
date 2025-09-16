import { getFormProps, getInputProps, useForm } from '@conform-to/react';
import { getZodConstraint, parseWithZod } from '@conform-to/zod';
import { json, redirect, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { Form, useActionData } from '@remix-run/react';
import { LogIn } from "lucide-react";
import { z } from 'zod';
import { Field } from '~/components/forms';
import { Button } from '~/components/ui/button';
import { getPagination } from "~/lib/utils";
import { getOptionalUser } from "~/server/auth.server";


export const loader = async ({ context }: LoaderFunctionArgs) => {
    const user = await getOptionalUser({ context })
    if (user) {
        return redirect('/')
    }
    return null;
};


export const action = async ({ request, context }: ActionFunctionArgs) => {
    const formData = await request.formData();

    const submission = await parseWithZod(formData, {
        async: true,
        schema: LoginSchema.superRefine(async (data, ctx) => {
            const { email, password } = data;

            const existingUser = await context.remixService.auth.checkIfUserExists({
                email,
                withPassword: true,
                password,
            });

            if (existingUser.error) {
                ctx.addIssue({
                    code: 'custom',
                    path: ['email'],
                    message: existingUser.message,
                });
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
    // l'email et le mot de passe sont valides, et un compte utilisateur existe.
    // connecter l'utilisateur.
    const { email } = submission.value;
    const { sessionToken } = await context.remixService.auth.authenticateUser({
        email,
    });

    const urlParams = new URL(request.url).searchParams
    const redirectTo = urlParams.get('redirectTo') || '/';
    // Example usage to ensure the helper is available and tree-shaken if unused
    getPagination({ page: 1, perPage: 10 });
    // Connecter l'utilisateur associé à l'email
    return redirect(`/authenticate?token=${sessionToken}&redirectTo=${redirectTo}`);
};

const LoginSchema = z.object({
    email: z
        .string({
            required_error: "L'email est obligatoire.",
        })
        .email({
            message: 'Cet email est invalide.',
        }),
    password: z.string({ required_error: 'Le mot de passe est obligatoire.' }),
});

export default function Login() {
    const actionData = useActionData<typeof action>();
    const [form, fields] = useForm({
        constraint: getZodConstraint(LoginSchema),
        onValidate({ formData }) {
            return parseWithZod(formData, {
                schema: LoginSchema,
            });
        },
        lastResult: actionData?.result,
    });

    return (
        <div className="min-h-screen py-4">
            <div className="max-w-md mx-auto px-4">
                {/* Header */}
                <div className="flex items-center gap-2 mb-4">
                    <LogIn className="size-5 text-bleu" />
                    <h1 className="text-xl font-bold text-bleu">Connexion</h1>
                </div>

                {/* Login Form */}
                <div className="bg-gray-50 rounded-lg shadow p-6 border border-gray-100">
                    <Form
                        {...getFormProps(form)}
                        method='POST'
                        reloadDocument
                        className='flex flex-col gap-4'
                    >
                        <Field
                            inputProps={getInputProps(fields.email, {
                                type: 'email',
                            })}
                            labelProps={{
                                children: 'Adresse e-mail',
                            }}
                            errors={fields.email.errors}
                        />

                        <Field
                            inputProps={getInputProps(fields.password, {
                                type: 'password',
                            })}
                            labelProps={{
                                children: 'Mot de passe',
                            }}
                            errors={fields.password.errors}
                        />

                        <Button className='ml-auto' type='submit'>
                            Se connecter
                        </Button>
                    </Form>
                </div>
            </div>
        </div>
    );
}
