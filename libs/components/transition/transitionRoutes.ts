/**
 * Where the GameVerse Portal runs. Kept to the three reviewed routes; add a path here to extend it.
 * Paths are compared without locale prefix and trailing slash (next.config: i18n + trailingSlash).
 */
export const TRANSITION_PATHS = ['/', '/game', '/game/detail'] as const;

const LOCALES = ['en', 'kr', 'ru'];

const LABELS: Record<string, string> = {
	'/': 'Home',
	'/game': 'Games',
	'/game/detail': 'Game',
};

export interface ParsedRoute {
	/** e.g. "/game/detail" **/
	path: string;
	/** locale named in the URL, if any ("kr" in /kr/game/) **/
	locale: string | null;
}

export const parseRoute = (pathname: string): ParsedRoute => {
	const segments = pathname.split('?')[0].split('#')[0].split('/').filter(Boolean);
	const locale = segments.length && LOCALES.includes(segments[0]) ? segments.shift() ?? null : null;
	return { path: `/${segments.join('/')}`, locale };
};

const inScope = (path: string) => (TRANSITION_PATHS as readonly string[]).includes(path);

/** Both ends in scope and a real page change: query-only changes (filters, another game id) never transition **/
export const isTransitionable = (from: string, to: string) => from !== to && inScope(from) && inScope(to);

export const routeLabel = (path: string) => LABELS[path] ?? 'GameVerse';
