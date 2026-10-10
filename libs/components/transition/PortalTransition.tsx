import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { isItemPage, isTransitionable, parseRoute, routeLabel } from './transitionRoutes';
import { isIntroPending, markIntroDone } from '../homepage/introGate';

/**
 * GameVerse Shutter — the navigation-animation layer for every public page (scope in transitionRoutes.ts).
 *
 * - Link clicks between in-scope pages are intercepted (plain left clicks only): five Void slats sweep up across the
 *   page one after another, the same destination is pushed under them, and they carry on upward to reveal it — one
 *   continuous motion. The slats are CSS transitions on transform, so the browser's compositor keeps them moving while
 *   the new page renders (a JS-driven timeline would stall there and feel frozen).
 * - Back/Forward and programmatic navigation are not intercepted: the closed shutter fades in at once, then sweeps away
 *   (downward for Back/Forward).
 * - Every phase is bounded: covers resolve on timers, a watchdog removes the overlay after 8s, errors reveal at once.
 */

type Phase = 'idle' | 'covering' | 'waiting' | 'revealing';
type Mode = 'click' | 'fallback';

const SLATS = 5; // three on phones (CSS hides the rest)
const STAGGER_MS = 36; // matches the transition-delay step in gvPortal.scss
const COVER_MS = 440;
const FAST_MS = 320;
const INSTANT_MS = 70; // Back/Forward: closes before the page can swap underneath
const REVEAL_MS = 500;
const REDUCED_MS = 180;
const WATCHDOG_MS = 8000;
const LABEL_MAX = 28;

const query = (q: string) => typeof window !== 'undefined' && window.matchMedia(q).matches;

const PortalTransition = () => {
	const router = useRouter();
	const [mounted, setMounted] = useState(false);

	const rootRef = useRef<HTMLDivElement>(null);
	const hudTitleRef = useRef<HTMLSpanElement>(null);

	/** Mutable transition state (refs, not React state: no renders mid-animation) **/
	const state = useRef({
		phase: 'idle' as Phase,
		mode: 'click' as Mode,
		nav: 0,
		currentPath: '/',
		covered: Promise.resolve(),
		/** Resolves at 70% of the cover: the screen is already hidden, so the route can start loading **/
		nearly: Promise.resolve(),
		timers: [] as number[],
		watchdog: 0,
		/** Next's history entry keys seen in this tab, in order, and where we are among them (Back vs Forward) **/
		keys: [] as string[],
		index: -1,
		reduced: false,
		light: false,
	});

	useEffect(() => setMounted(true), []);

	useEffect(() => {
		if (!mounted) return;
		const s = state.current;
		s.currentPath = parseRoute(window.location.pathname).path;
		const historyKey = (): string | null => (window.history.state as { key?: string } | null)?.key ?? null;
		/** Called whenever a page is shown: a known key moves our position, a new one is a fresh entry after it **/
		const rememberEntry = () => {
			const key = historyKey();
			if (!key) return;
			const known = s.keys.indexOf(key);
			if (known >= 0) {
				s.index = known;
			} else {
				s.keys = [...s.keys.slice(0, s.index + 1), key];
				s.index = s.keys.length - 1;
			}
		};
		rememberEntry();
		const root = rootRef.current!;
		const hudTitle = hudTitleRef.current!;

		/** HELPERS **/
		const clearTimers = () => {
			s.timers.forEach((timer) => window.clearTimeout(timer));
			s.timers = [];
		};

		const cleanup = () => {
			clearTimers();
			window.clearTimeout(s.watchdog);
			// Back to the resting position without animating there
			root.classList.add('is-resetting');
			root.classList.remove('is-covering', 'is-revealing', 'is-down', 'is-instant');
			void root.offsetWidth;
			root.classList.remove('is-resetting', 'is-active', 'is-light');
			root.removeAttribute('aria-busy');
			s.phase = 'idle';
		};

		const activate = (mode: Mode, text: string) => {
			clearTimers();
			window.clearTimeout(s.watchdog);
			s.watchdog = window.setTimeout(cleanup, WATCHDOG_MS);
			s.mode = mode;
			s.reduced = query('(prefers-reduced-motion: reduce)');
			s.light = query('(max-width: 899px), (hover: none)');
			hudTitle.textContent = text.length > LABEL_MAX ? `${text.slice(0, LABEL_MAX - 1)}…` : text;
			root.classList.add('is-active');
			root.classList.toggle('is-light', s.light);
			root.setAttribute('aria-busy', 'true');
			s.phase = 'covering';
		};

		/** Timer-based cover promise: resolves at `total`, `s.nearly` at 70% **/
		const timed = (total: number) => {
			let markNearly: () => void = () => undefined;
			s.nearly = new Promise<void>((resolve) => (markNearly = resolve));
			return new Promise<void>((resolve) => {
				s.timers.push(window.setTimeout(markNearly, total * 0.7));
				s.timers.push(
					window.setTimeout(() => {
						markNearly();
						resolve();
					}, total),
				);
			});
		};

		const sweepTotal = (duration: number) => (s.reduced ? duration : duration + STAGGER_MS * ((s.light ? 3 : SLATS) - 1));

		/**
		 * COVER: the slats sweep in one after another (link clicks).
		 * `instant` (Back/Forward, programmatic): navigation is already under way and the page may swap within ~150ms,
		 * so the closed shutter fades in quickly instead, and only the reveal sweeps (downward for Back/Forward).
		 */
		const coverShutter = (direction: 'up' | 'down', instant: boolean) => {
			root.classList.toggle('is-down', direction === 'down');
			root.classList.toggle('is-instant', instant);
			if (instant) {
				root.style.setProperty('--gv-portal-d', `${INSTANT_MS}ms`);
				root.classList.add('is-covering');
				return timed(INSTANT_MS);
			}
			const duration = s.reduced ? REDUCED_MS : COVER_MS;
			root.style.setProperty('--gv-portal-d', `${duration}ms`);
			void root.offsetWidth; // the start position is applied before the transition begins
			root.classList.add('is-covering');
			return timed(sweepTotal(duration));
		};

		/** REVEAL: the slats carry on in the same direction, in the same order — one continuous sweep **/
		const revealShutter = () => {
			if (s.phase === 'idle' || s.phase === 'revealing') return;
			s.phase = 'revealing';
			const duration = s.reduced ? REDUCED_MS : s.mode === 'fallback' ? FAST_MS + 40 : REVEAL_MS;
			root.style.setProperty('--gv-portal-d', `${duration}ms`);
			root.classList.remove('is-instant');
			root.classList.add('is-revealing');
			root.classList.remove('is-covering');
			s.timers.push(window.setTimeout(cleanup, sweepTotal(duration) + 40));
		};

		const finish = async (nav: number) => {
			await s.covered;
			if (nav !== s.nav || s.phase === 'idle' || s.phase === 'revealing') return;
			// One frame for the new page to paint (and Next's scroll-to-top) before the slats move on
			window.requestAnimationFrame(() => {
				if (nav === s.nav) revealShutter();
			});
		};

		/** Item pages (a game, developer, post, profile) are labelled with the clicked card's title when there is one **/
		const labelFor = (anchor: HTMLAnchorElement | null, toPath: string) => {
			if (isItemPage(toPath) && anchor) {
				const own = anchor.matches('h1 a, h2 a, h3 a, h4 a') ? anchor.textContent?.trim() : '';
				const title =
					own ||
					anchor
						.closest('.gv-cat-card, .gv-plate, .gv-fan-card, .gv-board, li, article')
						?.querySelector('h1, h2, h3, h4, .gv-plate__title, .gv-fan-card__title')
						?.textContent?.trim();
				if (title && title.length <= 60) return title;
			}
			return routeLabel(toPath);
		};

		/** CLICK INTERCEPTION (capture phase, before Next's Link handler) **/
		const onClick = (event: MouseEvent) => {
			if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
				return;
			}
			const anchor = (event.target as Element | null)?.closest?.('a[href]') as HTMLAnchorElement | null;
			if (!anchor || (anchor.target && anchor.target !== '_self') || anchor.hasAttribute('download')) return;
			if (anchor.closest('[data-no-transition]')) return;
			const url = new URL(anchor.href, window.location.href);
			if (url.origin !== window.location.origin) return;
			const to = parseRoute(url.pathname);
			if (!isTransitionable(s.currentPath, to.path)) return;

			event.preventDefault(); // Next's Link sees this and leaves the navigation to us
			const href = `${url.pathname.replace(/^\/(en|kr|ru)(?=\/|$)/, '') || '/'}${url.search}${url.hash}`;
			const locale = to.locale ?? router.defaultLocale ?? 'en';
			const push = () => router.push(href, undefined, { locale });

			// Already moving: the newest destination wins. Bumping `nav` cancels the earlier click's scheduled push;
			// the cover stays up and is revealed when this route completes.
			if (s.phase !== 'idle') {
				s.nav += 1;
				push().catch(() => undefined);
				return;
			}

			const nav = ++s.nav;
			activate('click', labelFor(anchor, to.path));
			if (to.path === '/' && isIntroPending()) markIntroDone(); // the transition is the entry moment
			s.covered = coverShutter('up', false);
			s.covered.then(() => {
				if (nav === s.nav && s.phase === 'covering') s.phase = 'waiting';
			});
			// Start loading under the nearly complete cover; the reveal still waits for the full cover (finish)
			s.nearly.then(() => {
				if (nav !== s.nav || s.phase === 'idle') return;
				push()
					.then((ok) => {
						if (!ok && nav === s.nav) s.covered.then(() => nav === s.nav && revealShutter());
					})
					.catch(() => {
						if (nav === s.nav) s.covered.then(revealShutter);
					});
			});
		};

		/** ROUTER EVENTS — Back/Forward and programmatic navigation, plus completion for everything **/
		/**
		 * Next starts a Back/Forward route change from its own popstate handler, before any listener of ours runs, but
		 * history.state already holds the destination entry: a key we have seen *before* the current one means Back.
		 * (For a push, history.state is still the current entry when routeChangeStart fires.)
		 */
		const isBackTraversal = () => {
			const key = historyKey();
			const position = key ? s.keys.indexOf(key) : -1;
			return position >= 0 && position < s.index;
		};

		const onStart = (url: string, { shallow }: { shallow: boolean }) => {
			const back = isBackTraversal();
			if (shallow || s.phase !== 'idle') return;
			const to = parseRoute(url);
			if (!isTransitionable(s.currentPath, to.path)) return;
			s.nav += 1;
			activate('fallback', routeLabel(to.path));
			if (to.path === '/' && isIntroPending()) markIntroDone();
			s.covered = coverShutter(back ? 'down' : 'up', true);
			s.covered.then(() => {
				if (s.phase === 'covering') s.phase = 'waiting';
			});
		};

		const onComplete = (url: string) => {
			s.currentPath = parseRoute(url).path;
			rememberEntry();
			if (s.phase === 'covering' || s.phase === 'waiting') finish(s.nav);
		};

		const onError = (error: { cancelled?: boolean }) => {
			// A cancelled route means a newer navigation took over; that one completes (or errors) for us
			if (error?.cancelled) return;
			if (s.phase !== 'idle') s.covered.then(revealShutter);
		};

		document.addEventListener('click', onClick, true);
		router.events.on('routeChangeStart', onStart);
		router.events.on('routeChangeComplete', onComplete);
		router.events.on('routeChangeError', onError);

		return () => {
			document.removeEventListener('click', onClick, true);
			router.events.off('routeChangeStart', onStart);
			router.events.off('routeChangeComplete', onComplete);
			router.events.off('routeChangeError', onError);
			cleanup();
		};
		// The router object is stable for the app's lifetime
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [mounted]);

	if (!mounted) return null;

	return (
		<div className="gv-portal" ref={rootRef} aria-hidden="true">
			<div className="gv-portal__slats">
				{Array.from({ length: SLATS }, (_, index) => (
					<span
						key={index}
						className="gv-portal__slat"
						style={{ '--i': index, '--j': SLATS - 1 - index } as React.CSSProperties}
					/>
				))}
			</div>
			<div className="gv-portal__hud">
				<span className="gv-portal__hud-kicker">GameVerse</span>
				<span className="gv-portal__hud-title" ref={hudTitleRef} />
				<span className="gv-portal__bar" />
			</div>
		</div>
	);
};

export default PortalTransition;
