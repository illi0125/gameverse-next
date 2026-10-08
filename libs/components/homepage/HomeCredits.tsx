import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { MOTION_QUERY } from './homeMotion';

/** Homepage finale under the footer: an edge-to-edge GAMEVERSE wordmark that loops faster when you scroll faster **/
const HomeCredits = () => {
	const rootRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const root = rootRef.current;
		if (!root) return;
		gsap.registerPlugin(ScrollTrigger);

		const mm = gsap.matchMedia();
		mm.add(MOTION_QUERY, () => {
			const loop = gsap.to(root.querySelector('.gv-credits__track'), {
				xPercent: -50,
				duration: 28,
				ease: 'none',
				repeat: -1,
			});

			const trigger = ScrollTrigger.create({
				trigger: root,
				start: 'top bottom',
				end: 'bottom top',
				onUpdate: (self) => {
					const boost = 1 + Math.min(Math.abs(self.getVelocity()) / 300, 8);
					gsap.to(loop, { timeScale: boost * (self.direction < 0 ? -1 : 1), duration: 0.2, overwrite: true });
					gsap.to(loop, { timeScale: 1, duration: 1.2, delay: 0.25, overwrite: false });
				},
			});

			return () => {
				trigger.kill();
				loop.kill();
			};
		});

		return () => mm.revert();
	}, []);

	return (
		<div className="gv-credits" ref={rootRef} aria-hidden>
			<div className="gv-credits__track">
				<span>Gameverse</span>
				<span>Gameverse</span>
			</div>
		</div>
	);
};

export default HomeCredits;
