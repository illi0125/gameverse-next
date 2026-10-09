import React, { useEffect, useRef } from 'react';

/** Fine pointer only: touch and pen keep the system behaviour **/
const FINE_POINTER = '(hover: hover) and (pointer: fine)';
const REDUCED_MOTION = '(prefers-reduced-motion: reduce)';

/** Things that react to a click: the ring locks on and fills **/
const INTERACTIVE =
	'a, button, [role="button"], [role="tab"], [role="menuitem"], [role="option"], [role="checkbox"], [role="radio"], [role="switch"], label, summary, .MuiButtonBase-root, [data-cursor="hover"]';
/** Things you type into: the custom cursor steps aside for the native I-beam **/
const TEXT_FIELD = 'input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([type="button"]):not([type="submit"]), textarea, select, [contenteditable=""], [contenteditable="true"]';

/** Per-frame catch-up at 60fps; the ring trails the dot, the glow trails the ring **/
const RING_EASE = 0.16;
const GLOW_EASE = 0.07;

/**
 * Site-wide cursor (reference: design-references/reference2.mov): a square dot on the pointer and a
 * cut-corner ring that eases after it, plus a faint ultraviolet afterglow that fades when the pointer rests.
 */
const GvCursor = () => {
	const dotRef = useRef<HTMLDivElement>(null);
	const ringRef = useRef<HTMLDivElement>(null);
	const glowRef = useRef<HTMLDivElement>(null);

	/** LIFECYCLES **/
	useEffect(() => {
		const dot = dotRef.current;
		const ring = ringRef.current;
		const glow = glowRef.current;
		if (!dot || !ring || !glow) return;

		const fine = window.matchMedia(FINE_POINTER);
		const reduced = window.matchMedia(REDUCED_MOTION);
		const html = document.documentElement;

		const pointer = { x: -100, y: -100 };
		const ringPos = { x: -100, y: -100 };
		const glowPos = { x: -100, y: -100 };
		let frame = 0;
		let last = 0;
		let seen = false;
		let enabled = false;

		const place = (el: HTMLElement, x: number, y: number) => {
			el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
		};

		const tick = (now: number) => {
			const dt = last ? Math.min((now - last) / 16.667, 4) : 1;
			last = now;
			const instant = reduced.matches;
			const ringK = instant ? 1 : 1 - Math.pow(1 - RING_EASE, dt);
			const glowK = instant ? 1 : 1 - Math.pow(1 - GLOW_EASE, dt);

			ringPos.x += (pointer.x - ringPos.x) * ringK;
			ringPos.y += (pointer.y - ringPos.y) * ringK;
			glowPos.x += (pointer.x - glowPos.x) * glowK;
			glowPos.y += (pointer.y - glowPos.y) * glowK;
			place(ring, ringPos.x, ringPos.y);
			place(glow, glowPos.x, glowPos.y);

			// Sleep once everything has caught up; the next move wakes the loop
			const resting = Math.abs(pointer.x - glowPos.x) < 0.5 && Math.abs(pointer.y - glowPos.y) < 0.5;
			if (resting) {
				frame = 0;
				last = 0;
				html.classList.remove('gv-cursor-moving');
				return;
			}
			frame = requestAnimationFrame(tick);
		};
		const wake = () => {
			if (!frame) frame = requestAnimationFrame(tick);
		};

		const setState = (target: EventTarget | null) => {
			const el = target instanceof Element ? target : null;
			const typing = !!el?.closest(TEXT_FIELD);
			const hover = !typing && !!el?.closest(INTERACTIVE);
			html.classList.toggle('gv-cursor-text', typing);
			html.classList.toggle('gv-cursor-hover', hover);
		};

		const onMove = (event: PointerEvent) => {
			if (event.pointerType && event.pointerType !== 'mouse') return;
			pointer.x = event.clientX;
			pointer.y = event.clientY;
			place(dot, pointer.x, pointer.y);
			if (!seen) {
				// First move: start everything on the pointer instead of flying in from a corner
				seen = true;
				ringPos.x = glowPos.x = pointer.x;
				ringPos.y = glowPos.y = pointer.y;
				place(ring, ringPos.x, ringPos.y);
				place(glow, glowPos.x, glowPos.y);
			}
			html.classList.add('gv-cursor-visible', 'gv-cursor-moving');
			setState(event.target);
			wake();
		};
		const onOver = (event: PointerEvent) => setState(event.target);
		const onDown = () => html.classList.add('gv-cursor-down');
		const onUp = () => html.classList.remove('gv-cursor-down');
		// Leaving the window (or entering an iframe) hides it; the next move brings it back
		const onOut = (event: MouseEvent) => {
			if (!event.relatedTarget) html.classList.remove('gv-cursor-visible', 'gv-cursor-down');
		};
		const onBlur = () => html.classList.remove('gv-cursor-visible', 'gv-cursor-down');

		const enable = () => {
			if (enabled) return;
			enabled = true;
			html.classList.add('gv-cursor-on');
			window.addEventListener('pointermove', onMove, { passive: true });
			document.addEventListener('pointerover', onOver, { passive: true });
			window.addEventListener('pointerdown', onDown, { passive: true });
			window.addEventListener('pointerup', onUp, { passive: true });
			document.addEventListener('mouseout', onOut);
			window.addEventListener('blur', onBlur);
		};
		const disable = () => {
			if (!enabled) return;
			enabled = false;
			cancelAnimationFrame(frame);
			frame = 0;
			seen = false;
			html.classList.remove('gv-cursor-on', 'gv-cursor-visible', 'gv-cursor-moving', 'gv-cursor-hover', 'gv-cursor-text', 'gv-cursor-down');
			window.removeEventListener('pointermove', onMove);
			document.removeEventListener('pointerover', onOver);
			window.removeEventListener('pointerdown', onDown);
			window.removeEventListener('pointerup', onUp);
			document.removeEventListener('mouseout', onOut);
			window.removeEventListener('blur', onBlur);
		};

		// A mouse can be plugged into a tablet (or removed) while the page is open
		const sync = () => (fine.matches ? enable() : disable());
		sync();
		fine.addEventListener('change', sync);

		return () => {
			fine.removeEventListener('change', sync);
			disable();
		};
	}, []);

	return (
		<div className="gv-cursor" aria-hidden="true">
			<div ref={glowRef} className="gv-cursor__glow" />
			<div ref={ringRef} className="gv-cursor__ring">
				<svg className="gv-cursor__frame" viewBox="0 0 36 36">
					<path d="M1 1 H35 V27 L27 35 H1 Z" />
				</svg>
			</div>
			<div ref={dotRef} className="gv-cursor__dot" />
		</div>
	);
};

export default GvCursor;
