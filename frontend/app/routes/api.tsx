import  { type LoaderFunctionArgs, json } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';

export const loader = async ({ context }: LoaderFunctionArgs) => {
	return json(context.remixService.getHello());
};

export default function Page() {
	const data = useLoaderData<typeof loader>();
	return <h1>{data}</h1>;
}
