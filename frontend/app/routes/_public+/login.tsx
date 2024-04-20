import { getFormProps, getInputProps, useForm } from '@conform-to/react';
import { getZodConstraint, parseWithZod } from '@conform-to/zod';
import { json, redirect, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { Form, useActionData } from '@remix-run/react';
import { z } from 'zod';
import { Field } from '~/components/forms';
import { Button } from '~/components/ui/button';
import { getOptionalUser } from "~/server/auth.server";


export const loader = async ({ request, context }: LoaderFunctionArgs) => {
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

    // Connecter l'utilisateur associé à l'email
    return redirect(`/authenticate?token=${sessionToken}`);
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
        <div className='max-w-[600px] mx-auto'>
            <h1>Connexion</h1>
            <Form
                {...getFormProps(form)}
                method='POST'
                // action='/auth/login'
                reloadDocument
                className='flex flex-col gap-4'
            >
                <Field
                    inputProps={getInputProps(fields.email, {
                        type: 'email',
                    })}
                    labelsProps={{
                        children: 'Adresse e-email',
                    }}
                    errors={fields.email.errors}
                />

                <Field
                    inputProps={getInputProps(fields.password, {
                        type: 'password',
                    })}
                    labelsProps={{
                        children: 'Mot de passe',
                    }}
                    errors={fields.password.errors}
                />

                <Button className='ml-auto' type='submit'>
                    Se connecter
                </Button>
            </Form>
        </div>
    );
}
