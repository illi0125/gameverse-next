/**
 * The homepage intro plays once per browser session. While it is on screen the hero holds its
 * load reveal; the intro releases it when its exit begins (or at once when there is no intro).
 */
export const INTRO_KEY = 'gv-intro-seen';

let done = false;
const waiting = new Set<() => void>();

export const introSeen = (): boolean => {
	try {
		return window.sessionStorage.getItem(INTRO_KEY) === '1';
	} catch {
		return false;
	}
};

export const rememberIntro = () => {
	try {
		window.sessionStorage.setItem(INTRO_KEY, '1');
	} catch {
		/* storage blocked: the intro simply plays again next load */
	}
};

export const isIntroPending = () => !done && !introSeen();

/** Also stores the session key, so a reload during the intro plays it again rather than half of it **/
export const markIntroDone = () => {
	if (done) return;
	done = true;
	rememberIntro();
	// Same flag the pre-paint script in _document sets: hides the overlay before React unmounts it
	document.documentElement.setAttribute('data-gv-intro', 'skip');
	waiting.forEach((callback) => callback());
	waiting.clear();
};

/** Runs `callback` once the intro has handed over; returns an unsubscribe for effect cleanups **/
export const onIntroDone = (callback: () => void): (() => void) => {
	if (!isIntroPending()) {
		callback();
		return () => undefined;
	}
	waiting.add(callback);
	return () => waiting.delete(callback);
};
