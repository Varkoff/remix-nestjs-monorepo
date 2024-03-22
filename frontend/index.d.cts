declare module '@virgile/frontend' {
	export function getPublicDir(): string;
	export function getServerBuild(): Promise<any>;
	export function startDevServer(app: any): Promise<void>;
}
