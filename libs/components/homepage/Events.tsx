import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SCENE_QUERY, pad } from './homeMotion';
import { RailControls, useHomeRail } from './HomeRail';

interface EventData {
	eventTitle: string;
	city: string;
	description: string;
	imageSrc: string;
}
const eventsData: EventData[] = [
	{
		eventTitle: 'Indie Showcase',
		city: 'Online',
		description: 'Discover upcoming indie games from small studios and add them to your favorites before release.',
		imageSrc: '/img/gameverse/event-1.jpg',
	},
	{
		eventTitle: 'Co-op Weekend',
		city: 'Community',
		description: 'Team up with friends and explore co-op and multiplayer games picked by the community.',
		imageSrc: '/img/gameverse/event-2.jpg',
	},
	{
		eventTitle: 'Retro Game Night',
		city: 'Community',
		description: 'Share your favorite classics and talk about the games that started it all.',
		imageSrc: '/img/gameverse/event-3.jpg',
	},
	{
		eventTitle: 'Speedrun Marathon',
		city: 'Online',
		description: 'Watch fast runs of popular titles and post your own personal bests in the community.',
		imageSrc: '/img/gameverse/event-4.jpg',
	},
];

const EventCard = ({ event, index }: { event: EventData; index: number }) => {
	return (
		<article className={`gv-world-plate ${index % 2 ? 'is-right' : ''}`}>
			<div className="gv-world-plate__art">
				<img src={event?.imageSrc} alt="" loading="lazy" decoding="async" />
				<span className="gv-world-plate__index" aria-hidden>
					Event {pad(index + 1)}
				</span>
			</div>
			<div className="gv-world-plate__body">
				<span className="gv-world-plate__where">{event?.city}</span>
				<h3 className="gv-world-plate__title">{event?.eventTitle}</h3>
				<p className="gv-world-plate__desc">{event?.description}</p>
			</div>
		</article>
	);
};

const Events = () => {
	const rootRef = useRef<HTMLElement>(null);
	/** Narrow screens: the plates become a swipe rail (on desktop the list never scrolls, so no controls show) **/
	const rail = useHomeRail(eventsData.length);

	/** LIFECYCLES **/
	useEffect(() => {
		const root = rootRef.current;
		if (!root) return;
		gsap.registerPlugin(ScrollTrigger);

		const mm = gsap.matchMedia();
		mm.add(SCENE_QUERY, () => {
			// Each plate enters tilted, levels out at the centre of the screen and tilts away as it leaves
			root.querySelectorAll<HTMLElement>('.gv-world-plate').forEach((plate, index) => {
				const side = index % 2 ? -1 : 1;
				gsap.fromTo(
					plate,
					{ rotation: 6 * side, scale: 0.9, xPercent: 6 * side },
					{
						keyframes: [
							{ rotation: 0, scale: 1, xPercent: 0, duration: 0.5 },
							{ rotation: -4 * side, scale: 0.94, xPercent: -3 * side, duration: 0.5 },
						],
						ease: 'none',
						scrollTrigger: { trigger: plate, start: 'top bottom', end: 'bottom top', scrub: 0.5 },
					},
				);
			});
		});

		return () => mm.revert();
	}, []);

	return (
		<section className="gv-world" id="events" aria-labelledby="events-heading" ref={rootRef}>
			<div className="gv-world__inner">
				<header className="gv-world__head">
					<p className="gv-chapter" aria-hidden>
						<span>06</span>World map
					</p>
					<h2 className="gv-world__title" id="events-heading">
						Events
					</h2>
					<p className="gv-world__desc">Community events worth your attention.</p>
					<div className="gv-world__controls">
						<RailControls rail={rail} label="event" />
					</div>
				</header>
				<ul className="gv-world__list" aria-label="Events" ref={rail.trackRef as unknown as React.RefObject<HTMLUListElement>}>
					{eventsData.map((event: EventData, index: number) => (
						<li key={event?.eventTitle}>
							<EventCard event={event} index={index} />
						</li>
					))}
				</ul>
			</div>
		</section>
	);
};

export default Events;
