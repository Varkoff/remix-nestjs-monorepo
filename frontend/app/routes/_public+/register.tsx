import { getFormProps, getInputProps, useForm } from '@conform-to/react';
import { getZodConstraint, parseWithZod } from '@conform-to/zod';
import {
    json,
    redirect,
    type ActionFunctionArgs,
    type LoaderFunctionArgs,
} from '@remix-run/node';
import { Form, useActionData, useNavigation } from '@remix-run/react';
import { UserPlus } from "lucide-react";
import { z } from 'zod';
import { Field } from '~/components/forms';
import { Button } from '~/components/ui/button';
import { getOptionalUser } from '~/server/auth.server';

export const loader = async ({ context }: LoaderFunctionArgs) => {
    const user = await getOptionalUser({ context });
    if (user) {
        return redirect('/');
    }
    return null;
};

const RegisterSchema = z.object({
    email: z
        .string({
            required_error: "L'email est obligatoire.",
        })
        .email({
            message: 'Cet email est invalide.',
        }),
    firstname: z.string({
        required_error: 'Le prénom est obligatoire',
    }),
    password: z.string({ required_error: 'Le mot de passe est obligatoire.' }),
});

export const action = async ({ request, context }: ActionFunctionArgs) => {
    const formData = await request.formData();
    const submission = await parseWithZod(formData, {
        async: true,
        schema: RegisterSchema.superRefine(async (data, ctx) => {
            const { email } = data;

            const existingUser = await context.remixService.auth.checkIfUserExists({
                email,
                withPassword: false,
                password: '',
            });

            if (existingUser.error === false) {
                ctx.addIssue({
                    code: 'custom',
                    path: ['email'],
                    message: 'Cet utilisateur existe déjà.',
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
    const { email, firstname, password } = submission.value;

    const { email: createdUserEmail } =
        await context.remixService.auth.createUser({
            email,
            name: firstname,
            password,
        });

    const { sessionToken } = await context.remixService.auth.authenticateUser({
        email: createdUserEmail,
    });

    // Connecter l'utilisateur associé à l'email
    return redirect(`/authenticate?token=${sessionToken}`);
};

export default function Register() {
    const actionData = useActionData<typeof action>();
    const [form, fields] = useForm({
        constraint: getZodConstraint(RegisterSchema),
        onValidate({ formData }) {
            return parseWithZod(formData, {
                schema: RegisterSchema,
            });
        },
        lastResult: actionData?.result,
    });

    const isLoading = useNavigation().state === 'submitting';
    
    return (
        <div className="min-h-screen py-4">
            <div className="max-w-md mx-auto px-4">
                {/* Header */}
                <div className="flex items-center gap-2 mb-4">
                    <UserPlus className="size-5 text-bleu" />
                    <h1 className="text-xl font-bold text-bleu">Création de compte</h1>
                </div>

                {/* Register Form */}
                <div className="bg-gray-50 rounded-lg shadow p-6 border border-gray-100">
                    <Form
                        {...getFormProps(form)}
                        method='POST'
                        reloadDocument
                        className='flex flex-col gap-4'
                    >
                        <Field
                            inputProps={getInputProps(fields.firstname, {
                                type: 'text',
                            })}
                            labelProps={{
                                children: 'Votre prénom',
                            }}
                            errors={fields.firstname.errors}
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

                        <Field
                            inputProps={getInputProps(fields.password, {
                                type: 'password',
                            })}
                            labelProps={{
                                children: 'Mot de passe',
                            }}
                            errors={fields.password.errors}
                        />

                        <Button disabled={isLoading} className='ml-auto' type='submit'>
                            Je crée mon compte
                        </Button>
                    </Form>
                </div>
            </div>
        </div>
    );
}
