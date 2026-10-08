import { useEffect } from 'react';
import { useRouter } from 'next/router';

const STORAGE_KEY = 'gv-home-scroll';
const SECTION_IDS = ['trending-games', 'popular-games', 'top-games', 'top-agents', 'community', 'events'];
const STABLE_FRAMES = 20;
const MAX_RESTORE_MS = 4000;

interface SavedScroll {
	key: string | null;
	y: number;
	anchor: string | null;
	offset: number;
}

const sectionTop = (element: HTMLElement) => element.getBoundingClientRect().top + window.scrollY;

const readSaved = (): SavedScroll | null => {
	try {
		const raw = window.sessionStorage.getItem(STORAGE_KEY);
		return raw ? (JSON.parse(raw) as SavedScroll) : null;
	} catch {
		return null;
	}
};

/**
 * Brings the homepage back to the section the user left when they return with Back/Forward.
 * The page grows after mount (Apollo data, scroll-scene heights), so native and Next restoration
 * land at the top; this keeps re-applying the saved position until the layout settles.
 */
const useHomeScrollMemory = () => {
	const router = useRouter();

	useEffect(() => {
		/** SAVE: remember where we were, relative to the chapter in view **/
		const save = () => {
			const y = window.scrollY;
			let anchor: string | null = null;
			let offset = y;
			SECTION_IDS.forEach((id) => {
				const element = document.getElementById(id);
				if (element && sectionTop(element) <= y + 1) {
					anchor = id;
					offset = y - sectionTop(element);
				}
			});
			try {
				const saved: SavedScroll = { key: window.history.state?.key ?? null, y, anchor, offset };
				window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
			} catch {
				// Storage unavailable (private mode): fall back to default behaviour
			}
		};
		router.events.on('routeChangeStart', save);

		/** RESTORE: only when returning to the same history entry (Back/Forward), never on a fresh visit **/
		const saved = readSaved();
		const currentKey = window.history.state?.key ?? null;
		let frame = 0;
		let cancelled = false;
		const userInput = ['wheel', 'touchstart', 'keydown', 'pointerdown'];
		const cancel = () => {
			cancelled = true;
		};

		if (saved && saved.key && saved.key === currentKey && saved.y > 0) {
			const target = () => {
				const element = saved.anchor ? document.getElementById(saved.anchor) : null;
				return element ? sectionTop(element) + saved.offset : saved.y;
			};
			const started = performance.now();
			let stable = 0;
			let lastHeight = 0;

			userInput.forEach((type) => window.addEventListener(type, cancel, { passive: true, once: true }));

			const tick = () => {
				if (cancelled) return;
				const goal = target();
				const height = document.documentElement.scrollHeight;
				window.scrollTo(0, Math.min(goal, height - window.innerHeight));
				stable = height === lastHeight && Math.abs(window.scrollY - goal) < 2 ? stable + 1 : 0;
				lastHeight = height;
				if (stable < STABLE_FRAMES && performance.now() - started < MAX_RESTORE_MS) {
					frame = window.requestAnimationFrame(tick);
				}
			};
			frame = window.requestAnimationFrame(tick);
		}

		return () => {
			router.events.off('routeChangeStart', save);
			window.cancelAnimationFrame(frame);
			userInput.forEach((type) => window.removeEventListener(type, cancel));
		};
	}, []);
};

export default useHomeScrollMemory;
