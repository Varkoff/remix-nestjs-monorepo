import {
	json,
	type LinksFunction,
	type LoaderFunctionArgs,
} from "@remix-run/node";
import { NuqsAdapter } from "nuqs/adapters/remix";

import {
	Links,
	Meta,
	Outlet,
	Scripts,
	ScrollRestoration,
	useRouteLoaderData,
} from "@remix-run/react";
import { type RemixService } from "@virgile/backend";
import { Footer } from "./components/Footer";
import { Navbar } from "./components/Navbar";
import stylesheet from "./global.css?url";
import logo from "./routes/_assets/logo-coup-de-pouce-dark.png";
import {
	getNotificationStats,
	getNotifications,
	getOptionalUser,
} from "./server/auth.server";

export const links: LinksFunction = () => [
	{ rel: "stylesheet", href: stylesheet },
];

export const loader = async ({ request, context }: LoaderFunctionArgs) => {
	const user = await getOptionalUser({ context });
	let notificationStats: Awaited<
		ReturnType<typeof getNotificationStats>
	> | null = null;
	let notifications: Awaited<ReturnType<typeof getNotifications>> | null = null;

	if (user) {
		notificationStats = await getNotificationStats({
			context,
			userId: user.id,
		});
		notifications = await getNotifications({ context, userId: user.id });
	}

	return json({
		user,
		notificationStats,
		notifications,
	});
};

export const useOptionalUser = () => {
	const data = useRouteLoaderData<typeof loader>("root");
	if (!data) {
		return null;
		// throw new Error('Root Loader did not return anything')
	}
	return data.user;
};

export const useNotificationStats = () => {
	const data = useRouteLoaderData<typeof loader>("root");
	if (!data) {
		return null;
	}
	return data.notificationStats;
};

export const useNotifications = () => {
	const data = useRouteLoaderData<typeof loader>("root");
	if (!data) {
		return null;
	}
	return data.notifications;
};

export const useUser = () => {
	const user = useOptionalUser();
	if (!user) {
		// return null;
		throw new Error("L'utilisateur n'est pas connecté");
	}
	return user;
};

declare module "@remix-run/node" {
	interface AppLoadContext {
		remixService: RemixService;
		user: unknown;
	}
}

export function Layout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en" className="h-full">
			<head>
				<meta charSet="utf-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				<Meta />
				<Links />
			</head>
			<body className="min-h-screen flex flex-col">
				<Navbar logo={logo} />
				{children}
				<Footer />
				<ScrollRestoration />
				<Scripts />
			</body>
		</html>
	);
}

export default function App() {
	return (
		<NuqsAdapter>
			<Outlet />;
		</NuqsAdapter>
	);
}
