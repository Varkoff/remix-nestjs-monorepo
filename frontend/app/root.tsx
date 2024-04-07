import { type LinksFunction } from '@remix-run/node';
import {
	Links,
	Meta,
	Outlet,
	Scripts,
	ScrollRestoration,
} from '@remix-run/react';
import { type RemixService } from '@virgile/backend';
import { Footer } from './components/Footer';
import { Navbar } from './components/Navbar';
import stylesheet from './global.css?url';
import logo from './routes/_assets/logo-coup-de-pouce-dark.png';

export const links: LinksFunction = () => [
	{ rel: 'stylesheet', href: stylesheet },
];

declare module '@remix-run/node' {
	interface AppLoadContext {
		toto: string;
		remixService: RemixService;
	}
}

export function Layout({ children }: { children: React.ReactNode }) {
	return (
		<html lang='en' className='h-full'>
			<head>
				<meta charSet='utf-8' />
				<meta name='viewport' content='width=device-width, initial-scale=1' />
				<Meta />
				<Links />
			</head>
			<body className='min-h-screen flex flex-col'>
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
	return <Outlet />;
}
