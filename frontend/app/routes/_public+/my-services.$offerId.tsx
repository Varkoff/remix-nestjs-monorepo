import {
  getFormProps,
  getInputProps,
  getTextareaProps,
  useForm,
} from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod";
import {
  json,
  redirect,
  unstable_createMemoryUploadHandler,
  unstable_parseMultipartFormData,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
} from "@remix-run/node";
import {
  Form,
  useActionData,
  useLoaderData,
  useNavigation,
  useParams,
} from "@remix-run/react";
import { z } from "zod";
import { CheckboxField, ErrorList, Field, TextareaField } from "~/components/forms";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { requireUser } from "~/server/auth.server";
import { createOffer, editOffer, getUserOffer } from "~/server/profile.server";

export const loader = async ({ context, params }: LoaderFunctionArgs) => {
  const offerId = params.offerId;
  if (!offerId) {
    throw new Error("Did not find offerId");
  }
  const user = await requireUser({ context });

  if (offerId === "new") {
    return json({
      offer: null,
    });
  }

  const offer = await getUserOffer({
    context,
    userId: user.id,
    offerId,
  });

  if (!offer) {
    return redirect("/my-services");
  }

  return json({
    offer,
  });
};

export const CreateOfferSchema = z.object({
  title: z.string({
    required_error: "Votre annonce doit avoir un titre",
  }),
  description: z.string({
    required_error: "Votre annonce doit avoir une description.",
  }),
  price: z
    .number({
      required_error: "Votre annonce doit avoir un prix.",
    })
    .min(0, "Le prix doit être positif.")
    .max(500, "Le prix doit être inférieur à 500€."),
  active: z
    .boolean({
      required_error: "Votre annonce doit être active ou non.",
    })
    .default(false),
  image: z.instanceof(File).superRefine((file, ctx) => {
    if (file.size > 10_000_000) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "L'image est trop lourde (10Mo max)",
      });
      return false;
    }
  }).optional(),
});

export const action = async ({
  request,
  context,
  params,
}: ActionFunctionArgs) => {
  const offerId = params.offerId;
  if (!offerId) {
    throw new Error("Did not find offerId");
  }

  const user = await requireUser({ context });
  const imageHandler = unstable_createMemoryUploadHandler({
    maxPartSize: 10_000_000,
  });
  const formData = await unstable_parseMultipartFormData(request, imageHandler);
  const submission = parseWithZod(formData, {
    schema: CreateOfferSchema,
  });

  if (submission.status !== "success") {
    return json(
      { result: submission.reply() },
      {
        status: 400,
      },
    );
  }

  if (offerId === "new") {
    const { id: createdOfferId } = await createOffer({
      context,
      offerData: submission.value,
      userId: user.id,
    });

    return redirect(`/my-services/${createdOfferId}`);
  }

  await editOffer({
    context,
    offerData: submission.value,
    userId: user.id,
    offerId,
  });

  return null;
};

export default function CreateOffer() {
  const { offer } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const [form, fields] = useForm({
    constraint: getZodConstraint(CreateOfferSchema),
    onValidate({ formData }) {
      return parseWithZod(formData, {
        schema: CreateOfferSchema,
      });
    },
    lastResult: actionData?.result,
    defaultValue: {
      title: offer?.title ?? "",
      description: offer?.description ?? "",
      price: offer?.price ?? "",
      active: offer?.active ?? false,
    },
  });
  const { offerId } = useParams();

  const isNew = offerId === "new";
  const isLoading = useNavigation().state === "submitting";
  return (
    <div className="max-w-[600px] mx-auto">
      <h2 className="text-lg font-bold mb-4">
        {isNew ? "Ajouter une offre" : `${offer?.title}`}
      </h2>
      <Form
        {...getFormProps(form)}
        method="POST"
        reloadDocument
        className="flex flex-col gap-2"
        encType="multipart/form-data"
      >
        <Field
          inputProps={getInputProps(fields.title, {
            type: "text",
          })}
          labelProps={{
            children: "Titre de l'offre",
          }}
          errors={fields.title.errors}
        />

        <Field
          inputProps={getInputProps(fields.price, {
            type: "number",
          })}
          labelProps={{
            children: "Prix de l'offre",
          }}
          errors={fields.price.errors}
        />

        <TextareaField
          textareaProps={getTextareaProps(fields.description)}
          labelProps={{
            children: "Description de l'offre",
          }}
          errors={fields.description.errors}
        />

        {isNew ? null : (
          <CheckboxField
            buttonProps={{
              ...getInputProps(fields.active, {
                type: "checkbox",
              }),
            }}
            labelProps={{
              children: "Activer cette offre",
            }}
            errors={fields.active.errors}
          />
        )}
        {offer?.imageUrl ? (
          <img src={offer.imageUrl} className="w-30 h-auto shrink-0" />
        ) : null}
        <div className="grid gap-1">
          <Label className="sr-only" htmlFor="image">
            Image
          </Label>
          <Input
            id="image"
            name="image"
            placeholder="Votre image"
            type="file"
            accept="image/*"
            required
            disabled={isLoading}
          />
          <ErrorList errors={fields.image.errors} />
        </div>

        <Button
          variant={isNew ? "primary" : "blueOutline"}
          disabled={isLoading}
          className="ml-auto"
          type="submit"
        >
          {isNew ? "Créer cette offre" : "Mettre à jour cette offre"}
        </Button>
      </Form>
    </div>
  );
}
