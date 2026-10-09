import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { MOTION_QUERY } from './homeMotion';
import { introSeen, markIntroDone } from './introGate';

const LINES = ['PRESS', 'START', 'GAMEVERSE'];
const FLICKER = ['#D7FF3A', '#6F5BFF', '#C9C4DC', '#FFFFFF'];
const PAPER = '#FFFFFF';
const STEP = 0.07; // one letter per step
const TRAIL = 3; // letters behind the cursor that keep flickering

/** Fixed positions so the frame composes the same every time **/
const SPARKS = [
	{ x: 11, y: 18, kind: 'sq' },
	{ x: 24, y: 41, kind: 'plus' },
	{ x: 33, y: 63, kind: 'sq' },
	{ x: 47, y: 37, kind: 'plus' },
	{ x: 52, y: 70, kind: 'sq' },
	{ x: 64, y: 22, kind: 'plus' },
	{ x: 71, y: 58, kind: 'sq' },
	{ x: 83, y: 31, kind: 'sq' },
	{ x: 88, y: 49, kind: 'plus' },
	{ x: 16, y: 79, kind: 'plus' },
];

/** The flood: UV plates first, Signal on top; the last one always covers the screen **/
const PLATES = [
	{ x: 12, y: 34, tone: 'uv', scale: 3.4 },
	{ x: 78, y: 8, tone: 'uv', scale: 3 },
	{ x: 50, y: 66, tone: 'uv', scale: 4.2 },
	{ x: 30, y: 88, tone: 'signal', scale: 4.6 },
	{ x: 86, y: 74, tone: 'signal', scale: 5.4 },
	{ x: 8, y: 6, tone: 'signal', scale: 6 },
	{ x: 55, y: 40, tone: 'signal', scale: 9 },
];

const FLOOD_AT = 2.5;
const EXIT_AT = 3.3;

const HomeIntro = () => {
	const rootRef = useRef<HTMLDivElement>(null);
	const [gone, setGone] = useState(false);

	/** LIFECYCLES **/
	useEffect(() => {
		const root = rootRef.current;
		if (!root) return;
		if (introSeen()) {
			markIntroDone();
			setGone(true);
			return;
		}

		// Keeps the overlay visible through its exit, after the hand-over flags <html> as "skip"
		root.classList.add('is-playing');
		const html = document.documentElement;
		const previousOverflow = html.style.overflow;
		html.style.overflow = 'hidden';

		let handedOver = false;
		const handOver = () => {
			if (handedOver) return;
			handedOver = true;
			html.style.overflow = previousOverflow;
			markIntroDone();
		};
		const remove = () => {
			handOver();
			setGone(true);
		};

		const chars = Array.from(root.querySelectorAll<HTMLElement>('.gv-intro__char'));
		let timeline: gsap.core.Timeline | null = null;
		const mm = gsap.matchMedia();

		mm.add(MOTION_QUERY, () => {
			const q = gsap.utils.selector(root);
			const tl = gsap.timeline({ onComplete: remove });
			timeline = tl;

			// Typing: the cursor reveals a letter per step; the trail flickers, older letters settle to paper
			const paint = (step: number) => {
				chars.forEach((char, index) => {
					const age = step - index;
					char.style.visibility = age >= 0 ? 'visible' : 'hidden';
					if (age >= 0) {
						char.style.color = age <= TRAIL ? FLICKER[Math.floor(Math.random() * FLICKER.length)] : PAPER;
					}
				});
			};
			for (let step = 0; step <= chars.length + TRAIL; step += 1) {
				tl.call(paint, [step], step * STEP);
			}

			tl.fromTo(q('.gv-intro__hint'), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.4, ease: 'power2.out' }, 0.4)
				.fromTo(
					q('.gv-intro__label'),
					{ autoAlpha: 0, y: 12 },
					{ autoAlpha: 1, y: 0, duration: 0.6, ease: 'power4.out', stagger: 0.08 },
					0.8,
				);

			// Sparks twinkle once each around the settled headline
			q('.gv-intro__spark').forEach((spark, index) => {
				tl.fromTo(
					spark,
					{ xPercent: -50, yPercent: -50, autoAlpha: 1, scale: 0, rotation: -60 },
					{ scale: 1, rotation: 0, duration: 0.32, ease: 'power2.out', repeat: 1, yoyo: true },
					1.3 + index * 0.08,
				);
			});

			// Flood: cut plates swell from scattered points until Signal covers everything
			q('.gv-intro__plate').forEach((plate, index) => {
				tl.fromTo(
					plate,
					{ xPercent: -50, yPercent: -50, scale: 0 },
					{ scale: PLATES[index].scale, duration: 0.7 - index * 0.03, ease: 'power2.in' },
					FLOOD_AT + index * 0.06,
				);
			});

			// Exit: the covered stage lifts away and the hero reveal takes over
			tl.call(handOver, undefined, EXIT_AT + 0.12).to(root, { yPercent: -100, duration: 0.5, ease: 'power2.in' }, EXIT_AT);
		});

		mm.add('(prefers-reduced-motion: reduce)', () => {
			const tl = gsap.timeline({ onComplete: remove });
			timeline = tl;
			tl.call(handOver, undefined, 0.8).to(root, { autoAlpha: 0, duration: 0.3, ease: 'power2.out' }, 0.8);
		});

		// Any key or press jumps to the flood and plays it out quickly
		let skipped = false;
		const skip = (event: Event) => {
			if (skipped || !timeline) return;
			if (event instanceof KeyboardEvent && ['Shift', 'Control', 'Alt', 'Meta', 'Tab'].includes(event.key)) return;
			skipped = true;
			if (event instanceof KeyboardEvent && event.key === ' ') event.preventDefault();
			if (timeline.time() < FLOOD_AT) timeline.seek(FLOOD_AT - 0.01, false);
			timeline.timeScale(2.6);
		};
		window.addEventListener('keydown', skip);
		window.addEventListener('pointerdown', skip);

		// Fail-safe: never leave the page covered
		const failSafe = window.setTimeout(remove, 6000);

		return () => {
			window.removeEventListener('keydown', skip);
			window.removeEventListener('pointerdown', skip);
			window.clearTimeout(failSafe);
			html.style.overflow = previousOverflow;
			mm.revert();
		};
	}, []);

	if (gone) return null;

	let charIndex = 0;
	return (
		<div ref={rootRef} className="gv-intro" aria-hidden="true">
			<div className="gv-intro__stage">
				<div className="gv-intro__title">
					{LINES.map((line) => (
						<span key={line} className="gv-intro__line">
							{line.split('').map((letter) => (
								<span key={charIndex} className="gv-intro__char" data-index={charIndex++}>
									{letter}
								</span>
							))}
						</span>
					))}
				</div>
				<span className="gv-intro__label gv-intro__label--left">Player 1</span>
				<span className="gv-intro__label gv-intro__label--right">Ready</span>
				{SPARKS.map((spark, index) => (
					<span
						key={index}
						className={`gv-intro__spark gv-intro__spark--${spark.kind}`}
						style={{ left: `${spark.x}%`, top: `${spark.y}%` }}
					/>
				))}
			</div>
			<span className="gv-intro__hint">Press any key to skip</span>
			{PLATES.map((plate, index) => (
				<span
					key={index}
					className={`gv-intro__plate gv-intro__plate--${plate.tone}`}
					style={{ left: `${plate.x}%`, top: `${plate.y}%` }}
				/>
			))}
		</div>
	);
};

export default HomeIntro;
