import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { gsap } from 'gsap';
import { isTransitionable, parseRoute, routeLabel } from './transitionRoutes';
import { isIntroPending, markIntroDone } from '../homepage/introGate';

/**
 * GameVerse Shutter — the navigation-animation layer for Home, Games and Game detail.
 *
 * - Link clicks between in-scope routes are intercepted (plain left clicks only): five Void slats sweep up across the
 *   page one after another, the same destination is pushed under them, and they carry on upward to reveal it — one
 *   continuous motion. Back/Forward sweeps the other way. The slats are CSS transitions on transform, so the browser's
 *   compositor keeps them moving while the new page renders (a JS-driven timeline would stall there and feel frozen).
 * - Back/Forward and programmatic navigation are not intercepted: a faster sweep starts on routeChangeStart.
 * - Games card → Game detail: the card artwork expands into the screen and settles into the detail page's cover plate
 *   (Artwork Expansion); the portal is the fallback whenever that plate is not there (phones, missing image, slow data).
 * - Every phase is bounded: covers time out, a watchdog removes the overlay after 8s, errors reveal at once.
 */

type Phase = 'idle' | 'covering' | 'waiting' | 'revealing';
type Mode = 'portal' | 'art' | 'fallback';

const SLATS = 5; // three on phones (CSS hides the rest)
const STAGGER_MS = 36; // matches $stagger in gvPortal.scss
const COVER_MS = 440;
const FAST_MS = 320;
const INSTANT_MS = 70; // Back/Forward: closes before the page can swap underneath
const REVEAL_MS = 500;
const REDUCED_MS = 180;
const COVER_TIMEOUT_MS = 1200;
const WATCHDOG_MS = 8000;
const ART_TARGET = '.gv-gd-hero__fan .gv-gd-hero__plate:first-child';
const ART_TARGET_WAIT_MS = 1600;

/** gv-cut(c, tab) as an absolute polygon: raised tab along the top + one cut bottom-right corner **/
const cutPolygon = (x: number, y: number, w: number, h: number, c: number, tab = 0.58) => {
	const t = x + w * tab;
	return `polygon(${x}px ${y}px, ${Math.max(x, t - c)}px ${y}px, ${t}px ${y + c}px, ${x + w}px ${y + c}px, ${x + w}px ${
		y + h - c
	}px, ${x + w - c}px ${y + h}px, ${x}px ${y + h}px)`;
};

interface Box {
	x: number;
	y: number;
	w: number;
	h: number;
	c: number;
	tab: number;
}

interface ArtSource {
	img: HTMLImageElement;
	box: Box;
}

const query = (q: string) => typeof window !== 'undefined' && window.matchMedia(q).matches;

const PortalTransition = () => {
	const router = useRouter();
	const [mounted, setMounted] = useState(false);

	const rootRef = useRef<HTMLDivElement>(null);
	const hudTitleRef = useRef<HTMLSpanElement>(null);
	const voidRef = useRef<HTMLDivElement>(null);
	const labelRef = useRef<HTMLDivElement>(null);
	const wordRef = useRef<HTMLSpanElement>(null);
	const artRef = useRef<HTMLDivElement>(null);
	const artImgRef = useRef<HTMLImageElement>(null);
	const tintRef = useRef<HTMLSpanElement>(null);

	/** Mutable transition state (refs, not React state: no renders mid-animation) **/
	const state = useRef({
		phase: 'idle' as Phase,
		mode: 'portal' as Mode,
		nav: 0,
		currentPath: '/',
		covered: Promise.resolve(),
		/** Resolves at 70% of the cover: the screen is already hidden, so the route can start loading **/
		nearly: Promise.resolve(),
		timeline: null as gsap.core.Timeline | null,
		timers: [] as number[],
		watchdog: 0,
		/** set by the browser's popstate (Back/Forward), read by the next routeChangeStart **/
		popstate: false,
		hiddenSource: null as HTMLImageElement | null,
		reduced: false,
		light: false,
	});

	useEffect(() => setMounted(true), []);

	useEffect(() => {
		if (!mounted) return;
		const s = state.current;
		s.currentPath = parseRoute(window.location.pathname).path;
		const root = rootRef.current!;
		const hudTitle = hudTitleRef.current!;
		const plate = voidRef.current!;
		const label = labelRef.current!;
		const word = wordRef.current!;
		const art = artRef.current!;
		const artImg = artImgRef.current!;
		const tint = tintRef.current!;

		/** HELPERS **/
		const killTimeline = () => {
			s.timeline?.kill();
			s.timeline = null;
		};

		const clearTimers = () => {
			s.timers.forEach((timer) => window.clearTimeout(timer));
			s.timers = [];
		};

		const cleanup = () => {
			killTimeline();
			clearTimers();
			window.clearTimeout(s.watchdog);
			// Back to the resting position without animating there
			root.classList.add('is-resetting');
			root.classList.remove('is-covering', 'is-revealing', 'is-down', 'is-instant');
			void root.offsetWidth;
			root.classList.remove('is-resetting');
			gsap.set([plate, label, word, art, tint], { clearProps: 'all' });
			art.style.display = 'none';
			artImg.removeAttribute('src');
			if (s.hiddenSource) s.hiddenSource.style.visibility = '';
			s.hiddenSource = null;
			root.classList.remove('is-active', 'is-art', 'is-light');
			root.removeAttribute('aria-busy');
			s.phase = 'idle';
		};

		const activate = (mode: Mode, text: string) => {
			killTimeline();
			clearTimers();
			window.clearTimeout(s.watchdog);
			s.watchdog = window.setTimeout(cleanup, WATCHDOG_MS);
			s.mode = mode;
			s.reduced = query('(prefers-reduced-motion: reduce)');
			s.light = query('(max-width: 899px), (hover: none)');
			word.textContent = text.length > 28 ? `${text.slice(0, 27)}…` : text;
			hudTitle.textContent = word.textContent;
			root.classList.add('is-active');
			root.classList.toggle('is-art', mode === 'art');
			root.classList.toggle('is-light', s.light);
			root.setAttribute('aria-busy', 'true');
			s.phase = 'covering';
		};

		/**
		 * Resolves when the cover has finished — or after COVER_TIMEOUT_MS, whatever happens to the timeline.
		 * Also sets `s.nearly`, which resolves at 70% of the cover (and never later than the cover itself).
		 */
		const run = (build: (tl: gsap.core.Timeline) => void) => {
			let markNearly: () => void = () => undefined;
			s.nearly = new Promise<void>((resolve) => (markNearly = resolve));
			return new Promise<void>((resolve) => {
				const timer = window.setTimeout(resolve, COVER_TIMEOUT_MS);
				const done = () => {
					window.clearTimeout(timer);
					markNearly();
					resolve();
				};
				const tl = gsap.timeline({ onComplete: done, onInterrupt: done });
				s.timeline = tl;
				build(tl);
				tl.call(markNearly, [], tl.duration() * 0.7);
			});
		};

		/** Timer-based cover promise for the CSS shutter: resolves at `total`, `s.nearly` at 70% **/
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
		 * so the closed shutter fades in over 100ms instead, and only the reveal sweeps (downward for Back/Forward).
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

		/** COVER (art): the card artwork lifts out of its card and fills the screen while the page dims to Void **/
		const coverArt = (source: ArtSource) =>
			run((tl) => {
				const box = { ...source.box };
				artImg.src = source.img.currentSrc || source.img.src;
				art.style.display = 'block';
				const place = () => {
					gsap.set(art, { x: box.x, y: box.y, width: box.w, height: box.h });
					art.style.clipPath = cutPolygon(0, 0, box.w, box.h, box.c, box.tab);
				};
				place();
				source.img.style.visibility = 'hidden';
				s.hiddenSource = source.img;

				const d = s.light ? 0.38 : 0.46;
				tl.fromTo(plate, { autoAlpha: 0 }, { autoAlpha: 1, duration: d * 0.85, ease: 'power2.out' }, 0);
				tl.to(box, {
					x: 0,
					y: 0,
					w: window.innerWidth,
					h: window.innerHeight,
					c: 0,
					duration: d,
					ease: 'power3.inOut',
					onUpdate: place,
				}, 0);
				tl.fromTo(artImg, { scale: 1 }, { scale: 1.06, duration: d, ease: 'power2.out' }, 0);
				tl.fromTo(tint, { autoAlpha: 0 }, { autoAlpha: 1, duration: d, ease: 'power1.out' }, 0);
				tl.fromTo(label, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.2, ease: 'none' }, d * 0.5);
				tl.fromTo(word, { yPercent: 110 }, { yPercent: 0, duration: 0.42, ease: 'power4.out' }, d * 0.5);
			});

		/** REVEAL: the slats carry on in the same direction, in the same order — one continuous sweep **/
		const revealShutter = () => {
			s.phase = 'revealing';
			killTimeline();
			const duration = s.reduced ? REDUCED_MS : s.mode === 'fallback' ? FAST_MS + 40 : REVEAL_MS;
			root.style.setProperty('--gv-portal-d', `${duration}ms`);
			root.classList.remove('is-instant');
			root.classList.add('is-revealing');
			root.classList.remove('is-covering');
			s.timers.push(window.setTimeout(cleanup, sweepTotal(duration) + 40));
		};

		/** REVEAL (art): the artwork settles into the detail page's cover plate; without one, it dissolves **/
		const revealArt = (target: HTMLElement | null) => {
			s.phase = 'revealing';
			killTimeline();
			const tl = gsap.timeline({ onComplete: cleanup, onInterrupt: cleanup });
			s.timeline = tl;
			tl.to(word, { yPercent: -110, duration: 0.24, ease: 'power2.in' }, 0);
			tl.to(label, { autoAlpha: 0, duration: 0.2, ease: 'none' }, 0.06);

			const rect = target?.getBoundingClientRect();
			if (!target || !rect || rect.width < 40 || s.reduced) {
				tl.to(art, { autoAlpha: 0, scale: s.reduced ? 1 : 1.04, duration: 0.36, ease: 'power2.out' }, 0.04);
				tl.to(plate, { autoAlpha: 0, duration: 0.36, ease: 'power2.out' }, 0.06);
				return;
			}
			const box = { x: 0, y: 0, w: window.innerWidth, h: window.innerHeight, c: 0, tab: 0.54 };
			const place = () => {
				gsap.set(art, { x: box.x, y: box.y, width: box.w, height: box.h });
				art.style.clipPath = cutPolygon(0, 0, box.w, box.h, box.c, box.tab);
			};
			tl.to(box, { x: rect.left, y: rect.top, w: rect.width, h: rect.height, c: 22, duration: 0.5, ease: 'power3.inOut', onUpdate: place }, 0.02);
			tl.to(artImg, { scale: 1, duration: 0.5, ease: 'power3.inOut' }, 0.02);
			tl.to(tint, { autoAlpha: 0, duration: 0.3, ease: 'none' }, 0.02);
			tl.to(plate, { autoAlpha: 0, duration: 0.36, ease: 'power2.inOut' }, 0.14);
			// The real plate is underneath with the same image: hand over without a seam
			tl.to(art, { autoAlpha: 0, duration: 0.12, ease: 'none' }, 0.52);
		};

		/** Error / cancelled push: whatever is covering the screen gets out of the way **/
		const revealAny = () => {
			if (s.phase === 'idle' || s.phase === 'revealing') return;
			if (s.mode === 'art') revealArt(null);
			else revealShutter();
		};

		/** Waits (briefly) for the detail page's cover plate and its image **/
		const findArtTarget = () =>
			new Promise<HTMLElement | null>((resolve) => {
				const started = performance.now();
				const tick = () => {
					const el = document.querySelector<HTMLElement>(ART_TARGET);
					const img = el?.querySelector('img');
					if (el && img?.complete && img.naturalWidth > 0) return resolve(el);
					if (performance.now() - started > ART_TARGET_WAIT_MS) return resolve(null);
					window.requestAnimationFrame(tick);
				};
				tick();
			});

		const finish = async (nav: number) => {
			await s.covered;
			if (nav !== s.nav || s.phase === 'idle' || s.phase === 'revealing') return;
			if (s.mode === 'art') {
				// Redirected elsewhere mid-flight: no cover plate to settle into, dissolve at once
				const target = s.currentPath === '/game/detail' ? await findArtTarget() : null;
				// The phase may have moved on while we waited (newer navigation, watchdog)
				const phase = s.phase as Phase;
				if (nav !== s.nav || phase === 'idle' || phase === 'revealing') return;
				revealArt(target);
			} else {
				// One frame for the new page to paint (and Next's scroll-to-top) before the slats move on
				window.requestAnimationFrame(() => {
					if (nav === s.nav && s.phase !== 'idle' && s.phase !== 'revealing') revealShutter();
				});
			}
		};

		/** Card artwork that can expand (Games listing only), or null **/
		const artSourceFor = (anchor: HTMLAnchorElement, toPath: string): ArtSource | null => {
			if (toPath !== '/game/detail' || s.currentPath !== '/game') return null;
			const card = anchor.closest('.gv-cat-card');
			const img = card?.querySelector<HTMLImageElement>('.gv-cat-card__art img');
			if (!card || !img || !img.complete || !img.naturalWidth) return null;
			const rect = img.getBoundingClientRect();
			if (rect.width < 40 || rect.bottom < 0 || rect.top > window.innerHeight) return null;
			const feature = card.classList.contains('gv-cat-card--feature');
			return {
				img,
				box: { x: rect.left, y: rect.top, w: rect.width, h: rect.height, c: feature ? 28 : 20, tab: feature ? 0.56 : 0.54 },
			};
		};

		const labelFor = (anchor: HTMLAnchorElement | null, toPath: string) => {
			if (toPath === '/game/detail' && anchor) {
				const title = anchor
					.closest('.gv-cat-card, .gv-plate, .gv-fan-card, .gv-board, li, article')
					?.querySelector('h1, h2, h3, h4, .gv-plate__title, .gv-fan-card__title')
					?.textContent?.trim();
				if (title) return title;
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
				if (s.phase === 'revealing') {
					// Let the reveal finish; this navigation runs without its own portal
					router.push(href, undefined, { locale }).catch(() => undefined);
					return;
				}
				push().catch(() => undefined);
				return;
			}

			const nav = ++s.nav;
			// No artwork flight when motion is reduced: the portal's short fade is used instead
			const source = query('(prefers-reduced-motion: reduce)') ? null : artSourceFor(anchor, to.path);
			activate(source ? 'art' : 'portal', labelFor(anchor, to.path));
			if (to.path === '/' && isIntroPending()) markIntroDone(); // the transition is the entry moment
			s.covered = source ? coverArt(source) : coverShutter('up', false);
			s.covered.then(() => {
				if (nav === s.nav && s.phase === 'covering') s.phase = 'waiting';
			});
			// Start loading under the nearly complete cover; the reveal still waits for the full cover (finish)
			s.nearly.then(() => {
				if (nav !== s.nav || s.phase === 'idle') return;
				push()
					.then((ok) => {
						if (!ok && nav === s.nav && s.phase !== 'idle' && s.phase !== 'revealing') {
							s.covered.then(() => nav === s.nav && revealAny());
						}
					})
					.catch(() => {
						if (nav === s.nav) s.covered.then(revealAny);
					});
			});
		};

		/** ROUTER EVENTS — Back/Forward and programmatic navigation, plus completion for everything **/
		const onPopState = () => {
			s.popstate = true;
		};

		const onStart = (url: string, { shallow }: { shallow: boolean }) => {
			const back = s.popstate;
			s.popstate = false;
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
			if (s.phase === 'covering' || s.phase === 'waiting') finish(s.nav);
		};

		const onError = (error: { cancelled?: boolean }) => {
			// A cancelled route means a newer navigation took over; that one completes (or errors) for us
			if (error?.cancelled) return;
			if (s.phase !== 'idle') s.covered.then(revealAny);
		};

		document.addEventListener('click', onClick, true);
		window.addEventListener('popstate', onPopState);
		router.events.on('routeChangeStart', onStart);
		router.events.on('routeChangeComplete', onComplete);
		router.events.on('routeChangeError', onError);

		return () => {
			document.removeEventListener('click', onClick, true);
			window.removeEventListener('popstate', onPopState);
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
			<div className="gv-portal__plate gv-portal__plate--void" ref={voidRef}>
				<span className="gv-portal__grain" />
			</div>
			<div className="gv-portal__art" ref={artRef}>
				<img ref={artImgRef} alt="" decoding="async" />
				<span className="gv-portal__tint" ref={tintRef} />
			</div>
			<div className="gv-portal__label" ref={labelRef}>
				<span className="gv-portal__kicker">Entering</span>
				<span className="gv-portal__mask">
					<span className="gv-portal__word" ref={wordRef} />
				</span>
			</div>
		</div>
	);
};

export default PortalTransition;
