/**
 * Where the GameVerse Shutter runs: every public page. The admin panel (/_admin) is a separate back-office tool and is
 * left out, in both directions. Paths are compared without locale prefix and trailing slash (next.config: i18n +
 * trailingSlash). Query-only changes (filters, tabs, another id on the same page) never transition.
 */
const EXCLUDED_PREFIXES = ['/_admin'];

const LOCALES = ['en', 'kr', 'ru'];

const LABELS: Record<string, string> = {
	'/': 'Home',
	'/game': 'Games',
	'/game/detail': 'Game',
	'/developer': 'Developers',
	'/developer/detail': 'Developer',
	'/community': 'Community',
	'/community/detail': 'Community',
	'/cs': 'Help',
	'/about': 'About',
	'/mypage': 'My Page',
	'/member': 'Profile',
	'/notifications': 'Notifications',
	'/account/join': 'Log in',
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

const inScope = (path: string) => !EXCLUDED_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));

/** Both ends in scope and a real page change: query-only changes (filters, another game id) never transition **/
export const isTransitionable = (from: string, to: string) => from !== to && inScope(from) && inScope(to);

export const routeLabel = (path: string) => LABELS[path] ?? 'GameVerse';

/** Pages about one item: the clicked card's own title is a better label than the section name **/
export const isItemPage = (path: string) => path.endsWith('/detail') || path === '/member';
